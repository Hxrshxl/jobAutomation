/**
 * services/orchestrator.ts
 *
 * THE single file that imports from every other service.
 * Nothing outside this file should import multiple services directly.
 *
 * Pipeline for one profile:
 *   1. connectDb        – ensure MongoDB is ready
 *   2. fetchJobs        – scrape / call job-board APIs  (stub)
 *   3. deduplicateJobs  – drop already-seen jobIds       (stub)
 *   4. scoreJobs        – rank each job against profile  (stub)
 *   5. filterJobs       – keep only score >= threshold   (stub)
 *   6. tailorResumes    – generate profile-specific PDFs (stub)
 *   7. applyToJobs      – submit applications            (stub)
 *   8. persistResults   – write ScoredJob / JobResult docs(stub)
 *   9. notify           – send summary notification      (stub)
 */

// ---------------------------------------------------------------------------
// External / internal imports
// ---------------------------------------------------------------------------

import dbConnect from '../lib/mongodb';
import { loadProfiles, Profile } from '../lib/loadProfiles';
import { SCORE_THRESHOLD, MAX_JOBS } from '../config/settings';

// Models (imported here so they are registered with Mongoose before any query)
import RawJob, { IRawJob } from '../models/RawJob';
import ScoredJob, { IScoredJob } from '../models/ScoredJob';
import JobResult from '../models/JobResult';
import { fetchJobs } from './fetcher';

// ---------------------------------------------------------------------------
// Structured logger
// ---------------------------------------------------------------------------

type LogLevel = 'info' | 'warn' | 'error';

function log(level: LogLevel, stage: string, message: string, meta?: unknown): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    stage,
    message,
    ...(meta !== undefined ? { meta } : {}),
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// ---------------------------------------------------------------------------
// Stub: failure notification
// ---------------------------------------------------------------------------

/**
 * sendFailureNotification
 * Stub — replace with real email / Slack / webhook call.
 */
async function sendFailureNotification(
  context: string,
  err: unknown
): Promise<void> {
  // TODO: integrate with a notification provider (e.g. SendGrid, Slack webhook)
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: 'fatal',
      stage: 'notification',
      message: `FAILURE NOTIFICATION — ${context}`,
      error: err instanceof Error ? err.message : String(err),
    })
  );
}

// ---------------------------------------------------------------------------
// Stub service functions
// ---------------------------------------------------------------------------

// fetchJobs is now imported from ./fetcher

/**
 * deduplicateJobs
 * Stub — filter out jobIds already stored in MongoDB.
 */
async function deduplicateJobs(
  jobs: IRawJob[],
  profile: Profile
): Promise<IRawJob[]> {
  // TODO: query RawJob collection and remove already-seen jobIds
  log('info', 'deduplicateJobs', `Deduplicating ${jobs.length} jobs`, {
    profile: profile.name,
    model: RawJob.modelName,
  });
  return jobs;
}

/**
 * scoreJobs
 * Stub — score each RawJob against the profile and return ScoredJob docs.
 */
async function scoreJobs(
  jobs: IRawJob[],
  profile: Profile
): Promise<IScoredJob[]> {
  // TODO: implement keyword-based / LLM scoring
  log('info', 'scoreJobs', `Scoring ${jobs.length} jobs`, { profile: profile.name });
  return jobs.map(j => ({
    ...j,
    score: 80,
    scoreBreakdown: {},
    profile: profile.name,
    scoredAt: new Date()
  })) as unknown as IScoredJob[];
}

/**
 * filterJobs
 * Keep only jobs whose score meets the configured threshold.
 */
function filterJobs(jobs: IScoredJob[]): IScoredJob[] {
  const filtered = jobs.filter((j) => j.score >= SCORE_THRESHOLD);
  log('info', 'filterJobs', `${filtered.length}/${jobs.length} jobs passed threshold ${SCORE_THRESHOLD}`);
  return filtered;
}

/**
 * tailorResumes
 * Stub — generate a profile-specific resume PDF for each qualifying job.
 */
async function tailorResumes(
  jobs: IScoredJob[],
  profile: Profile
): Promise<Map<string, string>> {
  // Returns Map<jobId, resumeFilePath>
  // TODO: call pdflatex / template engine here
  log('info', 'tailorResumes', `Tailoring resumes for ${jobs.length} jobs`, {
    profile: profile.name,
    baseResume: profile.baseResumePath,
  });
  return new Map();
}

/**
 * applyToJobs
 * Stub — submit an application for each qualifying job.
 */
