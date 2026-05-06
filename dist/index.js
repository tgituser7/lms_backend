"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("./config/database"));
const auth_1 = __importDefault(require("./routes/auth"));
const courses_1 = __importDefault(require("./routes/courses"));
const lessons_1 = __importDefault(require("./routes/lessons"));
const enrollments_1 = __importDefault(require("./routes/enrollments"));
const admin_1 = __importDefault(require("./routes/admin"));
const chapters_1 = __importDefault(require("./routes/chapters"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/auth', auth_1.default);
app.use('/api/courses', courses_1.default);
app.use('/api/courses/:courseId/lessons', lessons_1.default);
app.use('/api/enrollments', enrollments_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/courses/:courseId/chapters', chapters_1.default);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
const PORT = process.env.PORT || 5000;
(0, database_1.default)().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch((err) => {
    console.error('DB connection failed:', err);
    process.exit(1);
});
