'use client';
import { useEffect, useState } from 'react';
import Modal from '@/components/shared/Modal';
import { usePlatforms } from '@/hooks/usePlatforms';
import { usePromoteToPending } from '@/hooks/useGames';
import type { Game } from '@/lib/types';

interface PromoteToPendingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
  defaultPlayingNow?: boolean;
}

export default function PromoteToPendingDialog({ isOpen, onClose, game, defaultPlayingNow = false }: PromoteToPendingDialogProps) {
  const { data: platforms = [] } = usePlatforms(isOpen);
  const promoteToPending = usePromoteToPending();

  const [platformId, setPlatformId] = useState('');
  const [isGamePass, setIsGamePass] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [isPlayingNow, setIsPlayingNow] = useState(defaultPlayingNow);
  const [startDate, setStartDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPlatformId(game.platformId || (platforms.find(p => p.name === 'X1') ?? platforms[0])?.id || '');
      setReleaseYear(game.releaseYear != null ? String(game.releaseYear) : '');
      setEstimatedHours(game.estimatedHours != null ? String(game.estimatedHours) : '');
      setIsGamePass(game.isGamePass ?? false);
      setIsPlayingNow(defaultPlayingNow);
      setStartDate(new Date().toISOString().slice(0, 10));
      setError(null);
    }
  }, [game, platforms, isOpen, defaultPlayingNow]);

  useEffect(() => {
    if (!platformId && platforms.length > 0) setPlatformId(platforms[0].id);
  }, [platforms, platformId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!platformId) return setError('Platform is required.');
    if (!releaseYear) return setError('Release year is required.');
    if (isPlayingNow && !startDate) return setError('Start date is required when marking as Playing Now.');
    try {
      await promoteToPending.mutateAsync({
        id: game.id,
        dto: {
          platformId, isGamePass,
          estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
          releaseYear: parseInt(releaseYear),
          isPlayingNow,
          startDate: isPlayingNow ? startDate : undefined,
        },
      });
      onClose();
    } catch { setError('Failed to promote game. Please try again.'); }
  }

  const footer = (
    <>
      <button type="button" onClick={onClose}
        className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
        Cancel
      </button>
      <button type="submit" form="promote-form" disabled={promoteToPending.isPending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500">
        {promoteToPending.isPending ? 'Promoting…' : isPlayingNow ? '▶ Move & Play' : 'Move to Pending'}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Promote to Pending" footer={footer}>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Moving to pending: <strong className="text-gray-900 dark:text-gray-100">{game.name}</strong>
      </p>
      <form id="promote-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{error}</p>}
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
            Release Year <span className="text-red-500">*</span>
          </label>
          <input type="number" value={releaseYear} onChange={e => setReleaseYear(e.target.value)}
            min={1990} max={2040}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder="e.g. 2024" />
        </div>
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
            <input type="checkbox" checked={isGamePass} onChange={e => setIsGamePass(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-indigo-600" />
            Game Pass
          </label>
        </div>
        <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={isPlayingNow} onChange={e => setIsPlayingNow(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-green-600" />
            <span className="text-green-700 dark:text-green-400">▶ Start playing immediately</span>
          </label>
          {isPlayingNow && (
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
