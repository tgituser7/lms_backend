"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateChapterProgress = exports.deleteChapter = exports.updateChapter = exports.streamPdf = exports.streamVideo = exports.uploadChapterPdf = exports.uploadChapterVideo = exports.createChapter = exports.getChapters = void 0;
const fs_1 = __importDefault(require("fs"));
const Chapter_1 = __importDefault(require("../models/Chapter"));
const Course_1 = __importDefault(require("../models/Course"));
const Enrollment_1 = __importDefault(require("../models/Enrollment"));
const isAuthorized = async (courseId, userId, role) => {
    if (role === 'admin')
        return true;
    const course = await Course_1.default.findById(courseId);
    return !!course && course.instructor.toString() === userId;
};
const canAccessContent = async (courseId, userId, role) => {
    if (role === 'admin' || role === 'instructor') {
        const course = await Course_1.default.findById(courseId);
        if (role === 'instructor' && course?.instructor.toString() !== userId) {
            const enrolled = await Enrollment_1.default.findOne({ student: userId, course: courseId });
            return !!enrolled;
        }
        return true;
    }
    const enrolled = await Enrollment_1.default.findOne({ student: userId, course: courseId });
    return !!enrolled;
};
const getChapters = async (req, res) => {
    try {
        const { courseId } = req.params;
        const chapters = await Chapter_1.default.find({ course: courseId }).sort('order');
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
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getChapters = getChapters;
const createChapter = async (req, res) => {
    try {
        const { courseId } = req.params;
        if (!(await isAuthorized(courseId, req.user._id.toString(), req.user.role))) {
            if (req.file)
                fs_1.default.unlinkSync(req.file.path);
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        const { title, order, isPreview, youtubeUrl, summary, content, duration, contentType } = req.body;
        const chapter = await Chapter_1.default.create({
            title, course: courseId,
            order: Number(order) || 1,
            isPreview: isPreview === 'true',
            youtubeUrl: contentType === 'youtube' ? youtubeUrl : undefined,
            summary: contentType === 'summary' ? summary : undefined,
            content: contentType === 'text' ? content : undefined,
            duration: duration ? Number(duration) : undefined,
        });
        res.status(201).json({ success: true, chapter });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.createChapter = createChapter;
const uploadChapterVideo = async (req, res) => {
    try {
        const { courseId, chapterId } = req.params;
        if (!(await isAuthorized(courseId, req.user._id.toString(), req.user.role))) {
            if (req.file)
                fs_1.default.unlinkSync(req.file.path);
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No video file uploaded' });
            return;
        }
        const chapter = await Chapter_1.default.findById(chapterId);
        if (!chapter) {
            fs_1.default.unlinkSync(req.file.path);
            res.status(404).json({ success: false, message: 'Chapter not found' });
            return;
        }
        if (chapter.videoPath && fs_1.default.existsSync(chapter.videoPath))
            fs_1.default.unlinkSync(chapter.videoPath);
        chapter.videoPath = req.file.path;
        chapter.videoOriginalName = req.file.originalname;
        await chapter.save();
        res.json({ success: true, chapter });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.uploadChapterVideo = uploadChapterVideo;
const uploadChapterPdf = async (req, res) => {
    try {
        const { courseId, chapterId } = req.params;
        if (!(await isAuthorized(courseId, req.user._id.toString(), req.user.role))) {
            if (req.file)
                fs_1.default.unlinkSync(req.file.path);
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No PDF file uploaded' });
            return;
        }
        const chapter = await Chapter_1.default.findById(chapterId);
        if (!chapter) {
            fs_1.default.unlinkSync(req.file.path);
            res.status(404).json({ success: false, message: 'Chapter not found' });
            return;
        }
        if (chapter.pdfPath && fs_1.default.existsSync(chapter.pdfPath))
            fs_1.default.unlinkSync(chapter.pdfPath);
        chapter.pdfPath = req.file.path;
        chapter.pdfOriginalName = req.file.originalname;
        await chapter.save();
        res.json({ success: true, chapter });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.uploadChapterPdf = uploadChapterPdf;
const streamVideo = async (req, res) => {
    try {
        const { courseId, chapterId } = req.params;
        const authorized = await isAuthorized(courseId, req.user._id.toString(), req.user.role);
        const hasAccess = authorized || await canAccessContent(courseId, req.user._id.toString(), req.user.role);
        if (!hasAccess) {
            res.status(403).json({ success: false, message: 'Access denied' });
            return;
        }
        const chapter = await Chapter_1.default.findById(chapterId);
        if (!chapter?.videoPath || !fs_1.default.existsSync(chapter.videoPath)) {
            res.status(404).json({ success: false, message: 'Video not found' });
            return;
        }
        const stat = fs_1.default.statSync(chapter.videoPath);
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
            fs_1.default.createReadStream(chapter.videoPath, { start, end }).pipe(res);
        }
        else {
            res.setHeader('Content-Length', fileSize);
            res.status(200);
            fs_1.default.createReadStream(chapter.videoPath).pipe(res);
        }
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.streamVideo = streamVideo;
const streamPdf = async (req, res) => {
    try {
        const { courseId, chapterId } = req.params;
        const authorized = await isAuthorized(courseId, req.user._id.toString(), req.user.role);
        const hasAccess = authorized || await canAccessContent(courseId, req.user._id.toString(), req.user.role);
        if (!hasAccess) {
            res.status(403).json({ success: false, message: 'Access denied' });
            return;
        }
        const chapter = await Chapter_1.default.findById(chapterId);
        if (!chapter?.pdfPath || !fs_1.default.existsSync(chapter.pdfPath)) {
            res.status(404).json({ success: false, message: 'PDF not found' });
            return;
        }
        const stat = fs_1.default.statSync(chapter.pdfPath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Cache-Control', 'no-store');
        fs_1.default.createReadStream(chapter.pdfPath).pipe(res);
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.streamPdf = streamPdf;
const updateChapter = async (req, res) => {
    try {
        const { courseId, chapterId } = req.params;
        if (!(await isAuthorized(courseId, req.user._id.toString(), req.user.role))) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        const chapter = await Chapter_1.default.findByIdAndUpdate(chapterId, req.body, { new: true });
        res.json({ success: true, chapter });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.updateChapter = updateChapter;
const deleteChapter = async (req, res) => {
    try {
        const { courseId, chapterId } = req.params;
        if (!(await isAuthorized(courseId, req.user._id.toString(), req.user.role))) {
            res.status(403).json({ success: false, message: 'Not authorized' });
            return;
        }
        const chapter = await Chapter_1.default.findById(chapterId);
        if (!chapter) {
            res.status(404).json({ success: false, message: 'Chapter not found' });
            return;
        }
        if (chapter.videoPath && fs_1.default.existsSync(chapter.videoPath))
            fs_1.default.unlinkSync(chapter.videoPath);
        if (chapter.pdfPath && fs_1.default.existsSync(chapter.pdfPath))
            fs_1.default.unlinkSync(chapter.pdfPath);
        await Chapter_1.default.findByIdAndDelete(chapterId);
        res.json({ success: true, message: 'Chapter deleted' });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.deleteChapter = deleteChapter;
const updateChapterProgress = async (req, res) => {
    try {
        const { courseId, chapterId } = req.params;
        const { status } = req.body; // 'learning' | 'completed'
        if (!['learning', 'completed'].includes(status)) {
            res.status(400).json({ success: false, message: 'Invalid status' });
            return;
        }
        const enrollment = await Enrollment_1.default.findOne({ student: req.user._id, course: courseId });
        if (!enrollment) {
            res.status(404).json({ success: false, message: 'Not enrolled in this course' });
            return;
        }
        const existing = enrollment.chapterProgress.find((p) => p.chapter.toString() === chapterId);
        if (existing) {
            existing.status = status;
            existing.updatedAt = new Date();
        }
        else {
            enrollment.chapterProgress.push({ chapter: new (require('mongoose').Types.ObjectId)(chapterId), status, updatedAt: new Date() });
        }
        const totalChapters = await Chapter_1.default.countDocuments({ course: courseId });
        const completed = enrollment.chapterProgress.filter((p) => p.status === 'completed').length;
        enrollment.progress = totalChapters > 0 ? Math.round((completed / totalChapters) * 100) : 0;
        if (enrollment.progress === 100)
            enrollment.completedAt = new Date();
        await enrollment.save();
        res.json({ success: true, enrollment });
    }
    catch {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.updateChapterProgress = updateChapterProgress;
