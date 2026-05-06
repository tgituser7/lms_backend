import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User';

dotenv.config();

const ADMIN = {
  name: 'Admin',
  email: 'admin@lms.com',
  password: 'admin123',
  role: 'admin' as const,
};

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');

  const existing = await User.findOne({ email: ADMIN.email });
  if (existing) {
    console.log(`Admin already exists: ${ADMIN.email}`);
    process.exit(0);
  }

  await User.create(ADMIN);
  console.log(`Admin created — email: ${ADMIN.email}  password: ${ADMIN.password}`);
  process.exit(0);
};

createAdmin().catch((err) => {
  console.error('Failed to create admin:', err.message);
  process.exit(1);
});
