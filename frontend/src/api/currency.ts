import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Currency, CurrencyUpdateRequest, CurrencyConvertRequest } from './types'

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currency', slug] })
      queryClient.invalidateQueries({ queryKey: ['inventory', slug] })
    },
  })
}

export function useConvertCurrency(slug: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CurrencyConvertRequest): Promise<Currency> => {
      const response = await apiClient.post<Currency>(
        `/api/inventories/${slug}/currency/convert`,
        data
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currency', slug] })
      queryClient.invalidateQueries({ queryKey: ['inventory', slug] })
    },
  })
}
