const express = require('express');
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');
const Class = require('../modules/others/classSchema');
const User = require('../modules/user/userSchema');

// Utility: Check for mentor role
const isMentor = (user) => user.role === 'mentor';

// Generate a random join code
const generateJoinCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Create a new class (mentor only)
router.post(
  '/createClass',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (!isMentor(req.user)) {
        return res.status(403).json({ message: 'Only mentors can create classes' });
      }

      const { classTopic, className, classDescription, mentors } = req.body;

      const mentorUsers = await User.find({
        _id: { $in: mentors },
        role: 'mentor',
      });

      if (mentorUsers.length !== mentors.length) {
        return res.status(400).json({ message: 'Invalid mentors list' });
      }

      const newClass = new Class({
        classTopic,
        className,
        classDescription,
        mentors,
        joinCode: generateJoinCode(),
      });

      const savedClass = await newClass.save();

      await User.updateMany(
        { _id: { $in: mentors } },
        { $addToSet: { joindClass: savedClass._id } }
      );

      res.status(201).json(savedClass);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get all classes (authenticated)
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const classes = await Class.find()
        .populate('mentors', 'username email role')
        .populate('students', 'username email role');
      res.status(200).json(classes);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get class by ID (authenticated)
router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }

      const classData = await Class.findById(id)
        .populate('mentors', 'username email role image')
        .populate('students', 'username email role image');

      if (!classData) {
        return res.status(404).json({ message: 'Class not found' });
      }

      res.status(200).json(classData);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Update class (mentor only)
router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (!isMentor(req.user)) {
        return res.status(403).json({ message: 'Only mentors can update classes' });
      }

      const { id } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }

      if (updateData.mentors) {
        const currentClass = await Class.findById(id);
        if (!currentClass) {
          return res.status(404).json({ message: 'Class not found' });
        }

        const mentorUsers = await User.find({
          _id: { $in: updateData.mentors },
          role: 'mentor',
        });

        if (mentorUsers.length !== updateData.mentors.length) {
          return res.status(400).json({ message: 'One or more mentors are invalid' });
        }

        const mentorsToRemove = currentClass.mentors.filter(
          mentor => !updateData.mentors.includes(mentor.toString())
        );

        const mentorsToAdd = updateData.mentors.filter(
          mentor => !currentClass.mentors.includes(new mongoose.Types.ObjectId(mentor))
        );

        if (mentorsToRemove.length > 0) {
          await User.updateMany(
            { _id: { $in: mentorsToRemove } },
            { $pull: { joindClass: id } }
          );
        }

        if (mentorsToAdd.length > 0) {
          await User.updateMany(
            { _id: { $in: mentorsToAdd } },
            { $addToSet: { joindClass: id } }
          );
        }
      }

      const updatedClass = await Class.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).populate('mentors students');

      if (!updatedClass) {
        return res.status(404).json({ message: 'Class not found' });
      }

      res.status(200).json(updatedClass);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete class (mentor only)
