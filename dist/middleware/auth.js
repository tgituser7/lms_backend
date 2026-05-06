"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    else if (req.query.token) {
        token = req.query.token;
    }
    if (!token) {
        res.status(401).json({ success: false, message: 'Not authorized, no token' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User_1.default.findById(decoded.id).select('-password');
        if (!user) {
            res.status(401).json({ success: false, message: 'User not found' });
            return;
        }
        req.user = user;
        next();
    }
    catch {
        res.status(401).json({ success: false, message: 'Token invalid' });
    }
};
exports.protect = protect;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ success: false, message: 'Not authorized for this action' });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
