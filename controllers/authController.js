const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { generateOtp, getOtpExpiry } = require('../utils/generateOtp');
const { sendOtpEmail } = require('../utils/sendEmail');

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function createAndSendOtp(email, purpose, payload = {}) {
  const code = generateOtp();
  const expiresAt = getOtpExpiry();

  // Invalidate any previous unconsumed OTPs for the same email/purpose
  await Otp.updateMany(
    { email, purpose, consumed: false },
    { $set: { consumed: true } }
  );

  await Otp.create({ email, code, purpose, payload, expiresAt });
  await sendOtpEmail(email, code, purpose);
}

/**
 * STEP 1 of Signup: validate input, ensure email not already registered,
 * stash the (hashed) new-user data in an OTP record, and email the code.
 * The user is only created in the User collection once the OTP is verified.
 */
exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await createAndSendOtp(email.toLowerCase(), 'signup', {
      username,
      hashedPassword,
    });

    res.status(200).json({
      message: 'OTP sent to your email. Please verify to complete signup.',
      email: email.toLowerCase(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

/**
 * STEP 2 of Signup: verify OTP, then actually create the User document.
 */
exports.verifySignupOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and OTP code are required' });
    }

    const otpDoc = await Otp.findOne({
      email: email.toLowerCase(),
      purpose: 'signup',
      consumed: false,
    }).sort({ createdAt: -1 });

    if (!otpDoc || otpDoc.code !== code) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }
    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please sign up again.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Account already exists, please sign in.' });
    }

    // Build user directly with the already-hashed password to avoid
    // double-hashing via the pre-save hook.
    const user = new User({
      username: otpDoc.payload.username,
      email: email.toLowerCase(),
      password: otpDoc.payload.hashedPassword, // already bcrypt-hashed
      isVerified: true,
    });
    user._skipHash = true; // prevent pre-save hook from re-hashing
    await user.save();

    otpDoc.consumed = true;
    await otpDoc.save();

    const token = signToken(user);
    res.status(201).json({ message: 'Account created successfully', token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

/**
 * Sign in with email + password. Password is checked first; if OTP-based
 * sign-in is desired, an OTP is then sent and verified via /signin/verify-otp.
 */
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    await createAndSendOtp(email.toLowerCase(), 'signin', {});

    res.status(200).json({
      message: 'Password verified. OTP sent to your email to complete sign in.',
      email: email.toLowerCase(),
      otpRequired: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during sign in' });
  }
};

exports.verifySigninOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and OTP code are required' });
    }

    const otpDoc = await Otp.findOne({
      email: email.toLowerCase(),
      purpose: 'signin',
      consumed: false,
    }).sort({ createdAt: -1 });

    if (!otpDoc || otpDoc.code !== code) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }
    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please sign in again.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    otpDoc.consumed = true;
    await otpDoc.save();

    const token = signToken(user);
    res.status(200).json({ message: 'Signed in successfully', token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

/**
 * Forgot password: request an OTP to be sent to the account email.
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Avoid leaking which emails are registered
      return res.status(200).json({
        message: 'If that email is registered, an OTP has been sent.',
      });
    }

    await createAndSendOtp(email.toLowerCase(), 'forgot-password', {});

    res.status(200).json({ message: 'If that email is registered, an OTP has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during forgot password request' });
  }
};

/**
 * Reset password after verifying the forgot-password OTP.
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP code and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const otpDoc = await Otp.findOne({
      email: email.toLowerCase(),
      purpose: 'forgot-password',
      consumed: false,
    }).sort({ createdAt: -1 });

    if (!otpDoc || otpDoc.code !== code) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }
    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword; // will be hashed by pre-save hook
    await user.save();

    otpDoc.consumed = true;
    await otpDoc.save();

    res.status(200).json({ message: 'Password reset successfully. Please sign in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

/**
 * Change password (logged-in user). Requires current password, then sends
 * an OTP to confirm before applying the change.
 */
exports.requestChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    await createAndSendOtp(user.email, 'change-password', { newPassword });

    res.status(200).json({ message: 'OTP sent to your email to confirm password change.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during change password request' });
  }
};

exports.confirmChangePassword = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'OTP code is required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otpDoc = await Otp.findOne({
      email: user.email,
      purpose: 'change-password',
      consumed: false,
    }).sort({ createdAt: -1 });

    if (!otpDoc || otpDoc.code !== code) {
      return res.status(400).json({ message: 'Invalid OTP code' });
    }
    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please try again.' });
    }

    user.password = otpDoc.payload.newPassword; // hashed by pre-save hook
    await user.save();

    otpDoc.consumed = true;
    await otpDoc.save();

    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during change password confirmation' });
  }
};

/**
 * Generic resend-OTP endpoint for any purpose.
 */
exports.resendOtp = async (req, res) => {
  try {
    const { email, purpose } = req.body;
    const allowed = ['signup', 'signin', 'forgot-password', 'change-password'];
    if (!email || !purpose || !allowed.includes(purpose)) {
      return res.status(400).json({ message: 'Valid email and purpose are required' });
    }

    const lastOtp = await Otp.findOne({ email: email.toLowerCase(), purpose }).sort({
      createdAt: -1,
    });
    if (!lastOtp) {
      return res.status(400).json({ message: 'No pending request found for this email' });
    }

    await createAndSendOtp(email.toLowerCase(), purpose, lastOtp.payload);
    res.status(200).json({ message: 'OTP resent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while resending OTP' });
  }
};
