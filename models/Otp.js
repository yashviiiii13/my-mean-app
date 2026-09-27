const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    code: { type: String, required: true },
    purpose: {
      type: String,
      enum: ['signup', 'signin', 'forgot-password', 'change-password'],
      required: true,
    },
    // Used to stash pending data (e.g. hashed password + username on signup,
    // or the new password on change/forgot flows) until OTP is verified.
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date, required: true },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-delete expired OTP documents
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', OtpSchema);
