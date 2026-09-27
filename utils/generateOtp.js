// Generates a 6-digit numeric OTP code as a string
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOtpExpiry() {
  const minutes = parseInt(process.env.OTP_EXPIRES_MIN || '10', 10);
  return new Date(Date.now() + minutes * 60 * 1000);
}

module.exports = { generateOtp, getOtpExpiry };
