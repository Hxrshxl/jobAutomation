import crypto from 'crypto';
import dbConnect from '../../lib/mongodb';
import RawJob, { IRawJob } from '../../models/RawJob';
import ScoredJob from '../../models/ScoredJob';
import { Profile } from '../../lib/loadProfiles';

export abstract class BaseFetcher {
  /**
   * Main fetch method to be implemented by specific job board fetchers.
   * We return Partial<IRawJob> because Mongoose Document properties like _id 
   * might not be present until it is saved to the database.
   */
  abstract fetch(profile: Profile): Promise<Partial<IRawJob>[]>;

  /**
   * Generates a deterministic SHA-256 hash for a given URL to use as a unique jobId.
   */
  protected _generateJobId(url: string): string {
    return crypto.createHash('sha256').update(url).digest('hex');
  }

  /**
   * Checks if a job has already been seen in the system by looking up the 
   * jobId in both the RawJob and ScoredJob collections.
   */
  protected async _isAlreadySeen(jobId: string, profileName: string): Promise<boolean> {
    await dbConnect();

    // 1. Check if the job was already fetched and stored globally
    const rawExists = await RawJob.exists({ jobId });
    if (rawExists) return true;

    // 2. Check if the job was already scored specifically for this profile combo
    const scoredExists = await ScoredJob.exists({ jobId, profile: profileName });
    if (scoredExists) return true;

    return false;
  }
}
