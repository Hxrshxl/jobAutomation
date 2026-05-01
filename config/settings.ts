/**
 * config/settings.ts
 * Central place for all runtime configuration.
 * Values are read from process.env and validated with sensible defaults.
 */

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/** Minimum match score (0-100) a job must reach to be acted upon */
export const SCORE_THRESHOLD = parseInt(
  requireEnv('SCORE_THRESHOLD', '75'),
  10
);

/** Max number of jobs to fetch per profile per run */
export const MAX_JOBS = parseInt(
  requireEnv('MAX_JOBS_PER_PROFILE', '20'),
  10
);

/** Global budget for AI resume generation calls per run */
export const MAX_AI_CALLS_PER_RUN = parseInt(
  requireEnv('MAX_AI_CALLS_PER_RUN', '80'),
  10
);

/**
 * Interval in hours between scheduled runs.
 * Intended Schedule (for Phase 7):
 * - Every 2 hours: runType: 'fresh', Tier 1 companies only + all job boards with freshness filter
 * - Every 6 hours: runType: 'fresh', Tier 1 + Tier 2 companies
 * - Once daily at midnight: runType: 'full', all tiers, no freshness filter
 */
export const SCHEDULE_HOURS = parseInt(
  requireEnv('SCHEDULE_HOURS', '6'),
  10
);

export const TIER1_INTERVAL_HOURS = parseInt(requireEnv('TIER1_INTERVAL_HOURS', '2'), 10);
export const TIER2_INTERVAL_HOURS = parseInt(requireEnv('TIER2_INTERVAL_HOURS', '6'), 10);
export const TIER3_INTERVAL_HOURS = parseInt(requireEnv('TIER3_INTERVAL_HOURS', '24'), 10);
