import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../ui/dialog';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { JobResult } from '../../lib/types';

interface ScoreBreakdownDialogProps {
  job: JobResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ScoreBreakdownDialog({ job, open, onOpenChange }: ScoreBreakdownDialogProps) {
  if (!job) return null;

  const { score, scoreBreakdown, jobTitle, company, source, jobLink } = job;
  
  const getBadgeColor = (score: number) => {
    if (score >= 85) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 75) return "bg-amber-100 text-amber-800 border-amber-200";
    if (score >= 60) return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-zinc-100 text-zinc-600 border-zinc-200";
  };

  const getProgressColor = (value: number, max: number) => {
    const ratio = value / max;
    if (ratio >= 0.7) return "bg-green-500";
    if (ratio >= 0.4) return "bg-amber-500";
    return "bg-red-500";
  };

  const factors = [
    { name: "Skill Match", value: scoreBreakdown?.skillMatch || 0, max: 35 },
    { name: "Title Relevance", value: scoreBreakdown?.titleRelevance || 0, max: 25 },
    { name: "Experience Alignment", value: scoreBreakdown?.experienceAlignment || 0, max: 20 },
    { name: "Recency", value: scoreBreakdown?.recency || 0, max: 10 },
    { name: "Description Quality", value: scoreBreakdown?.descriptionQuality || 0, max: 10 }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex justify-between items-start mb-2">
            <div>
              <DialogTitle className="text-xl">{jobTitle}</DialogTitle>
              <p className="text-muted-foreground">{company}</p>
              <Badge variant="outline" className="mt-2 text-xs">{source}</Badge>
            </div>
            <div className={`text-4xl font-bold flex items-center justify-center rounded-lg w-16 h-16 border ${getBadgeColor(score)}`}>
              {score}
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          {factors.map((factor) => {
            const percentage = (factor.value / factor.max) * 100;
            return (
              <div key={factor.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-neutral-700">{factor.name}</span>
                  <span className="text-neutral-500">{factor.value} / {factor.max}</span>
                </div>
                {/* To change progress color dynamically based on ratio, we can inject a custom class or style into the indicator. Shadcn Progress supports className on root, but indicator color requires custom css or inline style if exposed. Let's assume standard Progress or we wrap it in a div that passes color */}
                <Progress 
                  value={percentage} 
                  className="h-2"
                  indicatorClassName={getProgressColor(factor.value, factor.max)}
                />
              </div>
            );
          })}
        </div>
        
        <DialogFooter className="sm:justify-between">
          <DialogClose className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
            Close
          </DialogClose>
          <Button type="button" onClick={() => window.open(jobLink, '_blank')}>
            Open Job Posting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
