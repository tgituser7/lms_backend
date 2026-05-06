import { Response } from 'express';
import Enrollment from '../models/Enrollment';
import Course from '../models/Course';
import Lesson from '../models/Lesson';
import { AuthRequest } from '../middleware/auth';

export const enrollCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course || !course.isPublished) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }
    const existing = await Enrollment.findOne({ student: req.user!._id, course: course._id });
    if (existing) {
      res.status(400).json({ success: false, message: 'Already enrolled' });
      return;
    }
    const enrollment = await Enrollment.create({ student: req.user!._id, course: course._id });
    await Course.findByIdAndUpdate(course._id, { $push: { enrolledStudents: req.user!._id } });
    res.status(201).json({ success: true, enrollment });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getMyEnrollments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const enrollments = await Enrollment.find({ student: req.user!._id })
      .populate('course', 'title thumbnail category level instructor')
      .populate({ path: 'course', populate: { path: 'instructor', select: 'name' } });
    res.json({ success: true, enrollments });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const markLessonComplete = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const enrollment = await Enrollment.findOne({ student: req.user!._id, course: req.params.courseId });
    if (!enrollment) {
      res.status(404).json({ success: false, message: 'Not enrolled in this course' });
      return;
    }
    const lessonId = req.params.lessonId as any;
    if (!enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }
    const totalLessons = await Lesson.countDocuments({ course: req.params.courseId });
    enrollment.progress = totalLessons > 0 ? Math.round((enrollment.completedLessons.length / totalLessons) * 100) : 0;
    if (enrollment.progress === 100) enrollment.completedAt = new Date();
    await enrollment.save();
    res.json({ success: true, enrollment });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
