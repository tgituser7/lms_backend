"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = exports.unenrollStudent = exports.enrollStudent = exports.getStudentEnrollments = exports.togglePublish = exports.assignInstructor = exports.createCourse = exports.getAllCourses = exports.deleteUser = exports.updateUser = exports.createUser = exports.getAllUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const Course_1 = __importDefault(require("../models/Course"));
const Enrollment_1 = __importDefault(require("../models/Enrollment"));
const getAllUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const filter = {};
        if (role)
            filter.role = role;
        const users = await User_1.default.find(filter).select('-password').sort({ createdAt: -1 });
        res.json({ success: true, count: users.length, users });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getAllUsers = getAllUsers;
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, bio } = req.body;
        const existing = await User_1.default.findOne({ email });
        if (existing) {
            res.status(400).json({ success: false, message: 'Email already registered' });
            return;
        }
        const user = await User_1.default.create({ name, email, password, role: role || 'student', bio });
        res.status(201).json({
            success: true,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { name, email, role, bio, password } = req.body;
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        if (name)
            user.name = name;
        if (email)
            user.email = email;
        if (role)
            user.role = role;
        if (bio !== undefined)
            user.bio = bio;
        if (password && password.trim().length >= 6)
            user.password = password;
        await user.save();
        const updated = await User_1.default.findById(user._id).select('-password');
        res.json({ success: true, user: updated });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const user = await User_1.default.findByIdAndDelete(req.params.id);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        await Enrollment_1.default.deleteMany({ student: req.params.id });
        res.json({ success: true, message: 'User deleted' });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.deleteUser = deleteUser;
const getAllCourses = async (_req, res) => {
    try {
        const courses = await Course_1.default.find()
            .populate('instructor', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, count: courses.length, courses });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getAllCourses = getAllCourses;
const createCourse = async (req, res) => {
    try {
        const course = await Course_1.default.create(req.body);
        res.status(201).json({ success: true, course });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.createCourse = createCourse;
const assignInstructor = async (req, res) => {
    try {
        const { instructorId } = req.body;
        const instructor = await User_1.default.findById(instructorId);
        if (!instructor || instructor.role !== 'instructor') {
            res.status(400).json({ success: false, message: 'Invalid instructor' });
            return;
        }
        const course = await Course_1.default.findByIdAndUpdate(req.params.courseId, { instructor: instructorId }, { new: true }).populate('instructor', 'name email');
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        res.json({ success: true, course });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.assignInstructor = assignInstructor;
const togglePublish = async (req, res) => {
    try {
        const course = await Course_1.default.findById(req.params.courseId);
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        course.isPublished = !course.isPublished;
        await course.save();
        res.json({ success: true, course });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.togglePublish = togglePublish;
const getStudentEnrollments = async (req, res) => {
    try {
        const enrollments = await Enrollment_1.default.find({ student: req.params.studentId })
            .populate('course', 'title category level isPublished');
        res.json({ success: true, enrollments });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getStudentEnrollments = getStudentEnrollments;
const enrollStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { courseId } = req.body;
        const existing = await Enrollment_1.default.findOne({ student: studentId, course: courseId });
        if (existing) {
            res.status(400).json({ success: false, message: 'Student already enrolled in this course' });
            return;
        }
        const enrollment = await Enrollment_1.default.create({ student: studentId, course: courseId });
        await Course_1.default.findByIdAndUpdate(courseId, { $push: { enrolledStudents: studentId } });
        res.status(201).json({ success: true, enrollment });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.enrollStudent = enrollStudent;
const unenrollStudent = async (req, res) => {
    try {
        const { studentId, courseId } = req.params;
        const deleted = await Enrollment_1.default.findOneAndDelete({ student: studentId, course: courseId });
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Enrollment not found' });
            return;
        }
        await Course_1.default.findByIdAndUpdate(courseId, { $pull: { enrolledStudents: studentId } });
        res.json({ success: true, message: 'Student unenrolled' });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.unenrollStudent = unenrollStudent;
const getStats = async (_req, res) => {
    try {
        const [totalStudents, totalInstructors, totalCourses, totalEnrollments] = await Promise.all([
            User_1.default.countDocuments({ role: 'student' }),
            User_1.default.countDocuments({ role: 'instructor' }),
            Course_1.default.countDocuments(),
            Enrollment_1.default.countDocuments(),
        ]);
        res.json({ success: true, stats: { totalStudents, totalInstructors, totalCourses, totalEnrollments } });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getStats = getStats;
