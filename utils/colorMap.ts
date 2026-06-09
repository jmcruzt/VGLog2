const PLATFORM_COLOR_MAP: Record<string, string> = {
  'Xbox Series X': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'Xbox One': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  'PC': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'PS5': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  'PS3': 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  'Xbox 360': 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300',
  'ROG Ally X': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'X1': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
};

const FALLBACK_PLATFORM_COLORS = [
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300',
];

export function getPlatformColor(platformName: string): string {
  if (PLATFORM_COLOR_MAP[platformName]) return PLATFORM_COLOR_MAP[platformName];
  let hash = 0;
  for (let i = 0; i < platformName.length; i++) {
    hash = (hash * 31 + platformName.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_PLATFORM_COLORS[hash % FALLBACK_PLATFORM_COLORS.length];
}

const YEAR_COLORS = [
  'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300',
];

export function getYearColor(year: number): string {
  return YEAR_COLORS[year % YEAR_COLORS.length];
}

export const BADGE_CLASSES = 'inline-block rounded px-1.5 py-0.5 text-xs font-medium';
