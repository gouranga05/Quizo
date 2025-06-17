const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
	author: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	content: {
		text: { type: String, trim: true, maxlength: 2000 },
		media: [{
			url: { type: String, required: true },
			type: { type: String, enum: ['image', 'video', 'gif'] },
			thumbnail: String
		}]
	},
	metrics: {
		likeCount: { type: Number, default: 0, min: 0 },
		commentCount: { type: Number, default: 0, min: 0 },
		viewCount: { type: Number, default: 0, min: 0 }
	},
	tags: [{ type: String, index: true }],
}, { timestamps: true });


const Post = mongoose.model('Post', postSchema);

module.exports = Post;