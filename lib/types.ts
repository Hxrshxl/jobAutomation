export interface RawJob {
  _id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  source: string;
  url: string;
  description: string;
  postedAt: string;
  easyApply: boolean;
  recruiter?: string;
  fetchedAt: string;
  seen: boolean;
}

export interface ScoreBreakdown {
  skillMatch: number;      // max 35
  titleRelevance: number;  // max 25
  experienceAlignment: number; // max 20
  recency: number;         // max 10
  descriptionQuality: number; // max 10
}

export interface ScoredJob extends RawJob {
  score: number;
  scoreBreakdown: ScoreBreakdown;
  profile: string;
  scoredAt: string;
  scoringMode?: 'full' | 'title-only';
}

export interface JobResult {
  _id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  jobLink: string;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  profile: string;
  resumeViewLink?: string;
  resumeDownloadLink?: string;
  contactInfo?: string;
  applied: boolean;
  processedAt: string;
  source: string;
  location: string;
  postedAt: string;
  easyApply: boolean;
}

export interface PipelineStats {
  status: 'ok' | 'error';
  dbConnected: boolean;
  timestamp: string;
  isRunning?: boolean;
  lastRunAt?: string;
}
