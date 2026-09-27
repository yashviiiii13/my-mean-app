const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  signup,
  verifySignupOtp,
  signin,
  verifySigninOtp,
  forgotPassword,
  resetPassword,
  requestChangePassword,
  confirmChangePassword,
  resendOtp,
} = require('../controllers/authController');

router.post('/signup', signup);
router.post('/signup/verify-otp', verifySignupOtp);

router.post('/signin', signin);
router.post('/signin/verify-otp', verifySigninOtp);

router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.post('/change-password/request', auth, requestChangePassword);
router.post('/change-password/confirm', auth, confirmChangePassword);

router.post('/resend-otp', resendOtp);

module.exports = router;
