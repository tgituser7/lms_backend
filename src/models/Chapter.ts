import mongoose, { Document, Schema } from 'mongoose';

export interface IChapter extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  course: mongoose.Types.ObjectId;
  order: number;
  isPreview: boolean;
  videoPath?: string;
  videoOriginalName?: string;
  youtubeUrl?: string;
  pdfPath?: string;
  pdfOriginalName?: string;
  summary?: string;
  content?: string;
  duration?: number;
  createdAt: Date;
}

const ChapterSchema = new Schema<IChapter>(
  {
    title: { type: String, required: true, trim: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    order: { type: Number, required: true },
    isPreview: { type: Boolean, default: false },
    videoPath: { type: String },
    videoOriginalName: { type: String },
    youtubeUrl: { type: String },
    pdfPath: { type: String },
    pdfOriginalName: { type: String },
    summary: { type: String },
    content: { type: String },
    duration: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model<IChapter>('Chapter', ChapterSchema);
