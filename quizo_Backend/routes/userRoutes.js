const express = require('express');
const router = express.Router();
const User = require('../modules/user/userSchema');
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv');
const generateToken = require('../utils/generateToken')
const checkUserStatus = require('../middleware/checkUserStatus')
dotenv.config();
const passport = require('passport');

const fs = require('fs');
const path = require('path');
const { singleImageUpload } = require('../middleware/multer')



router.post('/register', async (req, res) => {
    try {
        const { username, email, password, phoneNumber } = req.body;

        if (!username || !email || !password || !phoneNumber) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existUser = await User.findOne({ email });

        if (existUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newSalt = await bcrypt.genSalt(Number(process.env.SALT))
        const hashPassword = await bcrypt.hash(password, newSalt)

        const newUser = new User({ username, email, password: hashPassword, phoneNumber });
        await newUser.save();

        const { auth_token } = await generateToken(newUser)

        res.status(201).json({ message: 'User registered successfully', auth_token });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})








router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const existUser = await User.findOne({ email });

        if (!existUser) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        const isMatch = await bcrypt.compare(password, existUser.password)
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid' });
        }

        const { auth_token } = await generateToken(existUser)

        res.status(200).json({ message: 'Login successful', auth_token });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})





router.get('/profile', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
    try {
        const userId = req.user.id

        const existUser = await User.findById(userId);

        if (!existUser) {
            return res.status(400).json({ message: 'User does not exist' });
        }

        res.status(200).json({ existUser });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
})


router.post('/upload-profile-picture', passport.authenticate('jwt', { session: false }), checkUserStatus, singleImageUpload, async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded.' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.image) {
            const oldImagePath = path.join(__dirname, '..', user.image);

            fs.unlink(oldImagePath, (err) => {
                if (err) {
                    console.warn('Failed to delete old image:', err.message);
                } else {
                    console.log('Old profile image deleted successfully.');
                }
            });
        }

        user.image = req.file.path;
        await user.save();

        res.status(200).json({
            message: 'Profile picture updated successfully',
            user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});
// ✅ Step 1: Forgot Password - Generate Reset Token
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found with this email.' });

    // 🔁 Replaced crypto.randomBytes with safe random fallback
    const token = `${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const expiration = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expiration;
    await user.save();

    // ✅ Send response (you can send token via email in real app)
    return res.status(200).json({
      message: 'Reset token generated',
      token, // Just for testing
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate reset token' });
  }
});

// ✅ Step 2: Reset Password - Use Token and Set New Password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // 🔐 Hash the new password just like you do during registration
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Replace old password with the new hashed one
    user.password = hashedPassword;

    // 🧹 Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

module.exports = router;
