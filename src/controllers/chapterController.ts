import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import Chapter from '../models/Chapter';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import { AuthRequest } from '../middleware/auth';

const isAuthorized = async (courseId: string, userId: string, role: string): Promise<boolean> => {
  if (role === 'admin') return true;
  const course = await Course.findById(courseId);
  return !!course && course.instructor.toString() === userId;
};

const canAccessContent = async (courseId: string, userId: string, role: string): Promise<boolean> => {
  if (role === 'admin' || role === 'instructor') {
    const course = await Course.findById(courseId);
    if (role === 'instructor' && course?.instructor.toString() !== userId) {
      const enrolled = await Enrollment.findOne({ student: userId, course: courseId });
      return !!enrolled;
    }
    return true;
  }
  const enrolled = await Enrollment.findOne({ student: userId, course: courseId });
  return !!enrolled;
};

export const getChapters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const chapters = await Chapter.find({ course: courseId }).sort('order');

    if (!req.user) {
      const preview = chapters.map((c) => ({
        _id: c._id, title: c.title, order: c.order, isPreview: c.isPreview,
        duration: c.duration,
        hasVideo: !!c.videoPath || !!c.youtubeUrl,
        hasPdf: !!c.pdfPath,
        hasSummary: !!c.summary,
        hasContent: !!c.content,
      }));
      res.json({ success: true, chapters: preview });
      return;
    }

    const authorized = await isAuthorized(courseId, req.user._id.toString(), req.user.role);
    const hasAccess = authorized || await canAccessContent(courseId, req.user._id.toString(), req.user.role);

    const result = chapters.map((c) => {
      const canView = hasAccess || c.isPreview;
      return {
        _id: c._id,
        title: c.title,
        order: c.order,
        isPreview: c.isPreview,
        duration: c.duration,
        hasVideo: !!c.videoPath || !!c.youtubeUrl,
        hasPdf: !!c.pdfPath,
        hasSummary: !!c.summary,
        hasContent: !!c.content,
        ...(canView ? {
          youtubeUrl: c.youtubeUrl,
          summary: c.summary,
          content: c.content,
          videoOriginalName: c.videoOriginalName,
          pdfOriginalName: c.pdfOriginalName,
        } : {}),
      };
    });

    res.json({ success: true, chapters: result });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createChapter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    if (!(await isAuthorized(courseId, req.user!._id.toString(), req.user!.role))) {
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    const { title, order, isPreview, youtubeUrl, summary, content, duration, contentType } = req.body;
    const chapter = await Chapter.create({
      title, course: courseId,
      order: Number(order) || 1,
      isPreview: isPreview === 'true',
      youtubeUrl: contentType === 'youtube' ? youtubeUrl : undefined,
      summary: contentType === 'summary' ? summary : undefined,
      content: contentType === 'text' ? content : undefined,
      duration: duration ? Number(duration) : undefined,
    });
    res.status(201).json({ success: true, chapter });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const uploadChapterVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, chapterId } = req.params;
    if (!(await isAuthorized(courseId, req.user!._id.toString(), req.user!.role))) {
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No video file uploaded' });
      return;
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      fs.unlinkSync(req.file.path);
      res.status(404).json({ success: false, message: 'Chapter not found' });
      return;
    }
    if (chapter.videoPath && fs.existsSync(chapter.videoPath)) fs.unlinkSync(chapter.videoPath);
    chapter.videoPath = req.file.path;
    chapter.videoOriginalName = req.file.originalname;
    await chapter.save();
    res.json({ success: true, chapter });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const uploadChapterPdf = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, chapterId } = req.params;
    if (!(await isAuthorized(courseId, req.user!._id.toString(), req.user!.role))) {
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No PDF file uploaded' });
      return;
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      fs.unlinkSync(req.file.path);
      res.status(404).json({ success: false, message: 'Chapter not found' });
      return;
    }
    if (chapter.pdfPath && fs.existsSync(chapter.pdfPath)) fs.unlinkSync(chapter.pdfPath);
    chapter.pdfPath = req.file.path;
    chapter.pdfOriginalName = req.file.originalname;
    await chapter.save();
    res.json({ success: true, chapter });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const streamVideo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, chapterId } = req.params;
    const authorized = await isAuthorized(courseId, req.user!._id.toString(), req.user!.role);
    const hasAccess = authorized || await canAccessContent(courseId, req.user!._id.toString(), req.user!.role);
    if (!hasAccess) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter?.videoPath || !fs.existsSync(chapter.videoPath)) {
      res.status(404).json({ success: false, message: 'Video not found' });
      return;
    }
    const stat = fs.statSync(chapter.videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Accept-Ranges', 'bytes');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunkSize);
      res.status(206);
      fs.createReadStream(chapter.videoPath, { start, end }).pipe(res);
    } else {
      res.setHeader('Content-Length', fileSize);
      res.status(200);
      fs.createReadStream(chapter.videoPath).pipe(res);
    }
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const streamPdf = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, chapterId } = req.params;
    const authorized = await isAuthorized(courseId, req.user!._id.toString(), req.user!.role);
    const hasAccess = authorized || await canAccessContent(courseId, req.user!._id.toString(), req.user!.role);
    if (!hasAccess) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter?.pdfPath || !fs.existsSync(chapter.pdfPath)) {
      res.status(404).json({ success: false, message: 'PDF not found' });
      return;
    }
    const stat = fs.statSync(chapter.pdfPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(chapter.pdfPath).pipe(res);
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateChapter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, chapterId } = req.params;
    if (!(await isAuthorized(courseId, req.user!._id.toString(), req.user!.role))) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    const chapter = await Chapter.findByIdAndUpdate(chapterId, req.body, { new: true });
    res.json({ success: true, chapter });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteChapter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, chapterId } = req.params;
    if (!(await isAuthorized(courseId, req.user!._id.toString(), req.user!.role))) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) { res.status(404).json({ success: false, message: 'Chapter not found' }); return; }
    if (chapter.videoPath && fs.existsSync(chapter.videoPath)) fs.unlinkSync(chapter.videoPath);
    if (chapter.pdfPath && fs.existsSync(chapter.pdfPath)) fs.unlinkSync(chapter.pdfPath);
    await Chapter.findByIdAndDelete(chapterId);
    res.json({ success: true, message: 'Chapter deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateChapterProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, chapterId } = req.params;
    const { status } = req.body; // 'learning' | 'completed'
    if (!['learning', 'completed'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }
    const enrollment = await Enrollment.findOne({ student: req.user!._id, course: courseId });
    if (!enrollment) {
      res.status(404).json({ success: false, message: 'Not enrolled in this course' });
      return;
    }
    const existing = enrollment.chapterProgress.find((p) => p.chapter.toString() === chapterId);
    if (existing) {
      existing.status = status;
      existing.updatedAt = new Date();
    } else {
      enrollment.chapterProgress.push({ chapter: new (require('mongoose').Types.ObjectId)(chapterId), status, updatedAt: new Date() });
    }
    const totalChapters = await Chapter.countDocuments({ course: courseId });
    const completed = enrollment.chapterProgress.filter((p) => p.status === 'completed').length;
    enrollment.progress = totalChapters > 0 ? Math.round((completed / totalChapters) * 100) : 0;
    if (enrollment.progress === 100) enrollment.completedAt = new Date();
    await enrollment.save();
    res.json({ success: true, enrollment });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
