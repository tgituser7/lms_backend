import { Response } from 'express';
import Lesson from '../models/Lesson';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import { AuthRequest } from '../middleware/auth';

export const getLessons = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }
    const isEnrolled = req.user
      ? await Enrollment.findOne({ student: req.user._id, course: course._id })
      : null;
    const isInstructor = req.user && course.instructor.toString() === req.user._id.toString();

    const lessons = await Lesson.find({ course: course._id }).sort('order');
    const filteredLessons = lessons.map((lesson) => {
      if (isEnrolled || isInstructor || lesson.isPreview) return lesson;
      const { content, videoUrl, ...rest } = lesson.toObject();
      return { ...rest, content: '', videoUrl: undefined };
    });

    res.json({ success: true, lessons: filteredLessons });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }
    if (course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    const lesson = await Lesson.create({ ...req.body, course: course._id });
    res.status(201).json({ success: true, lesson });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course');
    if (!lesson) {
      res.status(404).json({ success: false, message: 'Lesson not found' });
      return;
    }
    const course = lesson.course as any;
    if (course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    const updated = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, lesson: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course');
    if (!lesson) {
      res.status(404).json({ success: false, message: 'Lesson not found' });
      return;
    }
    const course = lesson.course as any;
    if (course.instructor.toString() !== req.user!._id.toString()) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Lesson deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