router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (!isMentor(req.user)) {
        return res.status(403).json({ message: 'Only mentors can delete classes' });
      }

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }

      const classToDelete = await Class.findById(id);
      if (!classToDelete) {
        return res.status(404).json({ message: 'Class not found' });
      }

      await User.updateMany(
        { _id: { $in: [...classToDelete.mentors, ...classToDelete.students] } },
        { $pull: { joindClass: id } }
      );

      await Class.findByIdAndDelete(id);

      res.status(200).json({ message: 'Class deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Join a class using join code (authenticated)
router.post(
  '/join',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { joinCode } = req.body;
      const userId = req.user._id;

      const classToJoin = await Class.findOne({ joinCode });
      if (!classToJoin) {
        return res.status(404).json({ message: 'Class not found with this join code' });
      }

      if (
        classToJoin.students.includes(userId) ||
        classToJoin.mentors.includes(userId)
      ) {
        return res.status(400).json({ message: 'You are already in this class' });
      }

      const user = await User.findById(userId);

      if (user.role === 'mentor') {
        classToJoin.mentors.push(userId);
      } else {
        classToJoin.students.push(userId);
      }

      user.joindClass.push(classToJoin._id);

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        await classToJoin.save({ session });
        await user.save({ session });
        await session.commitTransaction();

        res.status(200).json({
          message: 'Successfully joined class',
          class: classToJoin,
        });
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Remove a user (mentor or student) from a class (admin only)
router.put(
  '/:classId/removeUser/:userId',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admin can remove users from a class' });
      }

      const { classId, userId } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(classId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return res.status(400).json({ message: 'Invalid class or user ID' });
      }

      const classData = await Class.findById(classId);
      if (!classData) {
        return res.status(404).json({ message: 'Class not found' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const wasMentor = classData.mentors.includes(userId);
      const wasStudent = classData.students.includes(userId);

      if (!wasMentor && !wasStudent) {
        return res.status(400).json({ message: 'User is not a member of this class' });
      }

      if (wasMentor) {
        classData.mentors.pull(userId);
      } else if (wasStudent) {
        classData.students.pull(userId);
      }

      user.joindClass.pull(classId);

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        await classData.save({ session });
        await user.save({ session });
        await session.commitTransaction();

        res.status(200).json({ message: 'User removed from class successfully' });
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);


module.exports = router;




























// const express = require('express');
// const router = express.Router();
// const Class = require('../modules/others/classSchema');
// const User = require('../modules/user/userSchema');
// const mongoose = require('mongoose');

// // Generate a random join code
// const generateJoinCode = () => {
//     return Math.random().toString(36).substring(2, 8).toUpperCase();
// };

// // Create a new class
// router.post('/createClass', async (req, res) => {
//     try {
//         const { classTopic, className, classDescription, mentors } = req.body;
        
//         const mentorUsers = await User.find({ 
//             _id: { $in: mentors },
//             role: 'mentor'
//         });
        
//         if (mentorUsers.length !== mentors.length) {
//             return res.status(400).json({ message: 'One or more mentors are invalid or not mentor role' });
//         }
        
//         const newClass = new Class({
//             classTopic,
//             className,
//             classDescription,
//             mentors,
//             joinCode: generateJoinCode()
//         });
        
//         const savedClass = await newClass.save();
        
//         await User.updateMany(
//             { _id: { $in: mentors } },
//             { $addToSet: { joindClass: savedClass._id } }
//         );
        
//         res.status(201).json(savedClass);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// // Get all classes
// router.get('/', async (req, res) => {
//     try {
//         const classes = await Class.find()
//             .populate('mentors', 'username email role')
//             .populate('students', 'username email role');
//         res.status(200).json(classes);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// // Get class by ID
// router.get('/:id', async (req, res) => {
//     try {
//         const { id } = req.params;
        
//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             return res.status(400).json({ message: 'Invalid class ID' });
//         }
        
//         const classData = await Class.findById(id)
//             .populate('mentors', 'username email role image')
//             .populate('students', 'username email role image');
            
//         if (!classData) {
//             return res.status(404).json({ message: 'Class not found' });
//         }
        
//         res.status(200).json(classData);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// // Update class by ID
// router.put('/:id', async (req, res) => {
//     try {
//         const { id } = req.params;
//         const updateData = req.body;
        
//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             return res.status(400).json({ message: 'Invalid class ID' });
//         }
        
//         if (updateData.mentors) {
//             const currentClass = await Class.findById(id);
//             if (!currentClass) {
//                 return res.status(404).json({ message: 'Class not found' });
//             }
            
//             const mentorUsers = await User.find({ 
//                 _id: { $in: updateData.mentors },
//                 role: 'mentor'
//             });
            
//             if (mentorUsers.length !== updateData.mentors.length) {
//                 return res.status(400).json({ message: 'One or more mentors are invalid or not mentor role' });
//             }
            
//             const mentorsToRemove = currentClass.mentors.filter(
//                 mentor => !updateData.mentors.includes(mentor.toString())
//             );
            
//             const mentorsToAdd = updateData.mentors.filter(
//                 mentor => !currentClass.mentors.includes(new mongoose.Types.ObjectId(mentor))
//             );
            
//             if (mentorsToRemove.length > 0) {
//                 await User.updateMany(
//                     { _id: { $in: mentorsToRemove } },
//                     { $pull: { joindClass: id } }
//                 );
//             }
            
//             if (mentorsToAdd.length > 0) {
//                 await User.updateMany(
//                     { _id: { $in: mentorsToAdd } },
//                     { $addToSet: { joindClass: id } }
//                 );
//             }
//         }
        
//         const updatedClass = await Class.findByIdAndUpdate(id, updateData, { 
//             new: true,
//             runValidators: true
//         }).populate('mentors students');
        
//         if (!updatedClass) {
//             return res.status(404).json({ message: 'Class not found' });
//         }
        
//         res.status(200).json(updatedClass);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// // Delete class by ID
// router.delete('/:id', async (req, res) => {
//     try {
//         const { id } = req.params;
        
//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             return res.status(400).json({ message: 'Invalid class ID' });
//         }
        
//         const classToDelete = await Class.findById(id);
//         if (!classToDelete) {
//             return res.status(404).json({ message: 'Class not found' });
//         }
        
//         await User.updateMany(
//             { _id: { $in: [...classToDelete.mentors, ...classToDelete.students] } },
//             { $pull: { joindClass: id } }
//         );
        
//         await Class.findByIdAndDelete(id);
        
//         res.status(200).json({ message: 'Class deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// // Join a class using join code
// router.post('/join', async (req, res) => {
//     try {
//         const { joinCode } = req.body;
//         const userId = req.user._id;
        
//         const classToJoin = await Class.findOne({ joinCode });
//         if (!classToJoin) {
//             return res.status(404).json({ message: 'Class not found with this join code' });
//         }
        
//         const user = await User.findById(userId);
//         if (classToJoin.students.includes(userId) || classToJoin.mentors.includes(userId)) {
//             return res.status(400).json({ message: 'You are already in this class' });
//         }
        
//         if (user.role === 'mentor') {
//             classToJoin.mentors.push(userId);
//         } else {
//             classToJoin.students.push(userId);
//         }
        
//         user.joindClass.push(classToJoin._id);
        
//         const session = await mongoose.startSession();
//         session.startTransaction();
        
//         try {
//             await classToJoin.save({ session });
//             await user.save({ session });
//             await session.commitTransaction();
            
//             res.status(200).json({ 
//                 message: 'Successfully joined class',
//                 class: classToJoin
//             });
//         } catch (error) {
//             await session.abortTransaction();
//             throw error;
//         } finally {
//             session.endSession();
//         }
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// });

// module.exports = router;