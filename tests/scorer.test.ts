import { scoreJob } from '../services/scorer';
import { Profile } from '../lib/loadProfiles';
import { IRawJob } from '../models/RawJob';

describe('scoreJob', () => {
  const profile: Profile = {
    name: 'software_engineer',
    keywords: ['react', 'node', 'typescript', 'aws', 'docker'],
    rejectKeywords: [],
    titlePatterns: ['software engineer'],
    baseResumePath: 'resume.pdf'
  };

  const now = new Date();

  // Helper to create dates
  const daysAgo = (days: number) => {
    const d = new Date();
    d.setDate(now.getDate() - days);
    return d;
  };

  it('scores Job 1: Perfect Match', () => {
    // Should get:
    // Skills: 5/5 matches = 35
    // Title: "software engineer" = 25
    // Exp: "entry level" = 20
    // Recency: < 1 day = 10
    // Quality: > 500 chars (5) + reqs/resps (5) = 10
    // Total = 100
    const desc = `We are looking for an entry level engineer. 
    Responsibilities: write code using react, node, typescript, aws, and docker. 
    Requirements: be awesome. ` + 'A'.repeat(500);

    const job: Partial<IRawJob> = {
      title: 'Software Engineer',
      description: desc,
      postedAt: daysAgo(0)
    };

    const scored = scoreJob(job, profile);
    expect(scored.score).toBe(100);
    expect(scored.scoreBreakdown?.skills).toBe(35);
    expect(scored.scoreBreakdown?.title).toBe(25);
    expect(scored.scoreBreakdown?.experience).toBe(20);
    expect(scored.scoreBreakdown?.recency).toBe(10);
    expect(scored.scoreBreakdown?.quality).toBe(10);
  });

  it('scores Job 2: Good Developer Match', () => {
    // Should get:
    // Skills: 3/5 matches = (3/5)*35 = 21
    // Title: "developer" = 15
    // Exp: "1-2 years" = 20
    // Recency: 2 days = 8
    // Quality: short desc (0), no reqs (0) = 0
    // Total = 64
    const desc = `Need someone with 1-2 years experience in React, Node, and TypeScript.`;

    const job: Partial<IRawJob> = {
      title: 'Frontend Developer',
      description: desc,
      postedAt: daysAgo(2)
    };

    const scored = scoreJob(job, profile);
    expect(scored.scoreBreakdown?.skills).toBe(21);
    expect(scored.scoreBreakdown?.title).toBe(15);
    expect(scored.scoreBreakdown?.experience).toBe(20);
    expect(scored.scoreBreakdown?.recency).toBe(8);
    expect(scored.scoreBreakdown?.quality).toBe(0);
    expect(scored.score).toBe(64);
  });

  it('scores Job 3: Unrelated Job', () => {
    // Should get:
    // Skills: 0 matches = 0
    // Title: "Analyst" = 0
    // Exp: no YOE = 10
    // Recency: 5 days = 5
    // Quality: < 500 = 0
    // Total = 15
    const desc = `Analyze data using excel.`;

    const job: Partial<IRawJob> = {
      title: 'Data Analyst',
      description: desc,
      postedAt: daysAgo(5)
    };

    const scored = scoreJob(job, profile);
    expect(scored.scoreBreakdown?.skills).toBe(0);
    expect(scored.scoreBreakdown?.title).toBe(0);
    expect(scored.scoreBreakdown?.experience).toBe(10);
    expect(scored.scoreBreakdown?.recency).toBe(5);
    expect(scored.score).toBe(15);
  });

  it('scores Job 4: Older Job with 2 years exp', () => {
    // Should get:
    // Skills: 1/5 match = 7
    // Title: "software engineer" = 25
    // Exp: "2 years" = 15
    // Recency: 10 days = 0
    // Quality: > 500 = 5 (no responsibilities keyword)
    // Total = 52
    const desc = `Need 2 years experience. Must know aws. ` + 'A'.repeat(500);

    const job: Partial<IRawJob> = {
      title: 'Software Engineer',
      description: desc,
      postedAt: daysAgo(10)
    };

    const scored = scoreJob(job, profile);
    expect(scored.scoreBreakdown?.skills).toBe(7);
    expect(scored.scoreBreakdown?.title).toBe(25);
    expect(scored.scoreBreakdown?.experience).toBe(15);
    expect(scored.scoreBreakdown?.recency).toBe(0);
    expect(scored.scoreBreakdown?.quality).toBe(5);
    expect(scored.score).toBe(52);
  });

  it('scores Job 5: Mid-weight Developer', () => {
    // Should get:
    // Skills: 4/5 = 28
    // Title: "developer" = 15
    // Exp: "years of experience" but not entry = 5
    // Recency: 0 days = 10
    // Quality: > 500 + both sections = 10
    // Total = 68
    const desc = `You have years of experience. 
    Responsibilities: use react, node, typescript, aws. 
    Requirements: be good. ` + 'A'.repeat(500);

    const job: Partial<IRawJob> = {
      title: 'Full Stack Developer',
      description: desc,
      postedAt: daysAgo(0)
    };

    const scored = scoreJob(job, profile);
    expect(scored.scoreBreakdown?.skills).toBe(28);
    expect(scored.scoreBreakdown?.title).toBe(15);
    expect(scored.scoreBreakdown?.experience).toBe(5);
    expect(scored.scoreBreakdown?.recency).toBe(10);
    expect(scored.scoreBreakdown?.quality).toBe(10);
    expect(scored.score).toBe(68);
  });
});
