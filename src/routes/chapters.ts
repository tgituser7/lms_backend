import { Router } from 'express';
import {
  getChapters, createChapter, updateChapter, deleteChapter,
  uploadChapterVideo, uploadChapterPdf, streamVideo, streamPdf, updateChapterProgress,
} from '../controllers/chapterController';
import { protect, authorize } from '../middleware/auth';
import { uploadVideo, uploadPdf } from '../middleware/upload';

const router = Router({ mergeParams: true });

router.get('/', protect, getChapters);
router.post('/', protect, authorize('instructor', 'admin'), createChapter);
router.put('/:chapterId', protect, authorize('instructor', 'admin'), updateChapter);
router.delete('/:chapterId', protect, authorize('instructor', 'admin'), deleteChapter);
router.post('/:chapterId/upload-video', protect, authorize('instructor', 'admin'), uploadVideo, uploadChapterVideo);
router.post('/:chapterId/upload-pdf', protect, authorize('instructor', 'admin'), uploadPdf, uploadChapterPdf);
router.get('/:chapterId/video', protect, streamVideo);
router.get('/:chapterId/pdf', protect, streamPdf);
router.put('/:chapterId/progress', protect, authorize('student'), updateChapterProgress);

export default router;
