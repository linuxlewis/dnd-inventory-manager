import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Currency, CurrencyUpdateRequest } from './types'

export function useCurrency(slug: string | undefined) {
  return useQuery({
    queryKey: ['currency', slug],
    queryFn: async (): Promise<Currency> => {
      const response = await apiClient.get<Currency>(`/api/inventories/${slug}/currency`)
      return response.data
    },
    enabled: !!slug,
  })
}

export function useUpdateCurrency(slug: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CurrencyUpdateRequest): Promise<Currency> => {
      const response = await apiClient.post<Currency>(
        `/api/inventories/${slug}/currency`,
        data
      )
      return response.data
    },
    onSuccess: (data) => {
      // Update cache directly with response - no refetch needed
      queryClient.setQueryData(['currency', slug], data)
      // Also update the inventory cache's currency fields
      queryClient.setQueryData(['inventory', slug], (old: Record<string, unknown> | undefined) => {
        if (!old) return old
        return {
          ...old,
          copper: data.copper,
          silver: data.silver,
          gold: data.gold,
          platinum: data.platinum,
        }
      })
      // Invalidate history queries to show the new activity
      queryClient.invalidateQueries({ queryKey: ['history', slug] })
      queryClient.invalidateQueries({ queryKey: ['history-panel', slug] })
    },
  })
}
