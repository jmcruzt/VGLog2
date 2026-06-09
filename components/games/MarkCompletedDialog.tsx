'use client';
import { useState } from 'react';
import Modal from '@/components/shared/Modal';
import { useMarkCompleted } from '@/hooks/useGames';
import type { Game } from '@/lib/types';

interface MarkCompletedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
}

export default function MarkCompletedDialog({ isOpen, onClose, game }: MarkCompletedDialogProps) {
  const markCompleted = useMarkCompleted();
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [completedHours, setCompletedHours] = useState(game.estimatedHours?.toString() ?? '');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!endDate) return setError('End date is required.');
    if (!completedHours || parseFloat(completedHours) <= 0) return setError('Completed hours must be greater than 0.');
    try {
      await markCompleted.mutateAsync({ id: game.id, dto: { endDate, completedHours: parseFloat(completedHours) } });
      onClose();
    } catch { setError('Failed to update game. Please try again.'); }
  }

  const footer = (
    <>
      <button type="button" onClick={onClose}
        className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
        Cancel
      </button>
      <button type="submit" form="mark-completed-form" disabled={markCompleted.isPending}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
        {markCompleted.isPending ? 'Saving…' : 'Mark as Completed'}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mark as Completed" footer={footer} size="sm">
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Completing: <strong className="text-gray-900 dark:text-gray-100">{game.name}</strong>
      </p>
      <form id="mark-completed-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{error}</p>}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            End Date <span className="text-red-500">*</span>
          </label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Hours to Complete <span className="text-red-500">*</span>
          </label>
          <input type="number" value={completedHours} onChange={e => setCompletedHours(e.target.value)}
            min={0.5} step={0.5}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder="e.g. 35" />
        </div>
      </form>
    </Modal>
  );
}
