"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
const ADMIN = {
    name: 'Admin',
    email: 'admin@lms.com',
    password: 'admin123',
    role: 'admin',
};
const createAdmin = async () => {
    await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');
    const existing = await User_1.default.findOne({ email: ADMIN.email });
    if (existing) {
        console.log(`Admin already exists: ${ADMIN.email}`);
        process.exit(0);
    }
    await User_1.default.create(ADMIN);
    console.log(`Admin created — email: ${ADMIN.email}  password: ${ADMIN.password}`);
    process.exit(0);
};
createAdmin().catch((err) => {
    console.error('Failed to create admin:', err.message);
    process.exit(1);
});
