import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { JobResult } from '../../lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Skeleton } from '../ui/skeleton';
import { ArrowUpDown } from 'lucide-react';
import ScoreBreakdownDialog from './ScoreBreakdownDialog';

interface JobsTableProps {
  data: JobResult[];
  loading: boolean;
  onApplyChange: (jobId: string, applied: boolean) => void;
  onRunPipeline: () => void;
}

export default function JobsTable({ data, loading, onApplyChange, onRunPipeline }: JobsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'score', desc: true },
  ]);
  const [selectedJob, setSelectedJob] = useState<JobResult | null>(null);

  const getProfileColor = (profile: string) => {
    switch (profile) {
      case 'software_engineer': return 'text-blue-700 border-blue-200 bg-blue-50';
      case 'frontend_developer': return 'text-purple-700 border-purple-200 bg-purple-50';
      case 'backend_developer': return 'text-green-700 border-green-200 bg-green-50';
      default: return 'text-gray-700 border-gray-200 bg-gray-50';
    }
  };

  const columns = [
    {
      accessorKey: 'score',
      header: ({ column }: any) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="px-0 font-medium text-xs uppercase text-zinc-500 hover:bg-transparent">
            Score
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }: any) => {
        const original = row.original as any;
        const score = original.score;
        let colorClass = "bg-zinc-100 text-zinc-600 border-zinc-200";
        if (score >= 85) colorClass = "bg-green-100 text-green-800 border-green-200";
        else if (score >= 75) colorClass = "bg-amber-100 text-amber-800 border-amber-200";
        else if (score >= 60) colorClass = "bg-orange-100 text-orange-800 border-orange-200";
        return <Badge className={`${colorClass} font-bold px-2 py-1`}>{score}</Badge>;
      },
    },
    {
      accessorKey: 'jobTitle',
      header: 'Title',
      cell: ({ row }: any) => {
        const original = row.original as any;
        return (
          <div className="max-w-[250px] md:max-w-[400px]">
            <a href={original.jobLink} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline truncate block">
              {original.jobTitle}
            </a>
            <p className="text-xs text-muted-foreground truncate">{original.company}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'profile',
      header: 'Profile',
      cell: ({ row }: any) => {
        const original = row.original as any;
        return (
        <Badge variant="outline" className={`${getProfileColor(original.profile)}`}>
          {original.profile.replace('_', ' ')}
        </Badge>
        );
      },
    },
    {
      accessorKey: 'source',
      header: () => <div className="hidden md:block">Source</div>,
      cell: ({ row }: any) => {
        const original = row.original as any;
        return <div className="hidden md:block capitalize">{original.source}</div>;
      },
    },
    {
      accessorKey: 'postedAt',
      header: ({ column }: any) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="px-0 font-medium text-xs uppercase text-zinc-500 hover:bg-transparent">
            Posted
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }: any) => {
        const original = row.original as any;
        const dateStr = original.postedAt;
        if (!dateStr) return null;
        try {
          const date = new Date(dateStr);
          return (
            <Tooltip>
              <TooltipTrigger className="text-sm">
                {formatDistanceToNow(date, { addSuffix: true })}
              </TooltipTrigger>
              <TooltipContent>{date.toISOString()}</TooltipContent>
            </Tooltip>
          );
        } catch {
          return null;
        }
      },
    },
    {
      accessorKey: 'easyApply',
      header: 'Easy Apply',
      cell: ({ row }: any) => {
        const original = row.original as any;
        return original.easyApply ? <Badge variant="secondary" className="bg-green-100 text-green-800">⚡ Easy Apply</Badge> : null;
      },
    },
    {
      id: 'breakdown',
      header: () => <div className="hidden md:block">Score Breakdown</div>,
      cell: ({ row }: any) => {
        const original = row.original as any;
        return (
        <div className="hidden md:block">
          <Button size="sm" variant="outline" onClick={() => setSelectedJob(original)}>Details</Button>
        </div>
        );
      },
    },
    {
      id: 'resume',
      header: 'Resume',
      cell: ({ row }: any) => {
        const original = row.original as any;
        const { resumeViewLink, resumeDownloadLink } = original;
        if (resumeViewLink) return <a href={resumeViewLink} target="_blank" rel="noreferrer"><Button size="sm" variant="link" type="button">View</Button></a>;
        if (resumeDownloadLink) return <a href={resumeDownloadLink} download><Button size="sm" variant="link" type="button">Download</Button></a>;
        return <span className="text-muted-foreground text-xs">Pending</span>;
      },
    },
    {
      accessorKey: 'applied',
      header: 'Applied',
      cell: ({ row }: any) => {
        const original = row.original as any;
        return (
        <Checkbox 
          checked={original.applied}
          onCheckedChange={(checked) => onApplyChange(original._id, !!checked)}
          className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
        />
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center border rounded-lg bg-white shadow-sm mt-4">
        <div className="h-20 w-20 bg-muted rounded-full mb-4 flex items-center justify-center">
          <span className="text-3xl">📭</span>
        </div>
        <h3 className="text-lg font-medium text-neutral-900 mb-2">No jobs found</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Run the pipeline to fetch jobs. Or change your filters if you are searching.
        </p>
        <Button onClick={onRunPipeline}>Run Pipeline</Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md border shadow-sm mt-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-medium uppercase text-zinc-500 px-4 py-3">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ({data.length} results)
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <ScoreBreakdownDialog 
        job={selectedJob} 
        open={!!selectedJob} 
        onOpenChange={(open) => !open && setSelectedJob(null)} 
      />
    </div>
  );
}
