import React from 'react';

export default function JobTable({ jobs }: { jobs: any[] }) {
  if (!jobs || jobs.length === 0) return <div>No jobs found.</div>;
  
  return (
    <div style={{ overflowX: 'auto', marginTop: '20px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th style={{ padding: '8px' }}>Title</th>
            <th style={{ padding: '8px' }}>Company</th>
            <th style={{ padding: '8px' }}>Profile</th>
            <th style={{ padding: '8px' }}>Score</th>
            <th style={{ padding: '8px' }}>Applied</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <tr key={job._id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>
                <a href={job.jobLink} target="_blank" rel="noreferrer" style={{ color: 'blue' }}>
                  {job.jobTitle}
                </a>
              </td>
              <td style={{ padding: '8px' }}>{job.company}</td>
              <td style={{ padding: '8px' }}>{job.profile}</td>
              <td style={{ padding: '8px' }}>{job.score}</td>
              <td style={{ padding: '8px' }}>{job.applied ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
