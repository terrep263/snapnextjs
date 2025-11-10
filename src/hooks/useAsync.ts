/**
 * useAsync Hook
 * Handles loading, error, and data states for async operations
 */
'use client';

import { useState, useCallback, useEffect } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true,
  options: UseAsyncOptions<T> = {}
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: options.initialData ?? null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: state.data, loading: true, error: null });
    try {
      const result = await asyncFunction();
      setState({ data: result, loading: false, error: null });
      options.onSuccess?.(result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({ data: state.data, loading: false, error: err });
      options.onError?.(err);
      throw err;
    }
  }, [asyncFunction, state.data, options]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute };
}
