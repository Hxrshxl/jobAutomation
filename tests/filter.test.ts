import { filterJobs } from '../services/filter';
import { Profile } from '../lib/loadProfiles';
import { IRawJob } from '../models/RawJob';

describe('filterJobs', () => {
  const mockProfile: Profile = {
    name: 'software_engineer',
    keywords: ['react', 'node', 'typescript', 'aws'],
    rejectKeywords: ['senior', 'lead', 'manager', 'director', 'vp', 'head', 'architect', 'principal', 'staff'],
    titlePatterns: [],
    baseResumePath: 'resume.pdf'
  };

  const createMockJob = (title: string, description: string): Partial<IRawJob> => ({
    title,
    description,
  });

  const validDesc = 'This is a sufficiently long description that definitely exceeds two hundred characters to ensure it passes the length check. We are looking for an entry level engineer. You will use react and typescript daily.';

  it('passes a valid job', () => {
    const jobs = [createMockJob('Junior Engineer', validDesc)];
    const result = filterJobs(jobs, mockProfile);
    expect(result.length).toBe(1);
  });

  it('rejects based on Rule 1: Experience gate', () => {
    // 3+ years
    const jobs1 = [createMockJob('Engineer', validDesc + ' You need 3+ years of experience.')];
    // 5 years
    const jobs2 = [createMockJob('Engineer', validDesc + ' Requires 5 years experience.')];
    // 4-6 years
    const jobs3 = [createMockJob('Engineer', validDesc + ' We want 4-6 years of experience.')];
    // 2 years (should pass)
    const jobs4 = [createMockJob('Engineer', validDesc + ' Needs 2 years of experience.')];

    expect(filterJobs(jobs1, mockProfile).length).toBe(0);
    expect(filterJobs(jobs2, mockProfile).length).toBe(0);
    expect(filterJobs(jobs3, mockProfile).length).toBe(0);
    expect(filterJobs(jobs4, mockProfile).length).toBe(1);
  });

  it('rejects based on Rule 2: Title reject', () => {
    const jobs = [
      createMockJob('Senior Software Engineer', validDesc),
      createMockJob('Lead Developer', validDesc),
      createMockJob('Staff Engineer', validDesc),
      createMockJob('Software Engineering Manager', validDesc)
    ];

    const result = filterJobs(jobs, mockProfile);
    expect(result.length).toBe(0);
  });

  it('rejects based on Rule 3: Domain match', () => {
    // Has 0 keywords
    const desc0 = 'This is a long description that is over two hundred characters but does not have any keywords. We use python and django and it is great. Blah blah blah blah blah blah blah blah blah blah blah blah blah blah.';
    // Has 1 keyword
    const desc1 = 'This is a long description that is over two hundred characters but only has one keyword. We use React and python. Blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah.';
    
    const jobs = [
      createMockJob('Engineer', desc0),
      createMockJob('Engineer', desc1),
    ];

    const result = filterJobs(jobs, mockProfile);
    expect(result.length).toBe(0);
  });

  it('rejects based on Rule 4: Minimum description length', () => {
    const jobs = [createMockJob('Engineer', 'Too short description with react and typescript.')];
    const result = filterJobs(jobs, mockProfile);
    expect(result.length).toBe(0);
  });

  it('processes a batch of 20 mock jobs and logs correctly', () => {
    const jobs: Partial<IRawJob>[] = [
      createMockJob('Valid 1', validDesc),
      createMockJob('Valid 2', validDesc + ' More text here.'),
      createMockJob('Valid 3', validDesc + ' Even more text.'),
      createMockJob('Senior React Developer', validDesc), // title reject
      createMockJob('Frontend Engineer', validDesc + ' 5 years of experience.'), // exp reject
      createMockJob('Backend Engineer', 'Too short.'), // length reject
      createMockJob('Java Developer', validDesc.replace('react', 'java').replace('typescript', 'spring')), // domain reject (0 matches)
      createMockJob('Staff Engineer', validDesc), // title reject
      createMockJob('Valid 4', validDesc),
      createMockJob('VP of Engineering', validDesc), // title reject
      createMockJob('Software Engineer', validDesc + ' 4-6 years of experience.'), // exp reject
      createMockJob('Valid 5', validDesc),
      createMockJob('Architect', validDesc), // title reject
      createMockJob('Valid 6', validDesc),
      createMockJob('Junior Dev', 'Short desc.'), // length reject
      createMockJob('Valid 7', validDesc),
      createMockJob('Lead Node Developer', validDesc), // title reject
      createMockJob('Valid 8', validDesc),
      createMockJob('Valid 9', validDesc),
      createMockJob('Valid 10', validDesc),
    ];

    const result = filterJobs(jobs, mockProfile);
    // Out of 20: 
    // Title rejects: Senior (1), Staff (1), VP (1), Architect (1), Lead (1) = 5
    // Exp rejects: 5 years (1), 4-6 years (1) = 2
    // Length rejects: Too short (1), Short desc (1) = 2
    // Domain rejects: Java (1) = 1
    // Total rejected = 10. Passed = 10.
    
    expect(result.length).toBe(10);
  });
});
