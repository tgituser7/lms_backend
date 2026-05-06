import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';
  await mongoose.connect(mongoURI);
  console.log('MongoDB connected successfully');
};

export default connectDB;
