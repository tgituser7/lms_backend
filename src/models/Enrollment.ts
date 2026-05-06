import mongoose, { Document, Schema } from 'mongoose';

export interface IChapterProgress {
  chapter: mongoose.Types.ObjectId;
  status: 'learning' | 'completed';
  updatedAt: Date;
}

export interface IEnrollment extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  chapterProgress: IChapterProgress[];
  progress: number;
  enrolledAt: Date;
  completedAt?: Date;
}

const ChapterProgressSchema = new Schema<IChapterProgress>(
  {
    chapter: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true },
    status: { type: String, enum: ['learning', 'completed'], required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    chapterProgress: [ChapterProgressSchema],
    progress: { type: Number, default: 0 },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
