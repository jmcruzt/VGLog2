interface LoadingOverlayProps { isVisible: boolean; }

export default function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
  return (
    <div
      aria-hidden={!isVisible}
      className={['fixed inset-0 z-50 flex items-center justify-center bg-black/30 transition-opacity duration-150',
        isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'].join(' ')}
    >
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-500 dark:border-gray-700 dark:border-t-indigo-400"
        role="status" aria-label="Loading" />
    </div>
  );
}
