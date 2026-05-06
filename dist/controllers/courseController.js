"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstructorCourses = exports.deleteCourse = exports.updateCourse = exports.createCourse = exports.getCourse = exports.getCourses = void 0;
const Course_1 = __importDefault(require("../models/Course"));
const Lesson_1 = __importDefault(require("../models/Lesson"));
const Enrollment_1 = __importDefault(require("../models/Enrollment"));
const getCourses = async (req, res) => {
    try {
        const { category, level, search } = req.query;
        const filter = { isPublished: true };
        if (category)
            filter.category = category;
        if (level)
            filter.level = level;
        if (search)
            filter.title = { $regex: search, $options: 'i' };
        const courses = await Course_1.default.find(filter)
            .populate('instructor', 'name avatar')
            .select('-enrolledStudents');
        res.json({ success: true, count: courses.length, courses });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getCourses = getCourses;
const getCourse = async (req, res) => {
    try {
        const course = await Course_1.default.findById(req.params.id).populate('instructor', 'name avatar bio');
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        const lessons = await Lesson_1.default.find({ course: course._id }).sort('order').select('title order duration isPreview');
        res.json({ success: true, course, lessons });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getCourse = getCourse;
const createCourse = async (req, res) => {
    try {
        const course = await Course_1.default.create({ ...req.body, instructor: req.user._id });
        res.status(201).json({ success: true, course });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.createCourse = createCourse;
const updateCourse = async (req, res) => {
    try {
        const course = await Course_1.default.findById(req.params.id);
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        const updated = await Course_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json({ success: true, course: updated });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.updateCourse = updateCourse;
const deleteCourse = async (req, res) => {
    try {
        const course = await Course_1.default.findById(req.params.id);
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        await Course_1.default.findByIdAndDelete(req.params.id);
        await Lesson_1.default.deleteMany({ course: req.params.id });
        await Enrollment_1.default.deleteMany({ course: req.params.id });
        res.json({ success: true, message: 'Course deleted' });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.deleteCourse = deleteCourse;
const getInstructorCourses = async (req, res) => {
    try {
        const courses = await Course_1.default.find({ instructor: req.user._id });
        res.json({ success: true, courses });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getInstructorCourses = getInstructorCourses;
