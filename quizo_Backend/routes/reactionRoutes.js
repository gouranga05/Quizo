const express = require('express');
const router = express.Router();
const Reaction = require('../modules/post/reactionSchema');
const passport = require('passport');
const checkUserStatus = require('../middleware/checkUserStatus');
const mongoose = require('mongoose');

// React to a post/comment/reply
router.post('/', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
    try {
        const { contentType, contentId, type } = req.body;
        const userId = req.user._id;

        if (!['Post', 'Comment', 'Reply'].includes(contentType)) {
            return res.status(400).json({ message: 'Invalid content type' });
        }

        const existingReaction = await Reaction.findOne({ contentType, contentId, user: userId });

        if (existingReaction) {
            return res.status(400).json({ message: 'Already reacted. Use update endpoint.' });
        }

        const newReaction = new Reaction({
            contentType,
            contentId,
            user: userId,
            type
        });

        await newReaction.save();
        res.status(201).json(newReaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update reaction
router.put('/:id', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.body;
        const userId = req.user._id;

        const reaction = await Reaction.findById(id);
        if (!reaction) return res.status(404).json({ message: 'Reaction not found' });

        if (reaction.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You can only update your own reaction' });
        }

        reaction.type = type;
        const updated = await reaction.save();
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete reaction
router.delete('/:id', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const reaction = await Reaction.findById(id);
        if (!reaction) return res.status(404).json({ message: 'Reaction not found' });

        if (reaction.user.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not allowed to delete this reaction' });
        }

        await Reaction.findByIdAndDelete(id);
        res.status(200).json({ message: 'Reaction removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
