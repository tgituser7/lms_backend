"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLesson = exports.updateLesson = exports.createLesson = exports.getLessons = void 0;
const Lesson_1 = __importDefault(require("../models/Lesson"));
const Course_1 = __importDefault(require("../models/Course"));
const Enrollment_1 = __importDefault(require("../models/Enrollment"));
const getLessons = async (req, res) => {
    try {
        const course = await Course_1.default.findById(req.params.courseId);
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        const isEnrolled = req.user
            ? await Enrollment_1.default.findOne({ student: req.user._id, course: course._id })
            : null;
        const isInstructor = req.user && course.instructor.toString() === req.user._id.toString();
        const lessons = await Lesson_1.default.find({ course: course._id }).sort('order');
        const filteredLessons = lessons.map((lesson) => {
            if (isEnrolled || isInstructor || lesson.isPreview)
                return lesson;
            const { content, videoUrl, ...rest } = lesson.toObject();
            return { ...rest, content: '', videoUrl: undefined };
        });
        res.json({ success: true, lessons: filteredLessons });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getLessons = getLessons;
const createLesson = async (req, res) => {
    try {
        const course = await Course_1.default.findById(req.params.courseId);
        if (!course) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }
        if (course.instructor.toString() !== req.user._id.toString()) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        const lesson = await Lesson_1.default.create({ ...req.body, course: course._id });
        res.status(201).json({ success: true, lesson });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.createLesson = createLesson;
const updateLesson = async (req, res) => {
    try {
        const lesson = await Lesson_1.default.findById(req.params.id).populate('course');
        if (!lesson) {
            res.status(404).json({ success: false, message: 'Lesson not found' });
            return;
        }
        const course = lesson.course;
        if (course.instructor.toString() !== req.user._id.toString()) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        const updated = await Lesson_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, lesson: updated });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.updateLesson = updateLesson;
const deleteLesson = async (req, res) => {
    try {
        const lesson = await Lesson_1.default.findById(req.params.id).populate('course');
        if (!lesson) {
            res.status(404).json({ success: false, message: 'Lesson not found' });
            return;
        }
        const course = lesson.course;
        if (course.instructor.toString() !== req.user._id.toString()) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        await Lesson_1.default.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Lesson deleted' });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.deleteLesson = deleteLesson;
