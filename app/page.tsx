'use client';

import React, { useEffect, useState } from 'react';
import JobTable from '../components/JobTable';
import PipelineButton from '../components/PipelineButton';

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jobs');
      const json = await res.json();
      if (json.data) {
        setJobs(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <main style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Job Automation Dashboard</h1>
      <PipelineButton onComplete={fetchJobs} />
      
      <h2>Processed Jobs</h2>
      {loading ? (
        <p>Loading jobs...</p>
      ) : (
        <JobTable jobs={jobs} />
      )}
    </main>
  );
}
