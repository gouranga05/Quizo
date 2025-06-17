const express = require('express');
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');
const Quiz = require('../modules/question/quizSchema');

const isMentor = (user) => user.role === 'mentor';

// ✅ Create Quiz (Mentor Only)
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (!isMentor(req.user)) {
        return res.status(403).json({ message: 'Only mentors can create quizzes' });
      }

      const { subjectName, topicName, questions } = req.body;

      if (!subjectName || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'Required fields missing or invalid questions' });
      }

      const newQuiz = new Quiz({
        subjectName,
        topicName,
        questions,
        createdBy: req.user._id
      });

      const savedQuiz = await newQuiz.save();
      res.status(201).json(savedQuiz);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ✅ Get All Quizzes (filter by subject/topic optional)
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { subject, topic } = req.query;
      const filter = {};

      if (subject) filter.subjectName = subject;
      if (topic) filter.topicName = topic;

      const quizzes = await Quiz.find(filter).populate('createdBy', 'name role');
      res.status(200).json(quizzes);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ✅ Get Quiz by ID
router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid quiz ID' });
      }

      const quiz = await Quiz.findById(id).populate('createdBy', 'name role');
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }

      res.status(200).json(quiz);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ✅ Update Quiz (Mentor Only)
router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (!isMentor(req.user)) {
        return res.status(403).json({ message: 'Only mentors can update quizzes' });
      }

      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid quiz ID' });
      }

      const updatedQuiz = await Quiz.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
      });

      if (!updatedQuiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }

      res.status(200).json(updatedQuiz);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ✅ Delete Quiz (Mentor Only)
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

      const deletedQuiz = await Quiz.findByIdAndDelete(id);
      if (!deletedQuiz) {
        return res.status(404).json({ message: 'Quiz not found' });
      }

      res.status(200).json({ message: 'Quiz deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
