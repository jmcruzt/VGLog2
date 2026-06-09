'use client';
import { useState } from 'react';
import { usePlatforms, useCreatePlatform, useDeletePlatform, useUpdatePlatform } from '@/hooks/usePlatforms';
import Modal from '@/components/shared/Modal';
import type { Platform } from '@/lib/types';

interface PlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform?: Platform;
}

function PlatformModal({ isOpen, onClose, platform }: PlatformModalProps) {
  const isEditing = !!platform;
  const createPlatform = useCreatePlatform();
  const updatePlatform = useUpdatePlatform();
  const [name, setName] = useState(platform?.name ?? '');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Platform name is required.');
    try {
      if (isEditing) {
        await updatePlatform.mutateAsync({ id: platform.id, dto: { name: name.trim() } });
      } else {
        await createPlatform.mutateAsync({ name: name.trim() });
      }
      onClose();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) setError(`A platform named "${name}" already exists.`);
      else setError('Failed to save platform. Please try again.');
    }
  }

  const isPending = createPlatform.isPending || updatePlatform.isPending;
  const footer = (
    <>
      <button type="button" onClick={onClose}
        className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
        Cancel
      </button>
      <button type="submit" form="platform-form" disabled={isPending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500">
        {isPending ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Platform'}
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Platform' : 'Add Platform'} footer={footer} size="sm">
      <form id="platform-form" onSubmit={handleSubmit}>
        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{error}</p>}
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Platform Name <span className="text-red-500">*</span>
        </label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} autoFocus
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          placeholder="e.g. Xbox Series X" />
      </form>
    </Modal>
  );
}

export default function PlatformsPage() {
  const { data: platforms = [], isLoading } = usePlatforms();
  const deletePlatform = useDeletePlatform();
  const [addOpen, setAddOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(platform: Platform) {
    setDeleteError(null);
    setDeletingId(platform.id);
    try {
      await deletePlatform.mutateAsync(platform.id);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) setDeleteError(`"${platform.name}" is assigned to one or more games and cannot be deleted.`);
      else setDeleteError('Failed to delete platform. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Platforms</h1>
        <button onClick={() => setAddOpen(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500">
          + Add Platform
        </button>
      </div>
      {deleteError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
          {deleteError}
          <button onClick={() => setDeleteError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading…</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
              {platforms.map(platform => (
                <tr key={platform.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{platform.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditingPlatform(platform)}
                        className="rounded px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(platform)} disabled={deletingId === platform.id}
                        className="rounded px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-900/20">
                        {deletingId === platform.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {platforms.length === 0 && (
                <tr><td colSpan={2} className="px-6 py-8 text-center text-sm text-gray-400 dark:text-gray-600">No platforms yet. Add one to get started.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <PlatformModal isOpen={addOpen} onClose={() => setAddOpen(false)} />
      {editingPlatform && <PlatformModal isOpen={!!editingPlatform} onClose={() => setEditingPlatform(null)} platform={editingPlatform} />}
    </div>
  );
}
