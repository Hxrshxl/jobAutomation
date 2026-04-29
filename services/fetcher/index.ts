import { IRawJob } from '../../models/RawJob';
import { Profile } from '../../lib/loadProfiles';
import { mockJobs } from '../../data/mockJobs';

export async function fetchJobs(profile: Profile): Promise<IRawJob[]> {
  const useMockData = process.env.USE_MOCK_DATA === 'true';
  
  if (useMockData) {
    return mockJobs as IRawJob[];
  }
  
  // Real implementation would go here
  return [];
}
