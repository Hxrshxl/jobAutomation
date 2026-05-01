import mongoose from 'mongoose';
import RawJob from './models/RawJob';
import ScoredJob from './models/ScoredJob';
import JobResult from './models/JobResult';

require('dotenv').config({ path: '.env.local' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('Connected');
  
  // Create RawJob
  const rawJob = await RawJob.create({
    jobId: 'test-raw-123',
    title: 'Test Title',
    company: 'TestCo',
    location: 'Remote',
    source: 'linkedin',
    url: 'https://test.com',
    description: 'Test desc',
    postedAt: new Date(),
    easyApply: true,
    recruiter: 'John',
    fetchedAt: new Date(),
    seen: false
  });
  console.log('RawJob saved:', rawJob.jobId);
  
  // Create ScoredJob
  const scoredJob = await ScoredJob.create({
    jobId: 'test-raw-123',
    profile: 'test_profile',
    title: 'Test Title',
    company: 'TestCo',
    location: 'Remote',
    source: 'linkedin',
    url: 'https://test.com',
    description: 'Test desc',
    postedAt: new Date(),
    score: 85,
    scoreBreakdown: {
      skillMatch: 30,
      titleRelevance: 20,
      experienceAlignment: 15,
      recency: 10,
      descriptionQuality: 10
    },
    scoringMode: 'full',
    easyApply: true,
    scoredAt: new Date()
  });
  console.log('ScoredJob saved:', scoredJob.jobId);
  
  try {
    await ScoredJob.create({
      ...scoredJob.toObject(),
      _id: new mongoose.Types.ObjectId()
    });
    console.log('FAIL: Duplicate allowed');
  } catch(e: any) {
    console.log('PASS: Duplicate ScoredJob rejected:', e.code);
  }

  // Create JobResult
  const jobResult = await JobResult.create({
    jobTitle: 'Test Title',
    company: 'TestCo',
    score: 85,
    jobLink: 'https://test.com',
    profile: 'test_profile',
    resumeLink: '/resumes/test.pdf',
    contactInfo: 'none',
    applied: false,
    processedAt: new Date()
  });
  console.log('JobResult saved:', jobResult.jobTitle);

  // Cleanup
  await RawJob.deleteMany({ jobId: 'test-raw-123' });
  await ScoredJob.deleteMany({ jobId: 'test-raw-123' });
  await JobResult.deleteMany({ jobTitle: 'Test Title' });
  
  await mongoose.disconnect();
}
run();
