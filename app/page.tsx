'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { JobResult } from '../lib/types';
import StatsBar from '../components/dashboard/StatsBar';
import FilterBar, { FilterState, defaultFilters } from '../components/dashboard/FilterBar';
import JobsTable from '../components/dashboard/JobsTable';

export default function Dashboard() {
  const [data, setData] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const fetchJobs = async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const res = await fetch('/api/jobs?page=1&limit=200');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const d = await res.json();
      setData(d.data || []);
    } catch (e: any) {
      if (!isPolling) {
        setError(e.message);
        toast.error('Failed to load jobs: ' + e.message);
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => fetchJobs(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyChange = async (jobId: string, applied: boolean) => {
    // optimistic update
    setData((prev) => prev.map((j) => (j._id === jobId ? { ...j, applied } : j)));
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applied }),
      });
      if (!res.ok) throw new Error('Failed to update status');
    } catch (err) {
      toast.error('Failed to update job status');
      // revert on failure
      setData((prev) => prev.map((j) => (j._id === jobId ? { ...j, applied: !applied } : j)));
    }
  };

  const handleRunPipeline = async () => {
    const toastId = toast.loading('Starting pipeline...');
    try {
      const res = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_PIPELINE_SECRET ?? '',
          'Content-Type': 'application/json'
        }
      });
      if (res.status === 409) {
        toast.error('Pipeline already running', { id: toastId });
      } else if (res.ok) {
        toast.success('Pipeline started successfully', { id: toastId });
      } else {
        toast.error('Failed to start pipeline', { id: toastId });
      }
    } catch (err) {
      toast.error('Error triggering pipeline', { id: toastId });
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((job) => {
      // Search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !job.jobTitle.toLowerCase().includes(searchLower) &&
          !job.company.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
      // Profile
      if (filters.profile !== 'All Profiles' && job.profile !== filters.profile) {
        return false;
      }
      // Source
      if (filters.source !== 'All Sources' && job.source.toLowerCase() !== filters.source.toLowerCase()) {
        return false;
      }
      // Score Range
      if (filters.scoreRange !== 'All Scores') {
        const score = job.score;
        if (filters.scoreRange === '>= 90' && score < 90) return false;
        if (filters.scoreRange === '>= 75' && score < 75) return false;
        if (filters.scoreRange === '60-74' && (score < 60 || score > 74)) return false;
        if (filters.scoreRange === '< 60' && score >= 60) return false;
      }
      // Applied
      if (filters.applied !== 'All') {
        if (filters.applied === 'Applied' && !job.applied) return false;
        if (filters.applied === 'Not Applied' && job.applied) return false;
      }
      return true;
    });
  }, [data, filters]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <StatsBar jobs={data} />
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-zinc-200">
        <FilterBar filters={filters} setFilters={setFilters} />
        <JobsTable 
          data={filteredData} 
          loading={loading} 
          onApplyChange={handleApplyChange}
          onRunPipeline={handleRunPipeline}
        />
      </div>
    </div>
  );
}
