const express = require('express');
const router = express.Router();
const Notes = require('../modules/taskAndNotes/notesSchema');
const passport = require('passport');
const checkUserStatus = require('../middleware/checkUserStatus');

// Create a new note
router.post('/', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
  try {
    const { title, content, sharedWith, isPublic, tags, classId } = req.body;
    const author = req.user._id;

    const newNote = new Notes({ title, content, sharedWith, isPublic, tags, classId, author });
    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all notes by user
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const notes = await Notes.find({ author: req.user._id });
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific note
router.get('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const note = await Notes.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    // Check permissions
    const isOwner = note.author.equals(req.user._id);
    const shared = note.sharedWith.find(e => e.userId.equals(req.user._id));
    if (!isOwner && !note.isPublic && !shared) return res.status(403).json({ message: 'Access denied' });

    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a note
router.put('/:id', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
  try {
    const note = await Notes.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (!note.author.equals(req.user._id)) return res.status(403).json({ message: 'Not your note' });

    Object.assign(note, req.body, { updatedAt: new Date() });
    const updatedNote = await note.save();
    res.status(200).json(updatedNote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a note
router.delete('/:id', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
  try {
    const note = await Notes.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (!note.author.equals(req.user._id)) return res.status(403).json({ message: 'Not your note' });

    await note.deleteOne();
    res.status(200).json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;