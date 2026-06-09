'use client';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', isDangerous = true, isLoading = false,
}: ConfirmDialogProps) {
  const footer = (
    <>
      <button type="button" onClick={onClose} disabled={isLoading}
        className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700">
        Cancel
      </button>
      <button type="button" onClick={onConfirm} disabled={isLoading}
        className={['rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60',
          isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500'].join(' ')}>
        {isLoading ? 'Processing…' : confirmLabel}
      </button>
    </>
  );
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer} size="sm">
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </Modal>
  );
}
