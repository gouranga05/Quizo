const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    image: {
        type: String,
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: Number,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'admin', 'mentor'],
        default: 'student'
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    joindClass: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class'
        }
    ],
    subscription: {
        isActive: { type: Boolean, default: false },
        startDate: Date,
        endDate: Date,
        plan: { type: String, enum: ['monthly', 'yearly', 'lifetime'], default: 'monthly' }
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;