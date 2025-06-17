const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
	post: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Post',
		required: true,
	},
	author: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	content: {
		type: String,
		required: true,
	},
	media: {
		url: String,
		type: { type: String, enum: ['image', 'video', 'gif'] }
	},
	metrics: {
		likeCount: { type: Number, default: 0, min: 0 },
		replyCount: { type: Number, default: 0, min: 0 }
	},
	replies: [{
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true
		},
		content: {
			type: String,
			required: true,
		},
		media: {
			url: String,
			type: { type: String, enum: ['image', 'video', 'gif'] }
		},
		metrics: {
			likeCount: { type: Number, default: 0, min: 0 }
		},
		createdAt: { type: Date, default: Date.now }
	}],
	createdAt: { type: Date, default: Date.now, index: true }
});


const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;