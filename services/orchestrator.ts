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
import { SCORE_THRESHOLD, MAX_JOBS, MAX_AI_CALLS_PER_RUN } from '../config/settings';

// Global Tracking for AI Cost Budget
let globalAiCallCount = 0;
let globalPromptTokens = 0;
let globalCompletionTokens = 0;

// Models (imported here so they are registered with Mongoose before any query)
import RawJob, { IRawJob } from '../models/RawJob';
import ScoredJob, { IScoredJob } from '../models/ScoredJob';
import JobResult from '../models/JobResult';
import AppState from '../models/AppState';
import { fetchJobs } from './fetcher';
import { FetchOptions } from './fetcher/BaseFetcher';
import { scoreJob } from './scorer';
import { filterJobs as filterRawJobs } from './filter';
import { generateResume } from './generator';

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

async function validateScoreWithAI(job: IScoredJob, profile: Profile): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith('sk-...')) {
    log('warn', 'validateScoreWithAI', 'No valid OPENAI_API_KEY, skipping AI validation');
    return false; // Return false or true? False is safer
  }

  const prompt = `Is this job appropriate for a 0-2 year experience software engineer?
Job Title: ${job.title}
Job Description:
${(job.description || '').substring(0, 1500)}
Respond with only YES or NO.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 10
      })
    });
    
    if (!response.ok) {
      log('warn', 'validateScoreWithAI', `OpenAI API error: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim()?.toUpperCase() || '';
    return answer.includes('YES');
  } catch (err) {
    log('error', 'validateScoreWithAI', `AI call failed`, { err: String(err) });
    return false;
  }
}

/**
 * scoreJobs
 * Scored each RawJob against the profile and returns ScoredJob docs.
 */
async function scoreJobs(
  jobs: IRawJob[],
  profile: Profile
): Promise<IScoredJob[]> {
  const preFilteredJobs = filterRawJobs(jobs, profile) as IRawJob[];
  
  const scored = preFilteredJobs.map(j => scoreJob(j, profile) as IScoredJob);
  
  for (const job of scored) {
    if (job.score >= 70 && job.score <= 79) {
      log('info', 'scoreJobs', `Validating borderline job ${job.jobId} (score: ${job.score}) via AI`);
      const isConfirmed = await validateScoreWithAI(job, profile);
      if (isConfirmed) {
        log('info', 'scoreJobs', `AI confirmed job ${job.jobId}, bumping score to 75`);
        job.score = 75;
      } else {
        log('info', 'scoreJobs', `AI rejected job ${job.jobId}, keeping score`);
      }
    }
  }

  log('info', 'scoreJobs', `Scored ${scored.length} jobs`, { profile: profile.name });
  return scored;
}

/**
 * filterJobs
 * Keep only jobs whose score meets the configured threshold.
 */
function filterJobs(jobs: IScoredJob[], profileName: string): IScoredJob[] {
  let qualifiedJobs = jobs.filter((j) => {
    const threshold = j.scoringMode === 'title-only' ? 60 : SCORE_THRESHOLD;
    return j.score >= threshold;
  });

  if (qualifiedJobs.length > MAX_JOBS) {
    log('warn', 'orchestrator', `${qualifiedJobs.length} jobs passed threshold for profile ${profileName} — exceeds MAX_JOBS_PER_PROFILE (${MAX_JOBS}). Truncating to top ${MAX_JOBS} by score.`);
    qualifiedJobs = qualifiedJobs
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_JOBS);
  } else {
    qualifiedJobs = qualifiedJobs.sort((a, b) => b.score - a.score);
  }
  
  log('info', 'filterJobs', `Scored: ${jobs.length} | Passed Threshold/Selected: ${qualifiedJobs.length}`);
  return qualifiedJobs;
}

/**
 * tailorResumes
 * Generate a profile-specific resume PDF for each qualifying job.
 */
