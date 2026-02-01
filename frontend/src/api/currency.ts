import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

export interface CurrencyUpdate {
  copper?: number
  silver?: number
  gold?: number
  platinum?: number
  note?: string
}

export interface CurrencyTotals {
  copper: number
  silver: number
  gold: number
  platinum: number
}

export interface CurrencyConversion {
  from: 'copper' | 'silver' | 'gold' | 'platinum'
  to: 'copper' | 'silver' | 'gold' | 'platinum'
  amount: number
}

export function useUpdateCurrency(slug: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CurrencyUpdate): Promise<CurrencyTotals> => {
      const response = await apiClient.post<CurrencyTotals>(
        `/api/inventories/${slug}/currency`,
        data
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', slug] })
      queryClient.invalidateQueries({ queryKey: ['history', slug] })
    },
  })
}

export function useConvertCurrency(slug: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CurrencyConversion): Promise<CurrencyTotals> => {
      const response = await apiClient.post<CurrencyTotals>(
        `/api/inventories/${slug}/currency/convert`,
        data
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', slug] })
      queryClient.invalidateQueries({ queryKey: ['history', slug] })
    },
  })
}

// Currency conversion rates (in copper pieces)
export const CURRENCY_VALUES = {
  copper: 1,
  silver: 10,
  gold: 100,
  platinum: 1000,
} as const

export function calculateTotalInGold(currency: CurrencyTotals): number {
  const totalCopper =
    currency.copper * CURRENCY_VALUES.copper +
    currency.silver * CURRENCY_VALUES.silver +
    currency.gold * CURRENCY_VALUES.gold +
    currency.platinum * CURRENCY_VALUES.platinum
  return totalCopper / CURRENCY_VALUES.gold
}

export function getConversionRate(
  from: keyof typeof CURRENCY_VALUES,
  to: keyof typeof CURRENCY_VALUES
): number {
  return CURRENCY_VALUES[from] / CURRENCY_VALUES[to]
}
