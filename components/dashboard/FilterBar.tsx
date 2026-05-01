import React from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search } from 'lucide-react';

export interface FilterState {
  search: string;
  profile: string;
  source: string;
  scoreRange: string;
  applied: string;
}

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

export const defaultFilters: FilterState = {
  search: '',
  profile: 'All Profiles',
  source: 'All Sources',
  scoreRange: 'All Scores',
  applied: 'All',
};

export default function FilterBar({ filters, setFilters }: FilterBarProps) {
  const isFiltered = 
    filters.search !== '' ||
    filters.profile !== 'All Profiles' ||
    filters.source !== 'All Sources' ||
    filters.scoreRange !== 'All Scores' ||
    filters.applied !== 'All';

  const resetFilters = () => setFilters(defaultFilters);

  return (
    <div className="flex flex-col md:flex-row gap-3 mb-6 items-center flex-wrap">
      <div className="relative flex-1 min-w-[200px] w-full">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title or company..."
          className="pl-9"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      <Select value={filters.profile} onValueChange={(v) => setFilters({ ...filters, profile: v || '' })}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Profile" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All Profiles">All Profiles</SelectItem>
          <SelectItem value="software_engineer">software_engineer</SelectItem>
          <SelectItem value="frontend_developer">frontend_developer</SelectItem>
          <SelectItem value="backend_developer">backend_developer</SelectItem>
          <SelectItem value="general_developer">general_developer</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.source} onValueChange={(v) => setFilters({ ...filters, source: v || '' })}>
        <SelectTrigger className="w-full md:w-[160px]">
          <SelectValue placeholder="Source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All Sources">All Sources</SelectItem>
          <SelectItem value="LinkedIn">LinkedIn</SelectItem>
          <SelectItem value="Naukri">Naukri</SelectItem>
          <SelectItem value="Indeed">Indeed</SelectItem>
          <SelectItem value="Wellfound">Wellfound</SelectItem>
          <SelectItem value="Greenhouse">Greenhouse</SelectItem>
          <SelectItem value="Lever">Lever</SelectItem>
          <SelectItem value="Ashby">Ashby</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.scoreRange} onValueChange={(v) => setFilters({ ...filters, scoreRange: (v || '') as any })}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Score" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All Scores">All Scores</SelectItem>
          <SelectItem value=">= 90">≥ 90 (Excellent)</SelectItem>
          <SelectItem value=">= 75">≥ 75 (Qualified)</SelectItem>
          <SelectItem value="60-74">60–74 (Borderline)</SelectItem>
          <SelectItem value="< 60">&lt; 60 (Weak)</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.applied} onValueChange={(v) => setFilters({ ...filters, applied: v || '' })}>
        <SelectTrigger className="w-full md:w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Status</SelectItem>
          <SelectItem value="Applied">Applied</SelectItem>
          <SelectItem value="Not Applied">Not Applied</SelectItem>
        </SelectContent>
      </Select>

      {isFiltered && (
        <Button variant="ghost" onClick={resetFilters} className="w-full md:w-auto">
          Reset Filters
        </Button>
      )}
    </div>
  );
}
