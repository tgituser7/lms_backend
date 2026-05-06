import { Router } from 'express';
import { enrollCourse, getMyEnrollments } from '../controllers/enrollmentController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/my', protect, getMyEnrollments);
router.post('/:courseId', protect, enrollCourse);


export default router;
