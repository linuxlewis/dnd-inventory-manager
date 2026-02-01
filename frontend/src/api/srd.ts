import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import type { SrdItem } from './types'

export function useSrdSearch(query: string) {
  return useQuery({
    queryKey: ['srd-search', query],
    queryFn: async () => {
      const response = await apiClient.get<SrdItem[]>(`/api/srd/search`, {
        params: { q: query },
      })
      return response.data
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}

export function useSrdItem(index: string | undefined) {
  return useQuery({
    queryKey: ['srd-item', index],
    queryFn: async () => {
      const response = await apiClient.get<SrdItem>(`/api/srd/items/${index}`)
      return response.data
    },
    enabled: !!index,
  })
}
