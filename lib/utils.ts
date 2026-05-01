import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parsePostedDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const lower = dateStr.toLowerCase();
  if (lower.includes('today') || lower.includes('just now') || lower.includes('hours') || lower.includes('minutes')) return new Date();
  
  const daysMatch = lower.match(/(\d+)\s+day/i);
  if (daysMatch) {
    const date = new Date();
    date.setDate(date.getDate() - parseInt(daysMatch[1]));
    return date;
  }
  const weeksMatch = lower.match(/(\d+)\s+week/i);
  if (weeksMatch) {
    const date = new Date();
    date.setDate(date.getDate() - parseInt(weeksMatch[1]) * 7);
    return date;
  }
  const monthsMatch = lower.match(/(\d+)\s+month/i);
  if (monthsMatch) {
    const date = new Date();
    date.setMonth(date.getMonth() - parseInt(monthsMatch[1]));
    return date;
  }
  
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;
  
  return new Date();
}

export function escapeLaTeX(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\$/g, '\\$')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

