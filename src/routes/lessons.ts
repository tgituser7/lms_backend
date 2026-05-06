import { Router } from 'express';
import { getLessons, createLesson, updateLesson, deleteLesson } from '../controllers/lessonController';
import { protect, authorize } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/', protect, getLessons);
router.post('/', protect, authorize('instructor', 'admin'), createLesson);
router.put('/:id', protect, authorize('instructor', 'admin'), updateLesson);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteLesson);

export default router;
