import useSWR, { SWRConfiguration } from 'swr';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types';

const fetcher = async (path: string) => {
  const res = await apiClient.get<any>(path);
  return res.json();
};

export function useApi<Data = any, Error = any>(
  path: string | null,
  config?: SWRConfiguration<Data, Error>
) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Data, Error>(
    path,
    (path: string) => fetcher(path),
    config
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

export function usePaginatedApi<Data = any, Error = any>(
  path: string | null,
  page: number = 1,
  limit: number = 20,
  extraParams?: Record<string, string>,
  config?: SWRConfiguration<PaginatedResponse<Data>, Error>
) {
  const queryParts: string[] = [`page=${page}`, `limit=${limit}`];
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) queryParts.push(`${key}=${encodeURIComponent(value)}`);
    }
  }

  const separator = path?.includes('?') ? '&' : '?';
  const fullPath = path ? `${path}${separator}${queryParts.join('&')}` : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<PaginatedResponse<Data>, Error>(
    fullPath,
    (p: string) => fetcher(p) as Promise<PaginatedResponse<Data>>,
    config
  );

  return {
    data: data?.data ?? [],
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}
