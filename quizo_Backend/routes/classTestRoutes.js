const express = require('express');
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');
const ClassTest = require('../modules/question/classTestSchema');

// Utility: Check for mentor role
const isMentor = (user) => user.role === 'mentor';

// Create a class test (only mentors allowed)
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (!isMentor(req.user)) {
        return res.status(403).json({ message: 'Only mentors can create class tests' });
      }

      const {
        classId,
        testName,
        testDescription,
        questions,
        totalPoints,
        timeLimit,
        testDate,
        testDuration,
        startTime,
        endTime
      } = req.body;

      // Basic field validation
      if (!classId || !testName || !testDescription || !questions || !testDate || !testDuration || !startTime || !endTime) {
        return res.status(400).json({ message: 'Required fields missing' });
      }

      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }

      const newTest = new ClassTest({
        classId,
        createdBy: req.user._id,
        testName,
        questions,
        testDescription,
        totalPoints,
        timeLimit,
        testDate,
        testDuration,
        startTime,
        endTime
      });

      const savedTest = await newTest.save();
      res.status(201).json(savedTest);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get all class tests for a specific class (auth required)
router.get(
  '/class/:classId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { classId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }

      const tests = await ClassTest.find({ classId })
        .populate('classId')
        .populate('questions')
        .sort({ testDate: -1 });

      res.status(200).json(tests);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get a single class test by ID
router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid test ID' });
      }

      const test = await ClassTest.findById(id).populate('classId').populate('questions');
      if (!test) {
        return res.status(404).json({ message: 'Class test not found' });
      }

      res.status(200).json(test);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Update a class test (mentor only)
router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (!isMentor(req.user)) {
        return res.status(403).json({ message: 'Only mentors can update class tests' });
      }

      const { id } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid test ID' });
      }

      const updatedTest = await ClassTest.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      });

      if (!updatedTest) {
        return res.status(404).json({ message: 'Class test not found' });
      }

      res.status(200).json(updatedTest);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete a class test (mentor only)
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (!isMentor(req.user)) {
        return res.status(403).json({ message: 'Only mentors can delete class tests' });
      }

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid test ID' });
      }

      const deletedTest = await ClassTest.findByIdAndDelete(id);
      if (!deletedTest) {
        return res.status(404).json({ message: 'Class test not found' });
      }

      res.status(200).json({ message: 'Class test deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
