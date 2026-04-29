import { IRawJob } from '../models/RawJob';

export const mockJobs: Partial<IRawJob>[] = [
  {
    jobId: "mock-1", title: "Backend Developer", company: "TechCorp", source: "linkedin", url: "http://example.com/1", description: "Node.js backend role."
  },
  {
    jobId: "mock-2", title: "Senior Node.js Engineer", company: "Innovate INC", source: "naukri", url: "http://example.com/2", description: "Looking for 5+ years of Node.js experience."
  },
  {
    jobId: "mock-3", title: "Software Engineer III", company: "Big Data Co", source: "linkedin", url: "http://example.com/3", description: "Building data pipelines with Python."
  },
  {
    jobId: "mock-4", title: "API Developer", company: "StartupX", source: "indeed", url: "http://example.com/4", description: "REST API development."
  },
  {
    jobId: "mock-5", title: "Go Developer", company: "TechCorp", source: "linkedin", url: "http://example.com/5", description: "Golang microservices."
  },
  {
    jobId: "mock-6", title: "Java Engineer", company: "Enterprise Ltd", source: "linkedin", url: "http://example.com/6", description: "Spring Boot enterprise applications."
  },
  {
    jobId: "mock-7", title: "Full Stack Developer", company: "WebWorks", source: "glassdoor", url: "http://example.com/7", description: "React and Node.js developer."
  },
  {
    jobId: "mock-8", title: "Python Developer", company: "Data Inc", source: "linkedin", url: "http://example.com/8", description: "Django and Flask developer."
  },
  {
    jobId: "mock-9", title: "Backend Lead", company: "StartupY", source: "linkedin", url: "http://example.com/9", description: "Leading a team of 5 backend engineers."
  },
  {
    jobId: "mock-10", title: "Cloud Engineer", company: "CloudNet", source: "linkedin", url: "http://example.com/10", description: "AWS and Kubernetes experience required."
  }
];
