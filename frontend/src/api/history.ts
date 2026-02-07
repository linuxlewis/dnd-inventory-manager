import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import type { HistoryEntry } from './types'

interface HistoryResponse {
  entries: HistoryEntry[]
  total: number
  limit: number
  offset: number
}

export function useHistory(slug: string | undefined, limit = 20) {
  return useQuery({
    queryKey: ['history', slug, limit],
    queryFn: async () => {
      const response = await apiClient.get<HistoryResponse>(
        `/api/inventories/${slug}/history`,
        { params: { limit } }
      )
      return response.data
    },
    enabled: !!slug,
  })
}

export function useHistoryPanel(slug: string | undefined) {
  return useQuery({
    queryKey: ['history-panel', slug],
    queryFn: async () => {
      const response = await apiClient.get<HistoryResponse>(
        `/api/inventories/${slug}/history`,
        { params: { limit: 10 } }
      )
      return response.data
    },
    enabled: !!slug,
  })
}
