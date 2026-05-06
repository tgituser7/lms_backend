"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPdf = exports.uploadVideo = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const videoStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path_1.default.join(process.cwd(), 'uploads', 'videos');
        fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path_1.default.extname(file.originalname)}`);
    },
});
const pdfStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path_1.default.join(process.cwd(), 'uploads', 'pdfs');
        fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path_1.default.extname(file.originalname)}`);
    },
});
const videoFilter = (_req, file, cb) => {
    if (file.mimetype.startsWith('video/'))
        cb(null, true);
    else
        cb(new Error('Only video files allowed'));
};
const pdfFilter = (_req, file, cb) => {
    if (file.mimetype === 'application/pdf')
        cb(null, true);
    else
        cb(new Error('Only PDF files allowed'));
};
exports.uploadVideo = (0, multer_1.default)({
    storage: videoStorage,
    fileFilter: videoFilter,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
}).single('video');
exports.uploadPdf = (0, multer_1.default)({
    storage: pdfStorage,
    fileFilter: pdfFilter,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
}).single('pdf');
