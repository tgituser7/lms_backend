import { Router } from 'express';
import { enrollCourse, getMyEnrollments, markLessonComplete } from '../controllers/enrollmentController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/my', protect, getMyEnrollments);
router.post('/:courseId', protect, enrollCourse);
router.put('/:courseId/lessons/:lessonId/complete', protect, markLessonComplete);

export default router;
