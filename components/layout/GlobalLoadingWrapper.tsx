'use client';
import { type ReactNode } from 'react';
import LoadingOverlay from '@/components/shared/LoadingOverlay';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';

export default function GlobalLoadingWrapper({ children }: { children: ReactNode }) {
  const { isLoading } = useGlobalLoading();
  return (
    <>
      <LoadingOverlay isVisible={isLoading} />
      {children}
    </>
  );
}
