import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJobResult extends Document {
  jobTitle: string;
  company: string;
  jobLink: string;
  score: number;
  profile: string;
  resumeLink: string;
  contactInfo: string;
  applied: boolean;
  processedAt: Date;
}

const JobResultSchema = new Schema<IJobResult>(
  {
    jobTitle:    { type: String, required: true },
    company:     { type: String, required: true },
    jobLink:     { type: String, required: true },
    score:       { type: Number, required: true, min: 0, max: 100 },
    profile:     { type: String, required: true },
    resumeLink:  { type: String, default: '' },
    contactInfo: { type: String, default: '' },
    applied:     { type: Boolean, default: false },
    processedAt: { type: Date,   default: Date.now },
  },
  { timestamps: true }
);

const JobResult: Model<IJobResult> =
  mongoose.models.JobResult || mongoose.model<IJobResult>('JobResult', JobResultSchema);

export default JobResult;
