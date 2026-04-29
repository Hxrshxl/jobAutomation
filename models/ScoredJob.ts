import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IScoreBreakdown {
  skills?: number;
  experience?: number;
  location?: number;
  title?: number;
  [key: string]: number | undefined;
}

export interface IScoredJob extends Document {
  // --- Inherited RawJob fields ---
  jobId: string;
  title: string;
  company: string;
  location: string;
  source: string;
  url: string;
  description: string;
  postedAt: Date;
  easyApply: boolean;
  recruiter: string;
  fetchedAt: Date;
  seen: boolean;
  // --- ScoredJob-specific fields ---
  score: number;
  scoreBreakdown: IScoreBreakdown;
  profile: string;     // which candidate profile this score belongs to
  scoredAt: Date;
}

const ScoredJobSchema = new Schema<IScoredJob>(
  {
    jobId:          { type: String, required: true },
    title:          { type: String, required: true },
    company:        { type: String, required: true },
    location:       { type: String, default: '' },
    source:         { type: String, required: true },
    url:            { type: String, required: true },
    description:    { type: String, default: '' },
    postedAt:       { type: Date,   default: null },
    easyApply:      { type: Boolean, default: false },
    recruiter:      { type: String, default: '' },
    fetchedAt:      { type: Date,   default: Date.now },
    seen:           { type: Boolean, default: false },
    score:          { type: Number, required: true, min: 0, max: 100 },
    scoreBreakdown: { type: Schema.Types.Mixed, default: {} },
    profile:        { type: String, required: true },
    scoredAt:       { type: Date,   default: Date.now },
  },
  { timestamps: true }
);

// Compound unique index — one score per (job, profile) pair
ScoredJobSchema.index({ jobId: 1, profile: 1 }, { unique: true });

const ScoredJob: Model<IScoredJob> =
  mongoose.models.ScoredJob || mongoose.model<IScoredJob>('ScoredJob', ScoredJobSchema);

export default ScoredJob;
