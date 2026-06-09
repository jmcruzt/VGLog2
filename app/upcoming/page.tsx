'use client';
import { useMemo, useState } from 'react';
import { useGames, useDeleteGame } from '@/hooks/useGames';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useUpcomingSummary } from '@/hooks/useDashboards';
import { useExportExcel } from '@/hooks/useExportExcel';
import GameModal from '@/components/games/GameModal';
import PromoteToPendingDialog from '@/components/games/PromoteToPendingDialog';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import DashboardCard from '@/components/shared/DashboardCard';
import { BADGE_CLASSES, getPlatformColor } from '@/utils/colorMap';
import type { Game, GroupCount } from '@/lib/types';

function GroupList({ items }: { items: GroupCount[] }) {
  if (items.length === 0) return <p className="text-sm text-gray-400 dark:text-gray-600">No data.</p>;
  return (
    <ul className="space-y-1">
      {items.map(item => (
        <li key={item.label} className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{item.count}</span>
        </li>
      ))}
    </ul>
  );
}

type SortField = 'name' | 'platformName';
type SortDir = 'asc' | 'desc';

export default function UpcomingPage() {
  const [platformFilter, setPlatformFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [promotingGame, setPromotingGame] = useState<Game | null>(null);
  const [playNowGame, setPlayNowGame] = useState<Game | null>(null);
  const [deletingGame, setDeletingGame] = useState<Game | null>(null);

  const { data: platforms = [] } = usePlatforms();
  const { exportToExcel } = useExportExcel();
  const { data: games = [], isLoading } = useGames({ status: 'upcoming' });
  const { data: summary, isLoading: summaryLoading } = useUpcomingSummary();
  const deleteGame = useDeleteGame();

  const displayed = useMemo(() => {
    let result = games;
    if (platformFilter) result = result.filter(g => g.platformName === platformFilter);
    return [...result].sort((a, b) => {
      const aVal = sortField === 'name' ? a.name : a.platformName;
      const bVal = sortField === 'name' ? b.name : b.platformName;
      const cmp = aVal.localeCompare(bVal);
      return sortDir === 'asc' ? cmp : -cmp;
    });
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
    const rows = displayed.map(g => ({ Name: g.name, Platform: g.platformName }));
    exportToExcel(rows, 'upcoming-games');
  }

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button onClick={() => setAddModalOpen(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
            + Add Upcoming Game
          </button>
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
                  {(['Name', 'Platform', ''] as const).map((h, i) => {
                    const field: SortField | undefined = h === 'Name' ? 'name' : h === 'Platform' ? 'platformName' : undefined;
                    return (
                      <th key={i} onClick={field ? () => toggleSort(field) : undefined}
                        className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ${field ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200' : ''}`}>
                        {h}{field && <SortIndicator field={field} />}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {displayed.map(game => (
                  <tr key={game.id} onDoubleClick={() => setEditingGame(game)}
                    className="group cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                    title="Double-click to edit">
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-gray-100">{game.name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`${BADGE_CLASSES} ${getPlatformColor(game.platformName)}`}>{game.platformName}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={e => { e.stopPropagation(); setPlayNowGame(game); }}
                          title="Promote to Pending and start playing"
                          className="rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50">
                          ▶ Play Now
                        </button>
                        <button onClick={e => { e.stopPropagation(); setPromotingGame(game); }}
                          title="Move to Pending list"
                          className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50">
                          Promote →
                        </button>
                        <button onClick={e => { e.stopPropagation(); setDeletingGame(game); }}
                          title="Delete game"
                          className="rounded p-1 text-xs text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400">
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {displayed.length === 0 && (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-400 dark:text-gray-600">No upcoming games found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <aside className="w-72 shrink-0 space-y-4">
        <DashboardCard title="Upcoming by Platform" isLoading={summaryLoading}>
          {summary && <GroupList items={summary.byPlatform} />}
        </DashboardCard>
      </aside>

      <GameModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} defaultStatus="upcoming" />
      {editingGame && <GameModal isOpen onClose={() => setEditingGame(null)} game={editingGame} />}
      {promotingGame && <PromoteToPendingDialog isOpen onClose={() => setPromotingGame(null)} game={promotingGame} />}
      {playNowGame && <PromoteToPendingDialog isOpen onClose={() => setPlayNowGame(null)} game={playNowGame} defaultPlayingNow />}
      {deletingGame && (
        <ConfirmDialog isOpen onClose={() => setDeletingGame(null)}
          onConfirm={() => deleteGame.mutate(deletingGame.id, { onSuccess: () => setDeletingGame(null) })}
          title="Delete Game" message={`Are you sure you want to delete "${deletingGame.name}"? This cannot be undone.`}
          confirmLabel="Delete" isLoading={deleteGame.isPending} />
      )}
    </div>
  );
}
