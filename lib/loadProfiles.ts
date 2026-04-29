import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// ---------------------------------------------------------------------------
// Type definition
// ---------------------------------------------------------------------------

export interface Profile {
  /** Display name, e.g. "software_engineer" */
  name: string;
  /** Keywords used for scoring job descriptions */
  keywords: string[];
  /** Job title substrings to match (case-insensitive) */
  titlePatterns: string[];
  /** Keywords that disqualify a job immediately */
  rejectKeywords: string[];
  /** Relative path to the base resume PDF */
  baseResumePath: string;
}

// ---------------------------------------------------------------------------
// Validation helper
// ---------------------------------------------------------------------------

function validateProfile(raw: unknown, filename: string): Profile {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`[loadProfiles] ${filename}: YAML root must be an object`);
  }

  const obj = raw as Record<string, unknown>;

  const requiredStrings: (keyof Profile)[] = ['name', 'baseResumePath'];
  for (const key of requiredStrings) {
    if (typeof obj[key] !== 'string' || !(obj[key] as string).trim()) {
      throw new Error(`[loadProfiles] ${filename}: "${key}" must be a non-empty string`);
    }
  }

  const requiredArrays: (keyof Profile)[] = ['keywords', 'titlePatterns', 'rejectKeywords'];
  for (const key of requiredArrays) {
    if (!Array.isArray(obj[key])) {
      throw new Error(`[loadProfiles] ${filename}: "${key}" must be an array`);
    }
  }

  return {
    name:           obj.name as string,
    keywords:       obj.keywords as string[],
    titlePatterns:  obj.titlePatterns as string[],
    rejectKeywords: obj.rejectKeywords as string[],
    baseResumePath: obj.baseResumePath as string,
  };
}

// ---------------------------------------------------------------------------
// Main loader
// ---------------------------------------------------------------------------

const PROFILES_DIR = path.resolve(process.cwd(), 'config', 'profiles');

/**
 * Reads every *.yaml file in config/profiles/, validates the shape,
 * and returns a typed Profile[].
 */
export function loadProfiles(): Profile[] {
  const files = fs
    .readdirSync(PROFILES_DIR)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

  if (files.length === 0) {
    throw new Error(`[loadProfiles] No YAML files found in ${PROFILES_DIR}`);
  }

  return files.map((file) => {
    const fullPath = path.join(PROFILES_DIR, file);
    const raw = yaml.load(fs.readFileSync(fullPath, 'utf8'));
    return validateProfile(raw, file);
  });
}
