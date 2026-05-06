"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyEnrollments = exports.enrollCourse = void 0;
const Enrollment_1 = __importDefault(require("../models/Enrollment"));
const Course_1 = __importDefault(require("../models/Course"));
const enrollCourse = async (req, res) => {
    try {
        const course = await Course_1.default.findById(req.params.courseId);
        if (!course || !course.isPublished) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        const existing = await Enrollment_1.default.findOne({ student: req.user._id, course: course._id });
        if (existing) {
            res.status(400).json({ success: false, message: 'Already enrolled' });
            return;
        }
        const enrollment = await Enrollment_1.default.create({ student: req.user._id, course: course._id });
        await Course_1.default.findByIdAndUpdate(course._id, { $push: { enrolledStudents: req.user._id } });
        res.status(201).json({ success: true, enrollment });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.enrollCourse = enrollCourse;
const getMyEnrollments = async (req, res) => {
    try {
        const enrollments = await Enrollment_1.default.find({ student: req.user._id })
            .populate('course', 'title thumbnail category level instructor')
            .populate({ path: 'course', populate: { path: 'instructor', select: 'name' } });
        res.json({ success: true, enrollments });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getMyEnrollments = getMyEnrollments;
