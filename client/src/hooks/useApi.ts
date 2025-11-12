import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function useApi<T>() {
  const [state, setState] = useState<ApiResponse<T>>({
    data: null,
    error: null,
    loading: false,
  });

  const request = useCallback(async (url: string, options: RequestInit = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error(errorMessage);
      setState({
        data: null,
        error: errorMessage,
        loading: false,
      });
      throw error;
    }
  }, []);

  return { ...state, request };
}
