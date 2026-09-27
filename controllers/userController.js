const User = require('../models/User');

// GET /api/users/me
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// PUT /api/users/me  (update username only; email changes are not allowed here)
exports.updateProfile = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username: username.trim() },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};
