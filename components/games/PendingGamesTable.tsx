'use client';
import { useState } from 'react';
import {
  DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Game } from '@/lib/types';
import { useDeleteGame, useReorderGames, useTogglePlayingNow } from '@/hooks/useGames';
import { BADGE_CLASSES, getPlatformColor, getYearColor } from '@/utils/colorMap';
import MarkCompletedDialog from './MarkCompletedDialog';
import GameModal from './GameModal';
import PlayingNowDialog from './PlayingNowDialog';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

function DragHandle() {
  return (
    <svg className="h-4 w-4 cursor-grab text-gray-300 active:cursor-grabbing dark:text-gray-600" viewBox="0 0 20 20" fill="currentColor">
      <circle cx="7" cy="6" r="1.5" /><circle cx="13" cy="6" r="1.5" />
      <circle cx="7" cy="10" r="1.5" /><circle cx="13" cy="10" r="1.5" />
      <circle cx="7" cy="14" r="1.5" /><circle cx="13" cy="14" r="1.5" />
    </svg>
  );
}

interface SortableRowProps {
  game: Game;
  isDragEnabled: boolean;
  onEdit: (game: Game) => void;
  onMarkCompleted: (game: Game) => void;
  onPlayingNow: (game: Game) => void;
  onDelete: (game: Game) => void;
}

function SortableRow({ game, isDragEnabled, onEdit, onMarkCompleted, onPlayingNow, onDelete }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: game.id,
    disabled: !isDragEnabled || game.isPlayingNow,
  });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const isPlaying = game.isPlayingNow;

  function formatStartDate(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  }

  return (
    <tr ref={setNodeRef} style={style} onDoubleClick={() => onEdit(game)}
      className={['group cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50',
        isPlaying ? 'border-l-4 border-l-green-500 bg-green-50 dark:border-l-green-400 dark:bg-green-900/20' : ''].join(' ')}
      title="Double-click to edit">
      <td className="w-8 px-2 py-2.5">
        {isDragEnabled && !isPlaying && <span {...attributes} {...listeners}><DragHandle /></span>}
      </td>
      <td className="w-10 px-3 py-2.5 text-right text-xs text-gray-400 dark:text-gray-600">{game.order}</td>
      <td className="w-10 px-3 py-2.5 text-center text-xs">
        {game.isROGAllyX && <span title="Installed on ROG Ally X" className="inline-block rounded bg-orange-100 px-1.5 py-0.5 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">ROG</span>}
      </td>
      <td className="w-10 px-3 py-2.5 text-center text-xs">
        {game.isGamePass && <span title="Available on Game Pass" className="inline-block rounded bg-green-100 px-1.5 py-0.5 text-green-700 dark:bg-green-900/40 dark:text-green-300">GP</span>}
      </td>
      <td className="px-3 py-2.5">
        <span className={`text-sm font-medium ${isPlaying ? 'text-green-800 dark:text-green-300' : 'text-gray-900 dark:text-gray-100'}`}>
          {game.name}
          {isPlaying && game.startDate && <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-400">— {formatStartDate(game.startDate)}</span>}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <span className={`${BADGE_CLASSES} ${getPlatformColor(game.platformName)}`}>{game.platformName}</span>
      </td>
      <td className="px-3 py-2.5 text-right text-sm text-gray-500 dark:text-gray-400">
        {game.estimatedHours != null ? `${game.estimatedHours}h` : '—'}
      </td>
      <td className="px-3 py-2.5">
        {game.releaseYear != null
          ? <span className={`${BADGE_CLASSES} ${getYearColor(game.releaseYear)}`}>{game.releaseYear}</span>
          : <span className="text-sm text-gray-400 dark:text-gray-600">—</span>}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={e => { e.stopPropagation(); onPlayingNow(game); }}
            title={isPlaying ? 'Stop playing' : 'Mark as Playing Now'}
            className={`rounded p-1 text-xs transition-colors ${isPlaying ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300' : 'text-gray-400 hover:bg-gray-100 hover:text-green-600 dark:hover:bg-gray-700'}`}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={e => { e.stopPropagation(); onMarkCompleted(game); }} title="Mark as Completed"
            className="rounded p-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-400">✓</button>
          <button onClick={e => { e.stopPropagation(); onDelete(game); }} title="Delete game"
            className="rounded p-1 text-xs text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400">✕</button>
        </div>
      </td>
    </tr>
  );
}

interface PendingGamesTableProps { games: Game[]; isFiltered: boolean; }

export default function PendingGamesTable({ games, isFiltered }: PendingGamesTableProps) {
  const togglePlayingNow = useTogglePlayingNow();
  const reorderGames = useReorderGames();
  const deleteGame = useDeleteGame();

  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [completingGame, setCompletingGame] = useState<Game | null>(null);
  const [playingNowGame, setPlayingNowGame] = useState<Game | null>(null);
  const [deletingGame, setDeletingGame] = useState<Game | null>(null);

  const pinned = games.filter(g => g.isPlayingNow);
  const sortable = games.filter(g => !g.isPlayingNow);
  const isDragEnabled = !isFiltered;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortable.findIndex(g => g.id === active.id);
    const newIndex = sortable.findIndex(g => g.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(sortable, oldIndex, newIndex);
    reorderGames.mutate(reordered.map(g => g.id));
  }

  function handlePlayingNowClick(game: Game) {
    if (game.isPlayingNow) {
      togglePlayingNow.mutate({ id: game.id });
    } else {
      setPlayingNowGame(game);
    }
  }

  function handlePlayingNowConfirm(startDate: string) {
    if (!playingNowGame) return;
    togglePlayingNow.mutate({ id: playingNowGame.id, startDate }, { onSuccess: () => setPlayingNowGame(null) });
  }

  const columnHeaders = ['', '#', 'ROG', 'GP', 'Name', 'Platform', 'Est. Hours', 'Year', ''];

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
              {columnHeaders.map((h, i) => (
                <th key={i} className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
            {pinned.map(game => (
              <SortableRow key={game.id} game={game} isDragEnabled={false}
                onEdit={setEditingGame} onMarkCompleted={setCompletingGame}
                onPlayingNow={handlePlayingNowClick} onDelete={setDeletingGame} />
            ))}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortable.map(g => g.id)} strategy={verticalListSortingStrategy}>
                {sortable.map(game => (
                  <SortableRow key={game.id} game={game} isDragEnabled={isDragEnabled}
                    onEdit={setEditingGame} onMarkCompleted={setCompletingGame}
                    onPlayingNow={handlePlayingNowClick} onDelete={setDeletingGame} />
                ))}
              </SortableContext>
            </DndContext>
            {games.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-400 dark:text-gray-600">
                  No pending games found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingGame && <GameModal isOpen onClose={() => setEditingGame(null)} game={editingGame} />}
      {completingGame && <MarkCompletedDialog isOpen onClose={() => setCompletingGame(null)} game={completingGame} />}
      {playingNowGame && (
        <PlayingNowDialog isOpen onClose={() => setPlayingNowGame(null)}
          gameName={playingNowGame.name} onConfirm={handlePlayingNowConfirm}
          isLoading={togglePlayingNow.isPending} />
      )}
      {deletingGame && (
        <ConfirmDialog isOpen onClose={() => setDeletingGame(null)}
          onConfirm={() => deleteGame.mutate(deletingGame.id, { onSuccess: () => setDeletingGame(null) })}
          title="Delete Game" message={`Are you sure you want to delete "${deletingGame.name}"? This cannot be undone.`}
          confirmLabel="Delete" isLoading={deleteGame.isPending} />
      )}
    </>
  );
}
