import { Router } from 'express';
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getInstructorCourses,
} from '../controllers/courseController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getCourses);
router.get('/my-courses', protect, authorize('instructor', 'admin'), getInstructorCourses);
router.get('/:id', getCourse);
router.post('/', protect, authorize('instructor', 'admin'), createCourse);
router.put('/:id', protect, authorize('instructor', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCourse);

export default router;
