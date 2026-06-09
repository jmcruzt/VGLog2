import type { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
}

export default function DashboardCard({ title, children, isLoading }: DashboardCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {title}
      </h3>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
              style={{ width: `${60 + i * 10}%` }} />
          ))}
        </div>
      ) : children}
    </div>
  );
}
