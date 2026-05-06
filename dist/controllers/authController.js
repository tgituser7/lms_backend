"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET || 'secret', {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (role === 'admin') {
            res.status(403).json({ success: false, message: 'Cannot register as admin' });
            return;
        }
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ success: false, message: 'Email already registered' });
            return;
        }
        const user = await User_1.default.create({ name, email, password, role: role || 'student' });
        const token = generateToken(user._id.toString());
        res.status(201).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }
        const token = generateToken(user._id.toString());
        res.json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id).select('-password');
        res.json({ success: true, user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
exports.getMe = getMe;
