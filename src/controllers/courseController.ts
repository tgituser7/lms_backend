import { Response } from 'express';
import Course from '../models/Course';
import Lesson from '../models/Lesson';
import Enrollment from '../models/Enrollment';
import { AuthRequest } from '../middleware/auth';

export const getCourses = async (req: any, res: Response): Promise<void> => {
  try {
    const { category, level, search } = req.query;
    const filter: any = { isPublished: true };
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const courses = await Course.find(filter)
      .populate('instructor', 'name avatar')
      .select('-enrolledStudents');
    res.json({ success: true, count: courses.length, courses });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCourse = async (req: any, res: Response): Promise<void> => {
  try {
    const course = await Course.findById(req.params.id).populate('instructor', 'name avatar bio');
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }
    const lessons = await Lesson.find({ course: course._id }).sort('order').select('title order duration isPreview');
    res.json({ success: true, course, lessons });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.create({ ...req.body, instructor: req.user!._id });
    res.status(201).json({ success: true, course });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }
    if (course.instructor.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, course: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }
    if (course.instructor.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    await Course.findByIdAndDelete(req.params.id);
    await Lesson.deleteMany({ course: req.params.id });
    await Enrollment.deleteMany({ course: req.params.id });
    res.json({ success: true, message: 'Course deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getInstructorCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courses = await Course.find({ instructor: req.user!._id });
    res.json({ success: true, courses });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
