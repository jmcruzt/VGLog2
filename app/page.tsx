'use client';
import { useState } from 'react';
import { useGames } from '@/hooks/useGames';
import { usePlatforms } from '@/hooks/usePlatforms';
import { usePendingSummary } from '@/hooks/useDashboards';
import { useExportExcel } from '@/hooks/useExportExcel';
import PendingGamesTable from '@/components/games/PendingGamesTable';
import GameModal from '@/components/games/GameModal';
import DashboardCard from '@/components/shared/DashboardCard';
import { BADGE_CLASSES, getPlatformColor, getYearColor } from '@/utils/colorMap';
import type { GroupCount } from '@/lib/types';

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-semibold text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
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

export default function HomePage() {
  const [platformFilter, setPlatformFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [hoursPerDayInput, setHoursPerDayInput] = useState('2');

  const { data: platforms = [] } = usePlatforms();
  const { exportToExcel } = useExportExcel();
  const isFiltered = !!platformFilter || !!yearFilter;

  const { data: games = [], isLoading: gamesLoading } = useGames({
    status: 'pending',
    platform: platformFilter || undefined,
    year: yearFilter ? parseInt(yearFilter) : undefined,
  });

  const { data: pendingSummary, isLoading: pendingLoading } = usePendingSummary();

  function handleExport() {
    const rows = games.map(g => ({
      '#': g.order, 'ROG Ally X': g.isROGAllyX ? 'Yes' : 'No', 'Game Pass': g.isGamePass ? 'Yes' : 'No',
      'Name': g.name, 'Platform': g.platformName, 'Est. Hours': g.estimatedHours ?? '',
      'Release Year': g.releaseYear ?? '', 'Playing Now': g.isPlayingNow ? 'Yes' : 'No',
      'Start Date': g.startDate ? new Date(g.startDate).toLocaleDateString() : '',
    }));
    exportToExcel(rows, 'pending-games');
  }

  const uniqueYears = [...new Set(games.map(g => g.releaseYear).filter(Boolean))].sort((a, b) => (b ?? 0) - (a ?? 0));

  const hoursPerDay = Math.max(0.5, parseFloat(hoursPerDayInput) || 2);
  const approxDays = pendingSummary ? Math.ceil(pendingSummary.totalHours / hoursPerDay) : 0;
  const approxEndDate = new Date(Date.now() + approxDays * 24 * 60 * 60 * 1000).toLocaleDateString();

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button onClick={() => setAddModalOpen(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
            + Add New Game
          </button>
          <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
            <option value="">All Platforms</option>
            {platforms.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
            <option value="">All Years</option>
            {uniqueYears.map(y => <option key={y} value={y?.toString()}>{y}</option>)}
          </select>
          {isFiltered && (
            <button onClick={() => { setPlatformFilter(''); setYearFilter(''); }}
              className="text-sm text-gray-400 underline hover:text-gray-700 dark:hover:text-gray-200">
              Clear filters
            </button>
          )}
          <div className="ml-auto">
            <button onClick={handleExport} disabled={games.length === 0}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800">
              Export Excel
            </button>
          </div>
        </div>
        {isFiltered && <p className="mb-2 text-xs text-amber-600 dark:text-amber-400">Drag-to-reorder is disabled while filters are active.</p>}
        {gamesLoading
          ? <div className="py-12 text-center text-sm text-gray-400">Loading…</div>
          : <PendingGamesTable games={games} isFiltered={isFiltered} />}
      </div>

      <aside className="w-72 shrink-0 space-y-4">
        <DashboardCard title="Hours Summary" isLoading={pendingLoading}>
          {pendingSummary && (
            <>
              <StatRow label="Total pending hours" value={`${pendingSummary.totalHours}h`} />
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="text-gray-600 dark:text-gray-400">Hours/day</span>
                <input
                  type="number"
                  value={hoursPerDayInput}
                  onChange={e => setHoursPerDayInput(e.target.value)}
                  min={0.5}
                  step={0.5}
                  className="w-16 rounded border border-gray-300 px-2 py-0.5 text-right text-sm font-semibold text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <StatRow label="Approx days" value={`${approxDays} days`} />
              <StatRow label="Est. end date" value={approxEndDate} />
            </>
          )}
        </DashboardCard>
        <DashboardCard title="Pending by Platform" isLoading={pendingLoading}>
          {pendingSummary && <GroupList items={pendingSummary.byPlatform} type="platform" />}
        </DashboardCard>
        <DashboardCard title="Pending by Release Year" isLoading={pendingLoading}>
          {pendingSummary && <GroupList items={pendingSummary.byYear} type="year" />}
        </DashboardCard>
        <DashboardCard title="Completed by Year" isLoading={pendingLoading}>
          {pendingSummary && <GroupList items={pendingSummary.completedByYear} type="year" />}
        </DashboardCard>
      </aside>

      <GameModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} defaultStatus="pending" />
    </div>
  );
}
