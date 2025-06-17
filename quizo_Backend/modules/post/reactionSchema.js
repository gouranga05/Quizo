const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
	contentType: {
		type: String,
		required: true,
		enum: ['Post', 'Comment', 'Reply']
	},
	contentId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
	},
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	type: {
		type: String,
		enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
		default: 'like'
	},
	createdAt: { type: Date, default: Date.now, index: true }
});


const Reaction = mongoose.model('Reaction', reactionSchema);

module.exports = Reaction;