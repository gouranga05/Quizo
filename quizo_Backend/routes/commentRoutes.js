const express = require('express');
const router = express.Router();
const Comment = require('../modules/post/commentSchema');
const Post = require('../modules/post/postSchema');
const User = require('../modules/user/userSchema');
const mongoose = require('mongoose');
const passport = require('passport');
const checkUserStatus = require('../middleware/checkUserStatus');

// Create a new comment
router.post('/', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
    try {
        const { postId, content, media } = req.body;
        const authorId = req.user._id;

        // Validate post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const newComment = new Comment({
            post: postId,
            author: authorId,
            content,
            media
        });

        const savedComment = await newComment.save();

        // Update post's comment count
        await Post.findByIdAndUpdate(postId, { $inc: { 'metrics.commentCount': 1 } });

        res.status(201).json(savedComment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all comments for a post
router.get('/post/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }

        const comments = await Comment.find({ post: postId })
            .populate('author', 'username email role image')
            .sort({ createdAt: -1 });

        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a specific comment by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid comment ID' });
        }

        const comment = await Comment.findById(id)
            .populate('author', 'username email role image')
            .populate('post', 'content author');

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        res.status(200).json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a comment
router.put('/:id', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
    try {
        const { id } = req.params;
        const { content, media } = req.body;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid comment ID' });
        }

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if the user is the author of the comment
        if (comment.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You can only update your own comments' });
        }

        const updatedComment = await Comment.findByIdAndUpdate(
            id,
            { content, media },
            { new: true, runValidators: true }
        ).populate('author', 'username email role image');

        res.status(200).json(updatedComment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a comment
router.delete('/:id', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid comment ID' });
        }

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if the user is the author of the comment or an admin
        const user = await User.findById(userId);
        if (comment.author.toString() !== userId.toString() && user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only delete your own comments' });
        }

        // Decrement post's comment count
        await Post.findByIdAndUpdate(comment.post, { $inc: { 'metrics.commentCount': -1 } });

        await Comment.findByIdAndDelete(id);

        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add a reply to a comment
router.post('/:id/replies', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
    try {
        const { id } = req.params;
        const { content, media } = req.body;
        const authorId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid comment ID' });
        }

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const newReply = {
            author: authorId,
            content,
            media
        };

        comment.replies.push(newReply);
        comment.metrics.replyCount += 1;

        const updatedComment = await comment.save();

        res.status(201).json(updatedComment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Like a comment
router.post('/:id/like', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid comment ID' });
        }

        const comment = await Comment.findByIdAndUpdate(
            id,
            { $inc: { 'metrics.likeCount': 1 } },
            { new: true }
        );

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        res.status(200).json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Unlike a comment
router.post('/:id/unlike', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid comment ID' });
        }

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Ensure like count doesn't go below 0
        if (comment.metrics.likeCount > 0) {
            comment.metrics.likeCount -= 1;
            await comment.save();
        }

        res.status(200).json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;