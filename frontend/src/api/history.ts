import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import type { HistoryAction, HistoryEntityType, HistoryResponse } from './types'

export interface HistoryParams {
  limit?: number
  offset?: number
  action?: HistoryAction
  entityType?: HistoryEntityType
}

export async function fetchHistory(
  slug: string,
  params?: HistoryParams
): Promise<HistoryResponse> {
  const response = await apiClient.get<HistoryResponse>(
    `/api/v1/inventories/${slug}/history`,
    {
      params: {
        limit: params?.limit,
        offset: params?.offset,
        action: params?.action,
        entity_type: params?.entityType,
      },
    }
  )
  return response.data
}

export function useHistory(slug: string | undefined, params?: HistoryParams) {
  return useQuery({
    queryKey: ['history', slug, params],
    queryFn: () => fetchHistory(slug!, params),
    enabled: !!slug,
  })
}
