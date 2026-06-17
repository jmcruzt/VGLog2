'use client';
import { useEffect, useState } from 'react';
import Modal from '@/components/shared/Modal';
import { usePlatforms } from '@/hooks/usePlatforms';
import { useCreateGame, useUpdateGame } from '@/hooks/useGames';
import type { CreateGameDto, Game, GameStatus, UpdateGameDto } from '@/lib/types';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  game?: Game;
  defaultStatus?: GameStatus;
}

export default function GameModal({ isOpen, onClose, game, defaultStatus = 'pending' }: GameModalProps) {
  const isEditing = !!game;
  const { data: platforms = [] } = usePlatforms(isOpen);
  const createGame = useCreateGame();
  const updateGame = useUpdateGame();

  const [name, setName] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [isROGAllyX, setIsROGAllyX] = useState(false);
  const [isGamePass, setIsGamePass] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (game) {
      setName(game.name);
      setPlatformId(game.platformId);
      setIsROGAllyX(game.isROGAllyX);
      setIsGamePass(game.isGamePass);
      setEstimatedHours(game.estimatedHours?.toString() ?? '');
      setReleaseYear(game.releaseYear?.toString() ?? '');
      setReleaseDate(game.releaseDate ?? '');
    } else {
      setName('');
      setPlatformId((platforms.find(p => p.name === 'X1') ?? platforms[0])?.id ?? '');
      setIsROGAllyX(false);
      setIsGamePass(false);
      setEstimatedHours('');
      setReleaseYear('');
      setReleaseDate('');
    }
    setError(null);
  }, [game, platforms, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Game name is required.');
    if (!platformId) return setError('Platform is required.');
    if (defaultStatus !== 'upcoming' && !releaseYear) return setError('Release year is required.');
    try {
      if (isEditing) {
        const dto: UpdateGameDto = {
          name: name.trim(), platformId, isROGAllyX, isGamePass,
          estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
          releaseYear: releaseYear ? parseInt(releaseYear) : undefined,
          releaseDate: releaseDate || undefined,
        };
        await updateGame.mutateAsync({ id: game.id, dto });
      } else {
        const dto: CreateGameDto = {
          name: name.trim(), platformId, status: defaultStatus, isROGAllyX, isGamePass,
          estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
          releaseYear: releaseYear ? parseInt(releaseYear) : undefined,
          releaseDate: releaseDate || undefined,
        };
        await createGame.mutateAsync(dto);
      }
      onClose();
    } catch { setError('Failed to save. Please try again.'); }
  }

  const isPending = createGame.isPending || updateGame.isPending;
  const footer = (
    <>
      <button type="button" onClick={onClose}
        className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
        Cancel
      </button>
      <button type="submit" form="game-form" disabled={isPending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-600">
        {isPending ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Game'}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Game' : 'Add New Game'} footer={footer}>
      <form id="game-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{error}</p>}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Game Name <span className="text-red-500">*</span>
          </label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder="e.g. Elden Ring" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Platform <span className="text-red-500">*</span>
          </label>
          <select value={platformId} onChange={e => setPlatformId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
            {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Release Year {defaultStatus !== 'upcoming' && <span className="text-red-500">*</span>}
          </label>
          <input type="number" value={releaseYear} onChange={e => setReleaseYear(e.target.value)}
            min={1990} max={2040}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder="e.g. 2024" />
        </div>
        {(game?.status === 'upcoming' || defaultStatus === 'upcoming') && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Release Date <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Estimated Hours <span className="text-xs text-gray-400">(optional)</span>
          </label>
          <input type="number" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)}
            min={0} step={0.5}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder="e.g. 40" />
        </div>
        <div className="flex gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={isROGAllyX} onChange={e => setIsROGAllyX(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-indigo-600" />
            ROG Ally X
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={isGamePass} onChange={e => setIsGamePass(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-indigo-600" />
            Game Pass
          </label>
        </div>
      </form>
    </Modal>
  );
}