async function applyToJobs(
  jobs: IScoredJob[],
  resumeMap: Map<string, string>,
  profile: Profile
): Promise<void> {
  // TODO: automate form-fill / Easy Apply / email outreach
  log('info', 'applyToJobs', `Applying to ${jobs.length} jobs`, { profile: profile.name });
  void resumeMap; // suppress unused-variable warning until implemented
}

/**
 * persistResults
 * Stub — upsert ScoredJob documents and insert JobResult records.
 */
async function persistResults(
  scoredJobs: IScoredJob[],
  appliedJobs: IScoredJob[],
  resumeMap: Map<string, string>,
  profile: Profile
): Promise<void> {
  // TODO: bulkWrite ScoredJob upserts, insert JobResult docs
  log('info', 'persistResults', `Persisting ${scoredJobs.length} scored / ${appliedJobs.length} applied`, {
    profile: profile.name,
    models: [ScoredJob.modelName, JobResult.modelName],
  });

  const results = appliedJobs.map(job => ({
    jobTitle: job.title,
    company: job.company,
    jobLink: job.url,
    score: job.score,
    profile: profile.name,
    resumeLink: resumeMap.get(job.jobId) || '',
    contactInfo: job.recruiter || '',
    applied: true,
  }));

  if (results.length > 0) {
    await JobResult.insertMany(results);
  }
}

/**
 * notify
 * Stub — send a run-summary notification (email, Slack, etc.).
 */
async function notify(profile: Profile, summary: PipelineSummary): Promise<void> {
  // TODO: integrate notification provider
  log('info', 'notify', 'Run summary', { profile: profile.name, summary });
}

// ---------------------------------------------------------------------------
// Pipeline summary type
// ---------------------------------------------------------------------------

interface PipelineSummary {
  profile: string;
  fetched: number;
  unique: number;
  scored: number;
  qualified: number;
  applied: number;
  durationMs: number;
  status: 'success' | 'partial' | 'failed';
}

// ---------------------------------------------------------------------------
// runPipeline — full pipeline for a single profile
// ---------------------------------------------------------------------------

export async function runPipeline(profile: Profile): Promise<PipelineSummary> {
  const start = Date.now();
  const summary: PipelineSummary = {
    profile: profile.name,
    fetched: 0,
    unique: 0,
    scored: 0,
    qualified: 0,
    applied: 0,
    durationMs: 0,
    status: 'failed',
  };

  log('info', 'pipeline', `▶ Starting pipeline`, { profile: profile.name });

  // 1. Connect to DB --------------------------------------------------------
  try {
    await dbConnect();
    log('info', 'connectDb', 'MongoDB connected');
  } catch (err) {
    log('error', 'connectDb', 'Failed to connect to MongoDB', { err: String(err) });
    summary.durationMs = Date.now() - start;
    return summary; // cannot proceed without DB
  }

  // 2. Fetch jobs -----------------------------------------------------------
  let rawJobs: IRawJob[] = [];
  try {
    rawJobs = await fetchJobs(profile);
    summary.fetched = rawJobs.length;
    log('info', 'fetchJobs', `Fetched ${rawJobs.length} jobs`);
  } catch (err) {
    log('error', 'fetchJobs', 'Job fetch failed', { err: String(err) });
    summary.durationMs = Date.now() - start;
    return summary;
  }

  // 3. Deduplicate ----------------------------------------------------------
  let newJobs: IRawJob[] = [];
  try {
    newJobs = await deduplicateJobs(rawJobs, profile);
    summary.unique = newJobs.length;
    log('info', 'deduplicateJobs', `${newJobs.length} new jobs after dedup`);
  } catch (err) {
    log('error', 'deduplicateJobs', 'Deduplication failed — proceeding with all fetched jobs', {
      err: String(err),
    });
    newJobs = rawJobs; // graceful fallback: process all (may cause duplicate writes)
    summary.status = 'partial';
  }

  // 4. Score ----------------------------------------------------------------
  let scoredJobs: IScoredJob[] = [];
  try {
    scoredJobs = await scoreJobs(newJobs, profile);
    summary.scored = scoredJobs.length;
    log('info', 'scoreJobs', `Scored ${scoredJobs.length} jobs`);
    
    // Mark processed RawJobs as seen
    const jobIds = scoredJobs.map(j => j.jobId);
    if (jobIds.length > 0) {
      await RawJob.updateMany({ jobId: { $in: jobIds } }, { $set: { seen: true } });
      log('info', 'scoreJobs', `Marked ${jobIds.length} jobs as seen`);
    }
  } catch (err) {
    log('error', 'scoreJobs', 'Scoring failed', { err: String(err) });
    summary.durationMs = Date.now() - start;
    return summary;
  }

  // 5. Filter ---------------------------------------------------------------
  let qualifiedJobs: IScoredJob[] = [];
  try {
    qualifiedJobs = filterJobs(scoredJobs);
    summary.qualified = qualifiedJobs.length;
  } catch (err) {
    log('error', 'filterJobs', 'Filter step failed', { err: String(err) });
    summary.durationMs = Date.now() - start;
    return summary;
  }

  // 6. Tailor resumes -------------------------------------------------------
  let resumeMap = new Map<string, string>();
  try {
    resumeMap = await tailorResumes(qualifiedJobs, profile);
    log('info', 'tailorResumes', `Generated ${resumeMap.size} resume(s)`);
  } catch (err) {
    log('error', 'tailorResumes', 'Resume tailoring failed — skipping apply step', {
      err: String(err),
    });
    summary.status = 'partial';
    // fall through: persist what we have, skip applying
    qualifiedJobs = [];
  }

  // 7. Apply ----------------------------------------------------------------
  try {
    await applyToJobs(qualifiedJobs, resumeMap, profile);
    summary.applied = qualifiedJobs.length;
    log('info', 'applyToJobs', `Applied to ${qualifiedJobs.length} jobs`);
  } catch (err) {
    log('error', 'applyToJobs', 'Apply step failed', { err: String(err) });
    summary.status = 'partial';
    // do NOT return — we still want to persist scored results
  }

  // 8. Persist --------------------------------------------------------------
  try {
    await persistResults(scoredJobs, qualifiedJobs, resumeMap, profile);
    log('info', 'persistResults', 'Results persisted');
  } catch (err) {
    log('error', 'persistResults', 'Persist step failed', { err: String(err) });
    summary.status = 'partial';
  }

  // 9. Notify ---------------------------------------------------------------
  summary.durationMs = Date.now() - start;
  if (summary.status !== 'partial') {
    summary.status = 'success';
  }

  try {
    await notify(profile, summary);
  } catch (err) {
    log('warn', 'notify', 'Notification failed (non-fatal)', { err: String(err) });
  }

  log('info', 'pipeline', `■ Pipeline complete`, { profile: profile.name, summary });
  return summary;
}

