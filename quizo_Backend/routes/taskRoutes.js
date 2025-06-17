// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const Task = require('../modules/taskAndNotes/taskSchema');
const passport = require('passport');
const checkUserStatus = require('../middleware/checkUserStatus');

// Create a new task
router.post('/', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
  try {
    const { title, description, lastDate, priority, status, labels } = req.body;
    const userId = req.user._id;
    const newTask = new Task({ userId, title, description, lastDate, priority, status, labels });
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all tasks by user
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a task
router.put('/:id', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!task.userId.equals(req.user._id)) return res.status(403).json({ message: 'Not your task' });

    Object.assign(task, req.body);
    const updatedTask = await task.save();
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a task
router.delete('/:id', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!task.userId.equals(req.user._id)) return res.status(403).json({ message: 'Not your task' });

    await task.deleteOne();
    res.status(200).json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;