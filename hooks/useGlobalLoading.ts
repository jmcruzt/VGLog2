'use client';
import { useEffect, useRef, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

export function useGlobalLoading(): { isLoading: boolean } {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = isFetching + isMutating > 0;

  useEffect(() => {
    if (active) {
      setIsLoading(true);
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    } else {
      timerRef.current = setTimeout(() => setIsLoading(false), 150);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active]);

  return { isLoading };
}
