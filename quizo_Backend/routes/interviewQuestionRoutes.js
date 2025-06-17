const express = require('express');
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');
const InterviewQuestion = require('../modules/question/interviewQuestionSchema');

const isMentor = (user) => user.role === 'mentor';

// ✅ Create interview questions (Mentor only)
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (!isMentor(req.user)) {
        return res.status(403).json({ message: 'Only mentors can add interview questions' });
      }

      const { subjectName, topicName, questions } = req.body;

      if (!subjectName || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'Required fields missing or invalid questions' });
      }

      const newInterview = new InterviewQuestion({
        subjectName,
        topicName,
        questions,
        createdBy: req.user._id
      });

      const savedInterview = await newInterview.save();
      res.status(201).json(savedInterview);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ✅ Get all interview questions (filter by subject or topic optional)
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { subject, topic } = req.query;
      let filter = {};

      if (subject) filter.subjectName = subject;
      if (topic) filter.topicName = topic;

      const interviews = await InterviewQuestion.find(filter).populate('createdBy', 'name role');
      res.status(200).json(interviews);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ✅ Get interview questions by ID
router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid interview ID' });
      }

      const interview = await InterviewQuestion.findById(id).populate('createdBy', 'name role');
      if (!interview) {
        return res.status(404).json({ message: 'Interview question set not found' });
      }

      res.status(200).json(interview);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ✅ Update interview questions (Mentor only)
router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (!isMentor(req.user)) {
        return res.status(403).json({ message: 'Only mentors can update interview questions' });
      }

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid interview ID' });
      }

      const updated = await InterviewQuestion.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
      });

      if (!updated) {
        return res.status(404).json({ message: 'Interview question set not found' });
      }

      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ✅ Delete interview questions (Mentor only)
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (!isMentor(req.user)) {
        return res.status(403).json({ message: 'Only mentors can delete interview questions' });
      }

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid interview ID' });
      }

      const deleted = await InterviewQuestion.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Interview question set not found' });
      }

      res.status(200).json({ message: 'Interview question set deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
