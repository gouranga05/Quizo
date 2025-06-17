const express = require('express');
const app = express();
const dotenv = require('dotenv');
const passport = require('passport');


const db = require('./config/db');
require('./middleware/passport-config')

const userRoutes = require('./routes/userRoutes');
const classRoutes = require('./routes/classRoutes');

const commentRoutes = require('./routes/commentRoutes');
const postRoutes = require('./routes/postRoutes');
const reactionRoutes = require('./routes/reactionRoutes');

const notificationRoutes = require('./routes/notificationRoutes');
const weeklyQuizRoutes = require('./routes/weeklyQuizRoutes');

const classTestRoutes = require('./routes/classTestRoutes');
const interviewQuestionRoutes = require('./routes/interviewQuestionRoutes');
const quizRoutes = require('./routes/quizRoutes');

const notesRoutes = require('./routes/notesRoutes');
const taskRoutes = require('./routes/taskRoutes');

const subscriptionPlanRoutes = require('./routes/subscriptionPlanRoutes');



dotenv.config();

app.use(express.json());
app.use(passport.initialize());

app.use('/user', userRoutes); //tested all
app.use('/class', classRoutes); //tested all including join class using different users and admin
app.use('/api/comments', commentRoutes);  //tsted all like unlike all
app.use('/api/posts', postRoutes);  //tested all
app.use('/api/reactions', reactionRoutes);  //all tested
app.use('/api/subscriptions', subscriptionPlanRoutes); // all tested
app.use('/notifications', notificationRoutes);  //tested all
app.use('/weeklyQuiz', weeklyQuizRoutes);  //tested all

app.use('/classTest', classTestRoutes);  //tested all routes
app.use('/interviewQuestion', interviewQuestionRoutes); // tested all routes
app.use('/quiz', quizRoutes);  // all routes tested

app.use('/notes', notesRoutes);  //all tested, remove er jaygay delete one function ta use
app.use('/tasks', taskRoutes);   // all tested remove er jaygay delete one function ta use

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});