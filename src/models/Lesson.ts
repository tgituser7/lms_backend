import mongoose, { Document, Schema } from 'mongoose';

export interface ILesson extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  videoUrl?: string;
  course: mongoose.Types.ObjectId;
  order: number;
  duration?: number;
  isPreview: boolean;
  createdAt: Date;
}

const LessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    videoUrl: { type: String },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    order: { type: Number, required: true },
    duration: { type: Number },
    isPreview: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ILesson>('Lesson', LessonSchema);
