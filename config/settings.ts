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

/**
 * Interval in hours between scheduled runs.
 * e.g. 6 → runs every 6 hours.
 */
export const SCHEDULE_HOURS = parseInt(
  requireEnv('SCHEDULE_HOURS', '6'),
  10
);
