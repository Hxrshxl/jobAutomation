import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRawJob extends Document {
  jobId: string;       // unique hash (e.g. MD5 of url+title)
  title: string;
  company: string;
  location: string;
  source: string;      // e.g. "linkedin", "naukri"
  url: string;
  description: string;
  postedAt: Date;
  easyApply: boolean;
  recruiter: string;
  fetchedAt: Date;
  seen: boolean;
}

const RawJobSchema = new Schema<IRawJob>(
  {
    jobId:       { type: String, required: true, unique: true, index: true },
    title:       { type: String, required: true },
    company:     { type: String, required: true },
    location:    { type: String, default: '' },
    source:      { type: String, required: true },
    url:         { type: String, required: true },
    description: { type: String, default: '' },
    postedAt:    { type: Date,   default: null },
    easyApply:   { type: Boolean, default: false },
    recruiter:   { type: String, default: '' },
    fetchedAt:   { type: Date,   default: Date.now },
    seen:        { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent model recompilation in Next.js hot-reload
const RawJob: Model<IRawJob> =
  mongoose.models.RawJob || mongoose.model<IRawJob>('RawJob', RawJobSchema);

export default RawJob;
