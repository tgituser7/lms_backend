import { Router } from 'express';
import {
  getAllUsers, createUser, updateUser, deleteUser,
  getAllCourses, createCourse, deleteCourse, assignInstructor, togglePublish, getStats,
  getStudentEnrollments, enrollStudent, unenrollStudent,
} from '../controllers/adminController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/users/:id', async (req, res) => {
  const User = require('../models/User').default;
  const user = await User.findById(req.params.id).select('-password');
  if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
  res.json({ success: true, user });
});
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/courses', getAllCourses);
router.post('/courses', createCourse);
router.delete('/courses/:courseId', deleteCourse);
router.put('/courses/:courseId/assign', assignInstructor);
router.put('/courses/:courseId/publish', togglePublish);
router.get('/students/:studentId/enrollments', getStudentEnrollments);
router.post('/students/:studentId/enroll', enrollStudent);
router.delete('/students/:studentId/enrollments/:courseId', unenrollStudent);

export default router;
