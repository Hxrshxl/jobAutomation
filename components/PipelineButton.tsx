'use client';

import React, { useState } from 'react';

export default function PipelineButton({ onComplete }: { onComplete?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const runPipeline = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: {
          'x-api-key': 'my-super-secret-key'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setResult('Success: ' + data.results.length + ' profiles processed.');
        if (onComplete) onComplete();
      } else {
        setResult('Error: ' + data.error);
      }
    } catch (err: any) {
      setResult('Failed to run: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '20px', marginBottom: '20px' }}>
      <button 
        onClick={runPipeline} 
        disabled={loading}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px' }}
      >
        {loading ? 'Running...' : 'Run Pipeline'}
      </button>
      {result && <span style={{ marginLeft: '15px' }}>{result}</span>}
    </div>
  );
}
