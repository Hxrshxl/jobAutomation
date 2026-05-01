import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Briefcase, CheckCircle, Send, Star } from 'lucide-react';
import { JobResult } from '../../lib/types';

interface StatsBarProps {
  jobs: JobResult[];
}

export default function StatsBar({ jobs }: StatsBarProps) {
  const totalJobs = jobs.length;
  const qualifiedJobs = jobs.filter((j) => j.score >= 75).length;
  const appliedJobs = jobs.filter((j) => j.applied === true).length;
  const topScore = jobs.length > 0 ? Math.max(...jobs.map((j) => j.score)) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="shadow-sm">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Jobs in database</p>
            <p className="text-3xl font-bold text-neutral-900">{totalJobs}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Score ≥ 75</p>
            <p className="text-3xl font-bold text-neutral-900">{qualifiedJobs}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Applied so far</p>
            <p className="text-3xl font-bold text-neutral-900">{appliedJobs}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center">
            <Send className="h-6 w-6 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Best match score</p>
            <p className="text-3xl font-bold text-neutral-900">{topScore}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
            <Star className="h-6 w-6 text-amber-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
