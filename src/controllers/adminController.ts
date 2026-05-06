import { Request, Response } from 'express';
import fs from 'fs';
import User from '../models/User';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import Chapter from '../models/Chapter';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.query;
    const filter: any = {};
    if (role) filter.role = role;
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, bio } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ success: false, message: 'Email already registered' });
      return;
    }
    const user = await User.create({ name, email, password, role: role || 'student', bio });
    res.status(201).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, role, bio, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (bio !== undefined) user.bio = bio;
    if (password && password.trim().length >= 6) user.password = password;
    await user.save();
    const updated = await User.findById(user._id).select('-password');
    res.json({ success: true, user: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    await Enrollment.deleteMany({ student: req.params.id });
    res.json({ success: true, message: 'User deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getAllCourses = async (_req: Request, res: Response): Promise<void> => {
  try {
    const courses = await Course.find()
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: courses.length, courses });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }
    const chapters = await Chapter.find({ course: courseId });
    for (const ch of chapters) {
      if (ch.videoPath && fs.existsSync(ch.videoPath)) fs.unlinkSync(ch.videoPath);
      if (ch.pdfPath && fs.existsSync(ch.pdfPath)) fs.unlinkSync(ch.pdfPath);
    }
    await Chapter.deleteMany({ course: courseId });
    await Enrollment.deleteMany({ course: courseId });
    await Course.findByIdAndDelete(courseId);
    res.json({ success: true, message: 'Course deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, course });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const assignInstructor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { instructorId } = req.body;
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== 'instructor') {
      res.status(400).json({ success: false, message: 'Invalid instructor' });
      return;
    }
    const course = await Course.findByIdAndUpdate(
      req.params.courseId,
      { instructor: instructorId },
      { new: true }
    ).populate('instructor', 'name email');
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }
    res.json({ success: true, course });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const togglePublish = async (req: Request, res: Response): Promise<void> => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }
    course.isPublished = !course.isPublished;
    await course.save();
    res.json({ success: true, course });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getStudentEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    const enrollments = await Enrollment.find({ student: req.params.studentId })
      .populate('course', 'title category level isPublished');
    res.json({ success: true, enrollments });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const enrollStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.body;
    const existing = await Enrollment.findOne({ student: studentId, course: courseId });
    if (existing) {
      res.status(400).json({ success: false, message: 'Student already enrolled in this course' });
      return;
    }
    const enrollment = await Enrollment.create({ student: studentId, course: courseId });
    await Course.findByIdAndUpdate(courseId, { $push: { enrolledStudents: studentId } });
    res.status(201).json({ success: true, enrollment });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const unenrollStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId, courseId } = req.params;
    const deleted = await Enrollment.findOneAndDelete({ student: studentId, course: courseId });
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Enrollment not found' });
      return;
    }
    await Course.findByIdAndUpdate(courseId, { $pull: { enrolledStudents: studentId } });
    res.json({ success: true, message: 'Student unenrolled' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [totalStudents, totalInstructors, totalCourses, totalEnrollments] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'instructor' }),
      Course.countDocuments(),
      Enrollment.countDocuments(),
    ]);
    res.json({ success: true, stats: { totalStudents, totalInstructors, totalCourses, totalEnrollments } });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
