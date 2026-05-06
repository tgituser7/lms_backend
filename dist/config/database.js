"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';
    await mongoose_1.default.connect(mongoURI);
    console.log('MongoDB connected successfully');
};
exports.default = connectDB;
