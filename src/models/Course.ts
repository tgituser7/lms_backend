import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  instructor: mongoose.Types.ObjectId;
  thumbnail?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  isPublished: boolean;
  enrolledStudents: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    thumbnail: { type: String },
    category: { type: String, required: true },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    price: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    enrolledStudents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export default mongoose.model<ICourse>('Course', CourseSchema);