// ---------------------------------------------------------------------------
// runAllProfiles — iterate every profile and run the full pipeline
// ---------------------------------------------------------------------------

export async function runAllProfiles(): Promise<PipelineSummary[]> {
  let profiles: Profile[];

  try {
    profiles = loadProfiles();
    log('info', 'runAllProfiles', `Loaded ${profiles.length} profile(s)`);
  } catch (err) {
    log('error', 'runAllProfiles', 'Failed to load profiles', { err: String(err) });
    await sendFailureNotification('loadProfiles', err);
    return [];
  }

  const results: PipelineSummary[] = [];

  for (const profile of profiles) {
    try {
      const summary = await runPipeline(profile);
      results.push(summary);
    } catch (err) {
      // runPipeline has its own per-stage try/catch, but this is a safety net
      log('error', 'runAllProfiles', `Unhandled error in pipeline for "${profile.name}"`, {
        err: String(err),
      });
      await sendFailureNotification(`pipeline:${profile.name}`, err);
      results.push({
        profile: profile.name,
        fetched: 0,
        unique: 0,
        scored: 0,
        qualified: 0,
        applied: 0,
        durationMs: 0,
        status: 'failed',
      });
    }
  }

  log('info', 'runAllProfiles', 'All profiles processed', {
    total: results.length,
    succeeded: results.filter((r) => r.status === 'success').length,
    partial: results.filter((r) => r.status === 'partial').length,
    failed: results.filter((r) => r.status === 'failed').length,
  });

  return results;
}

// ---------------------------------------------------------------------------
// Top-level unhandled rejection / exception guard
// ---------------------------------------------------------------------------

process.on('unhandledRejection', async (reason) => {
  log('error', 'unhandledRejection', 'Unhandled promise rejection', { reason: String(reason) });
  await sendFailureNotification('unhandledRejection', reason);
  process.exitCode = 1;
});

process.on('uncaughtException', async (err) => {
  log('error', 'uncaughtException', 'Uncaught exception — process will exit', {
    err: err.message,
    stack: err.stack,
  });
  await sendFailureNotification('uncaughtException', err);
  process.exit(1);
});
