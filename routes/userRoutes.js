const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/userController');

router.use(auth);

router.get('/me', getProfile);
router.put('/me', updateProfile);

module.exports = router;
