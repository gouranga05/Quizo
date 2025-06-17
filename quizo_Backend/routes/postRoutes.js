const express = require('express');
const router = express.Router();
const Post = require('../modules/post/postSchema');
const User = require('../modules/user/userSchema');
const passport = require('passport');
const checkUserStatus = require('../middleware/checkUserStatus');
const mongoose = require('mongoose');

// Create a post
router.post('/', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
    try {
        const { text, media, tags } = req.body;
        const author = req.user._id;

        const newPost = new Post({
            author,
            content: { text, media },
            tags
        });

        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'username email role image')
            .sort({ createdAt: -1 });

        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get post by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }

        const post = await Post.findById(id)
            .populate('author', 'username email role image');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update post
router.put('/:id', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
    try {
        const { id } = req.params;
        const { text, media, tags } = req.body;
        const userId = req.user._id;

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        if (post.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this post' });
        }

        post.content.text = text || post.content.text;
        post.content.media = media || post.content.media;
        post.tags = tags || post.tags;

        const updatedPost = await post.save();
        res.status(200).json(updatedPost);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete post
router.delete('/:id', passport.authenticate('jwt', { session: false }), checkUserStatus, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        const user = await User.findById(userId);
        if (post.author.toString() !== userId.toString() && user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        await post.deleteOne();
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
