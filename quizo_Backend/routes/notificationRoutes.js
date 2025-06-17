const express = require('express');
const router = express.Router();
const passport = require('passport');
const Notification = require('../modules/others/notificationSchema');
const mongoose = require('mongoose');

// Create a notification (auth required, any user can create notifications for themselves or system)
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { user, message, type } = req.body;

      if (!user || !message || !type) {
        return res.status(400).json({ message: 'user, message, and type are required' });
      }

      // Optional: restrict creation so that users can only create notifications for themselves or system notifications
      if (req.user.role !== 'mentor' && req.user.role !== 'student' && req.user._id.toString() !== user) {
        return res.status(403).json({ message: 'Not authorized to create notification for this user' });
      }

      const notification = new Notification({ user, message, type });
      const savedNotification = await notification.save();

      res.status(201).json(savedNotification);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get all notifications for the logged in user
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Mark notification as read by id
router.put(
  '/:id/read',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
      }

      // Only allow marking read if notification belongs to user
      const notification = await Notification.findOne({ _id: id, user: req.user._id });
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      notification.isRead = true;
      await notification.save();

      res.status(200).json(notification);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete notification by id (only owner can delete)
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
      }

      const notification = await Notification.findOne({ _id: id, user: req.user._id });
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      await notification.deleteOne();

      res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
