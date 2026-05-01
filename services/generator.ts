import { IScoredJob } from '../models/ScoredJob';
import { Profile } from '../lib/loadProfiles';

export async function generateResume(job: IScoredJob, profile: Profile): Promise<{ resumePath: string, usage: { prompt_tokens: number, completion_tokens: number } }> {
  const MAX_DESCRIPTION_CHARS = 1500;
  const descriptionStr = job.description || '';
  const truncatedDescription = descriptionStr.length > MAX_DESCRIPTION_CHARS
    ? descriptionStr.slice(0, MAX_DESCRIPTION_CHARS) + '\n[description truncated for brevity]'
    : descriptionStr;

  // Stub AI logic for Phase 4
  // We simulate an AI API call that consumes tokens based on the prompt size
  // Assuming ~4 chars per token, plus base profile prompt overhead
  const promptTokens = Math.floor(truncatedDescription.length / 4) + 1000;
  const completionTokens = 400; // Simulated resume length
  
  const usage = { prompt_tokens: promptTokens, completion_tokens: completionTokens };
  
  // Log the token usage per the user's request
  console.log(`[generator] Job ${job.jobId}: ${usage.prompt_tokens} prompt tokens, ${usage.completion_tokens} completion tokens`);

  // Return a mock resume link and the usage stats
  return {
    resumePath: `/resumes/mock_resume_${job.jobId}.pdf`,
    usage
  };
}
