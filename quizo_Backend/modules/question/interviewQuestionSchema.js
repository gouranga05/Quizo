const mongoose = require('mongoose');

const interviewQuestionSchema = new mongoose.Schema({
    subjectName: {
        type: String,
        required: true
    },
    topicName: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    questions: [{
        questionText: {
            type: String,
            required: true
        },
        answer: {
            type: String,
            required: true
        },
        difficulty: { 
            type: String, 
            enum: ['easy', 'medium', 'hard'], 
            default: 'medium' 
        },
    }],
}, { timestamps: true });


const InterviewQuestion = mongoose.model('InterviewQuestion', interviewQuestionSchema);

module.exports = InterviewQuestion;