const express = require('express');
const router = express.Router();
const passport = require('passport');
const WeeklyQuiz = require('../modules/others/weeklyQuizSchema');
const mongoose = require('mongoose');

// Helper function to check mentor role
const isMentor = (user) => user.role === 'mentor';

// Create a new weekly quiz (only mentor)
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (!isMentor(req.user)) {
        return res.status(403).json({ message: 'Only mentors can create quizzes' });
      }

      const { testName, questions, testDescription, testDate, testDuration, startTime, endTime } = req.body;

      if (!testName || !testDescription || !testDate || !testDuration || !startTime || !endTime) {
        return res.status(400).json({ message: 'Required fields missing' });
      }

      const quiz = new WeeklyQuiz({
        testName,
        questions,
        testDescription,
        testDate,
        testDuration,
        startTime,
        endTime
      });

      const savedQuiz = await quiz.save();
      res.status(201).json(savedQuiz);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get all weekly quizzes (any logged in user)
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const quizzes = await WeeklyQuiz.find().populate('questions').sort({ testDate: -1 });
      res.status(200).json(quizzes);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get weekly quiz by ID
router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid quiz ID' });
      }

      const quiz = await WeeklyQuiz.findById(id).populate('questions');
      if (!quiz) {
        return res.status(404).json({ message: 'Weekly quiz not found' });
      }

      res.status(200).json(quiz);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Update weekly quiz by ID (only mentor)
router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (!isMentor(req.user)) {
        return res.status(403).json({ message: 'Only mentors can update quizzes' });
      }

      const { id } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid quiz ID' });
      }

      const updatedQuiz = await WeeklyQuiz.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      });

      if (!updatedQuiz) {
        return res.status(404).json({ message: 'Weekly quiz not found' });
      }

      res.status(200).json(updatedQuiz);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete weekly quiz by ID (only mentor)
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (!isMentor(req.user)) {
        return res.status(403).json({ message: 'Only mentors can delete quizzes' });
      }

      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid quiz ID' });
      }

      const deletedQuiz = await WeeklyQuiz.findByIdAndDelete(id);
      if (!deletedQuiz) {
        return res.status(404).json({ message: 'Weekly quiz not found' });
      }

      res.status(200).json({ message: 'Weekly quiz deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Add or update leaderboard entry (any authenticated user can submit their result)
router.post(
  '/:id/leaderboard',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { studentId, score, timeTaken, rank } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ message: 'Invalid ID(s)' });
      }

      if (studentId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only update your own leaderboard entry' });
      }

      const quiz = await WeeklyQuiz.findById(id);
      if (!quiz) {
        return res.status(404).json({ message: 'Weekly quiz not found' });
      }

      const existingIndex = quiz.leaderboard.findIndex(e => e.studentId.toString() === studentId);
      if (existingIndex !== -1) {
        quiz.leaderboard[existingIndex] = { studentId, score, timeTaken, rank };
      } else {
        quiz.leaderboard.push({ studentId, score, timeTaken, rank });
      }

      await quiz.save();

      res.status(200).json({ message: 'Leaderboard updated', leaderboard: quiz.leaderboard });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
