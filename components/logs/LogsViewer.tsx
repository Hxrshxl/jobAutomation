import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function LogsViewer() {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLogs = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        // Assuming API returns { logs: "string of logs" } or { lines: ["line1", "line2"] }
        if (data.lines) {
          setLogs(data.lines.join('\n'));
        } else if (data.logs) {
          setLogs(data.logs);
        } else {
          setLogs('No logs found or invalid log format.');
        }
        setLastUpdated(new Date());
      } else if (res.status === 404) {
        setLogs('Log viewer will be available once the pipeline has run at least once.');
      } else {
        throw new Error('Failed to fetch logs');
      }
    } catch (e: any) {
      if (!isBackground) toast.error('Error fetching logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => fetchLogs(true), 30000); // 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const renderLogLines = () => {
    if (!logs) return null;
    const lines = logs.split('\n');
    return lines.map((line, idx) => {
      let colorClass = "text-zinc-500"; // default
      if (line.includes("ERROR")) colorClass = "text-red-400";
      else if (line.includes("WARN")) colorClass = "text-yellow-400";
      else if (line.includes("INFO")) colorClass = "text-zinc-300";

      return (
        <div key={idx} className={`${colorClass} whitespace-pre-wrap break-words font-mono text-sm leading-relaxed`}>
          {line}
        </div>
      );
    });
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-120px)]">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div className="text-sm text-muted-foreground">
          {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Not updated yet'}
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-neutral-100" : ""}
          >
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button 
            size="sm" 
            onClick={() => fetchLogs()}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Now
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-lg bg-zinc-900 border border-zinc-800 p-4 custom-scrollbar">
        {loading && !logs ? (
          <div className="flex justify-center items-center h-full text-zinc-500">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : logs === 'Log viewer will be available once the pipeline has run at least once.' ? (
          <div className="flex justify-center items-center h-full text-zinc-500">
            {logs}
          </div>
        ) : (
          renderLogLines()
        )}
      </div>
    </div>
  );
}