async function tailorResumes(
  jobs: IScoredJob[],
  profile: Profile
): Promise<Map<string, string>> {
  const resumeMap = new Map<string, string>();
  
  for (const job of jobs) {
    if (globalAiCallCount >= MAX_AI_CALLS_PER_RUN) {
      log('warn', 'pipeline', `Global AI call budget (${MAX_AI_CALLS_PER_RUN}) reached. Skipping resume generation for remaining jobs.`);
      break;
    }
    
    try {
      const { resumePath, usage } = await generateResume(job, profile);
      resumeMap.set(job.jobId, resumePath);
      
      globalAiCallCount++;
      globalPromptTokens += usage.prompt_tokens;
      globalCompletionTokens += usage.completion_tokens;
    } catch (err) {
      log('error', 'tailorResumes', `Failed to generate resume for ${job.jobId}`, { err: String(err) });
    }
  }

  log('info', 'tailorResumes', `Tailoring resumes for ${jobs.length} jobs`, {
    profile: profile.name,
    baseResume: profile.baseResumePath,
    generated: resumeMap.size
  });
  
  return resumeMap;
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
  log('info', 'persistResults', `Persisting ${scoredJobs.length} scored / ${appliedJobs.length} applied`, {
    profile: profile.name,
    models: [ScoredJob.modelName, JobResult.modelName],
  });

  // Save each ScoredJob using findOneAndUpdate with upsert
  for (const job of scoredJobs) {
    // Drop the Mongoose Document metadata properties when saving via findOneAndUpdate
    const jobObj = typeof job.toObject === 'function' ? job.toObject() : job;
    delete jobObj._id;
    delete jobObj.__v;

    await ScoredJob.findOneAndUpdate(
      { jobId: job.jobId, profile: profile.name },
      { $set: jobObj },
      { upsert: true, returnDocument: 'after' }
    );
  }

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

export async function runPipeline(profile: Profile, options: FetchOptions = { runType: 'full', tiers: ['all'] }): Promise<PipelineSummary> {
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
    rawJobs = await fetchJobs(profile, options);
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
    qualifiedJobs = filterJobs(scoredJobs, profile.name);
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

export async function runAllProfiles(options: FetchOptions = { runType: 'full', tiers: ['all'] }): Promise<PipelineSummary[]> {
  globalAiCallCount = 0;
  globalPromptTokens = 0;
  globalCompletionTokens = 0;

  // 1. Ensure DB is connected for AppState check
  try {
    await dbConnect();
  } catch (err) {
    log('error', 'connectDb', 'Failed to connect to MongoDB for AppState', { err: String(err) });
    throw err;
  }

  const lockKey = 'pipelineRunning';
  const lockThreshold = new Date(Date.now() - 90 * 60 * 1000); // 90 minutes ago

  // 2. Ensure document exists
  await AppState.updateOne(
    { key: lockKey },
    { $setOnInsert: { value: false, updatedAt: new Date() } },
    { upsert: true }
  );

  // 3. Attempt to acquire lock atomically
  const acquiredLock = await AppState.findOneAndUpdate(
    { 
      key: lockKey, 
      $or: [ { value: false }, { updatedAt: { $lt: lockThreshold } } ] 
    },
    { $set: { value: true, updatedAt: new Date() } },
    { new: true }
  );

  if (!acquiredLock) {
    const currentLock = await AppState.findOne({ key: lockKey });
    const startedAt = currentLock?.updatedAt?.toISOString() || new Date().toISOString();
    const error: any = new Error('Pipeline already running');
    error.status = 409;
    error.startedAt = startedAt;
    throw error;
  }

  try {
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
        const summary = await runPipeline(profile, options);
        results.push(summary);
      } catch (err) {
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

    // Log total cost
    const inputCost = (globalPromptTokens / 1000) * 0.005;
    const outputCost = (globalCompletionTokens / 1000) * 0.015;
    log('info', 'runAllProfiles', `AI Usage this run: ${globalAiCallCount} calls | ${globalPromptTokens} input tokens | ${globalCompletionTokens} output tokens | Estimated Cost: $${(inputCost + outputCost).toFixed(4)}`);

    return results;
  } finally {
    // 4. Always release the lock
    await AppState.updateOne(
      { key: lockKey },
      { $set: { value: false, updatedAt: new Date() } }
    );
  }
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
