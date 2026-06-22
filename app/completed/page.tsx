'use client';
import { useMemo, useState } from 'react';
import { useGames } from '@/hooks/useGames';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useCompletedSummary } from '@/hooks/useDashboards';
import { useExportExcel } from '@/hooks/useExportExcel';
import DashboardCard from '@/components/shared/DashboardCard';
import { BADGE_CLASSES, getPlatformColor, getYearColor } from '@/utils/colorMap';
import type { Game, GroupCount } from '@/lib/types';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function daysToComplete(game: Game): string {
  if (game.daysToComplete != null) return `${game.daysToComplete}d`;
  if (!game.startDate || !game.endDate) return '—';
  const diff = new Date(game.endDate.slice(0, 10)).getTime() - new Date(game.startDate.slice(0, 10)).getTime();
  return `${Math.floor(diff / (1000 * 60 * 60 * 24))}d`;
}

function GroupList({ items, type = 'plain' }: { items: GroupCount[]; type?: 'platform' | 'year' | 'plain' }) {
  if (items.length === 0) return <p className="text-sm text-gray-400 dark:text-gray-600">No data.</p>;
  return (
    <ul className="space-y-1">
      {items.map(item => (
        <li key={item.label} className="flex items-center justify-between text-sm">
          {type === 'platform' ? (
            <span className={`${BADGE_CLASSES} ${getPlatformColor(item.label)}`}>{item.label}</span>
          ) : type === 'year' ? (
            <span className={`${BADGE_CLASSES} ${getYearColor(parseInt(item.label))}`}>{item.label}</span>
          ) : (
            <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
          )}
          <span className="font-semibold text-gray-900 dark:text-gray-100">{item.count}</span>
        </li>
      ))}
    </ul>
  );
}

type SortField = 'platformName' | 'endDate';
type SortDir = 'asc' | 'desc';

export default function CompletedPage() {
  const [platformFilter, setPlatformFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('endDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { data: platforms = [] } = usePlatforms();
  const { exportToExcel } = useExportExcel();
  const { data: games = [], isLoading } = useGames({ status: 'completed' });
  const { data: summary, isLoading: summaryLoading } = useCompletedSummary();

  const displayed = useMemo(() => {
    let result = games;
    if (platformFilter) result = result.filter(g => g.platformName === platformFilter);
    result = [...result].sort((a, b) => {
      const aVal = sortField === 'endDate' ? (a.endDate ?? '') : a.platformName;
      const bVal = sortField === 'endDate' ? (b.endDate ?? '') : b.platformName;
      const cmp = aVal.localeCompare(bVal);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [games, platformFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  }

  function SortIndicator({ field }: { field: SortField }) {
    if (sortField !== field) return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>;
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  function handleExport() {
    const rows = displayed.map(g => ({
      Name: g.name, Platform: g.platformName,
      'Est. / Completed Hours': `${g.estimatedHours ?? '?'} / ${g.completedHours ?? '?'}`,
      'Release Year': g.releaseYear ?? '', 'Start Date': formatDate(g.startDate),
      'Completed Date': formatDate(g.endDate), 'Days to Complete': daysToComplete(g),
    }));
    exportToExcel(rows, 'completed-games');
  }

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
            <option value="">All Platforms</option>
            {platforms.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          {platformFilter && (
            <button onClick={() => setPlatformFilter('')}
              className="text-sm text-gray-400 underline hover:text-gray-700 dark:hover:text-gray-200">
              Clear filter
            </button>
          )}
          <div className="ml-auto">
            <button onClick={handleExport} disabled={displayed.length === 0}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800">
              Export Excel
            </button>
          </div>
        </div>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-gray-400">Loading…</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                  {(['Name', 'Platform', 'Hours', 'Year', 'Start Date', 'Completed Date', 'Days'] as const).map(h => {
                    const field: SortField | undefined = h === 'Platform' ? 'platformName' : h === 'Completed Date' ? 'endDate' : undefined;
                    return (
                      <th key={h} onClick={field ? () => toggleSort(field) : undefined}
                        className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ${field ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200' : ''}`}>
                        {h}{field && <SortIndicator field={field} />}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {displayed.map(game => (
                  <tr key={game.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100">{game.name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`${BADGE_CLASSES} ${getPlatformColor(game.platformName)}`}>{game.platformName}</span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">
                      {game.estimatedHours ?? '?'}h / {game.completedHours ?? '?'}h
                    </td>
                    <td className="px-4 py-2.5">
                      {game.releaseYear != null
                        ? <span className={`${BADGE_CLASSES} ${getYearColor(game.releaseYear)}`}>{game.releaseYear}</span>
                        : <span className="text-sm text-gray-400 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">{formatDate(game.startDate)}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">{formatDate(game.endDate)}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">{daysToComplete(game)}</td>
                  </tr>
                ))}
                {displayed.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400 dark:text-gray-600">No completed games found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <aside className="w-full space-y-4 md:w-72 md:shrink-0">
        <DashboardCard title="Overview" isLoading={summaryLoading}>
          {summary && (
            <>
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total completed</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{summary.totalCompleted}</span>
              </div>
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-600 dark:text-gray-400">Years active</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{summary.yearSpan}</span>
              </div>
            </>
          )}
        </DashboardCard>
        <DashboardCard title="Completed by Platform" isLoading={summaryLoading}>
          {summary && <GroupList items={summary.byPlatform} type="platform" />}
        </DashboardCard>
        <DashboardCard title="Completed by Year" isLoading={summaryLoading}>
          {summary && <GroupList items={summary.byYear} type="year" />}
        </DashboardCard>
      </aside>
    </div>
  );
}
