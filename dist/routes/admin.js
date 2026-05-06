"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect, (0, auth_1.authorize)('admin'));
router.get('/stats', adminController_1.getStats);
router.get('/users', adminController_1.getAllUsers);
router.get('/users/:id', async (req, res) => {
    const User = require('../models/User').default;
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
    }
    res.json({ success: true, user });
});
router.post('/users', adminController_1.createUser);
router.put('/users/:id', adminController_1.updateUser);
router.delete('/users/:id', adminController_1.deleteUser);
router.get('/courses', adminController_1.getAllCourses);
router.post('/courses', adminController_1.createCourse);
router.put('/courses/:courseId/assign', adminController_1.assignInstructor);
router.put('/courses/:courseId/publish', adminController_1.togglePublish);
router.get('/students/:studentId/enrollments', adminController_1.getStudentEnrollments);
router.post('/students/:studentId/enroll', adminController_1.enrollStudent);
router.delete('/students/:studentId/enrollments/:courseId', adminController_1.unenrollStudent);
exports.default = router;
