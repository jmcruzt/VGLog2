'use client';
import { useEffect, useState } from 'react';
import Modal from '@/components/shared/Modal';

interface PlayingNowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  gameName: string;
  onConfirm: (startDate: string) => void;
  isLoading?: boolean;
}

export default function PlayingNowDialog({ isOpen, onClose, gameName, onConfirm, isLoading = false }: PlayingNowDialogProps) {
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    if (isOpen) setStartDate(new Date().toISOString().slice(0, 10));
  }, [isOpen]);

  const footer = (
    <>
      <button type="button" onClick={onClose} disabled={isLoading}
        className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700">
        Cancel
      </button>
      <button type="button" onClick={() => startDate && onConfirm(startDate)} disabled={!startDate || isLoading}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
        {isLoading ? 'Saving…' : '▶ Start Playing'}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mark as Playing Now" footer={footer} size="sm">
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        When did you start playing{' '}
        <strong className="text-gray-900 dark:text-gray-100">{gameName}</strong>?
      </p>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Start Date <span className="text-red-500">*</span>
      </label>
      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
        max={new Date().toISOString().slice(0, 10)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" />
    </Modal>
  );
}
