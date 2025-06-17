const express = require('express');
const router = express.Router();
const passport = require('passport');
const SubscriptionPlan = require('../modules/user/subscriptionPlanSchema');
const mongoose = require('mongoose');

// ✅ Helper Role Checker
const isAdmin = (user) => user.role === 'admin';
const isMentor = (user) => user.role === 'mentor'; //etake dekhte hbe according to requirements 

// ✅ Create Subscription Plan (Admin or Mentor Only)
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (!isAdmin(req.user) && !isMentor(req.user)) {
      // if (!isAdmin(req.user)) {
        return res.status(403).json({ message: 'Only admins or mentors can create subscription plans' });
      }

      const { name, price, duration, features, isActive } = req.body;

      if (!name || !price || !duration) {
        return res.status(400).json({ message: 'Name, price, and duration are required' });
      }

      const newPlan = new SubscriptionPlan({
        name,
        price,
        duration,
        features,
        isActive,
      });

      const savedPlan = await newPlan.save();
      res.status(201).json(savedPlan);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ✅ Get All Active Subscription Plans (Public/Student View)
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const plans = await SubscriptionPlan.find({ isActive: true });
      res.status(200).json(plans);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ✅ Get Subscription Plan by ID
router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid subscription plan ID' });
      }

      const plan = await SubscriptionPlan.findById(id);
      if (!plan) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }

      res.status(200).json(plan);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ✅ Update Subscription Plan (Admin or Mentor Only)
router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (!isAdmin(req.user) && !isMentor(req.user)) {
        return res.status(403).json({ message: 'Only admins or mentors can update plans' });
      }

      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid subscription plan ID' });
      }

      const updatedPlan = await SubscriptionPlan.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!updatedPlan) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }

      res.status(200).json(updatedPlan);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ✅ Delete Subscription Plan (Admin or Mentor Only)
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (!isAdmin(req.user) && !isMentor(req.user)) {
        return res.status(403).json({ message: 'Only admins or mentors can delete plans' });
      }

      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid subscription plan ID' });
      }

      const deleted = await SubscriptionPlan.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }

      res.status(200).json({ message: 'Subscription plan deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
