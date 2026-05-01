import { IRawJob } from '../models/RawJob';
import { IScoredJob, IScoreBreakdown } from '../models/ScoredJob';
import { Profile } from '../lib/loadProfiles';

export function scoreJob(job: Partial<IRawJob>, profile: Profile): Partial<IScoredJob> {
  let totalScore = 0;
  const breakdown: IScoreBreakdown = {
    skills: 0,
    title: 0,
    experience: 0,
    recency: 0,
    quality: 0
  };

  const title = (job.title || '').toLowerCase();
  const desc = (job.description || '').toLowerCase();
  
  const isTitleOnly = desc.length < 100;

  // Factor 1: Skill match (35 pts, or 0 if title-only)
  if (profile.keywords && profile.keywords.length > 0) {
    let matches = 0;
    for (const kw of profile.keywords) {
      if (desc.includes(kw.toLowerCase())) {
        matches++;
      }
    }
    const skillScore = Math.min(35, Math.round((matches / profile.keywords.length) * 35));
    breakdown.skills = isTitleOnly ? 0 : skillScore;
    totalScore += breakdown.skills;
  }

  // Factor 2: Title relevance (25 pts, or 45 pts if title-only)
  let titleScore = 0;
  let matchedPattern = false;
  if (profile.titlePatterns) {
    for (const pattern of profile.titlePatterns) {
      if (title.includes(pattern.toLowerCase())) {
        matchedPattern = true;
        break;
      }
    }
  }

  if (matchedPattern || title.includes('software engineer')) {
    titleScore = isTitleOnly ? 45 : 25;
  } else if (title.includes('developer')) {
    titleScore = isTitleOnly ? 25 : 15;
  }
  breakdown.title = titleScore;
  totalScore += titleScore;

  // Factor 3: Experience alignment (20 pts, or 30 pts if title-only)
  let expScore = 10; // Default if no YOE mentioned
  
  const topTierExpRegex = /(0-1\s*year|1-2\s*year|fresher|entry\s*level|entry-level)/i;
  const midTierExpRegex = /(2\s*years?|two\s*years?)/i;
  // If it mentions 3+ years, the filter should have caught it, but just in case we don't reward it

  if (topTierExpRegex.test(desc) || topTierExpRegex.test(title)) {
    expScore = isTitleOnly ? 30 : 20;
  } else if (midTierExpRegex.test(desc) || midTierExpRegex.test(title)) {
    expScore = isTitleOnly ? 20 : 15;
  } else if (/years?\s*of\s*experience/i.test(desc)) {
    // Mentions experience but not entry-level values
    expScore = 5;
  }

  breakdown.experience = expScore;
  totalScore += expScore;

  // Factor 4: Recency (10 pts)
  let recencyScore = 0;
  const postedAt = job.postedAt ? new Date(job.postedAt) : new Date();
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - postedAt.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) {
    recencyScore = 10;
  } else if (diffDays <= 3) {
    recencyScore = 8;
  } else if (diffDays <= 7) {
    recencyScore = 5;
  } else {
    recencyScore = 0;
  }
  
  breakdown.recency = recencyScore;
  totalScore += recencyScore;

  // Factor 5: Description quality (10 pts, or 0 if title-only)
  let qualityScore = 0;
  if (desc.length > 500) {
    qualityScore += 5;
  }
  
  if (
    desc.includes('responsibilit') && 
    (desc.includes('requirement') || desc.includes('qualification'))
  ) {
    qualityScore += 5;
  }
  
  breakdown.quality = isTitleOnly ? 0 : qualityScore;
  totalScore += breakdown.quality;

  return {
    jobId: job.jobId,
    title: job.title,
    company: job.company,
    location: job.location,
    source: job.source,
    url: job.url,
    description: job.description,
    postedAt: job.postedAt,
    easyApply: job.easyApply,
    recruiter: job.recruiter,
    fetchedAt: job.fetchedAt,
    seen: job.seen,
    scoringMode: isTitleOnly ? 'title-only' : 'full',
    score: totalScore,
    scoreBreakdown: breakdown,
    profile: profile.name,
    scoredAt: new Date()
  };
}
