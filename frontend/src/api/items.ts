import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Item, ItemCreate, ItemUpdate } from './types'

export interface ItemFilters {
  type?: string
  search?: string
}

export function useItems(slug: string | undefined, filters?: ItemFilters) {
  return useQuery({
    queryKey: ['items', slug, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.type && filters.type !== 'all') {
        params.append('type', filters.type)
      }
      if (filters?.search) {
        params.append('search', filters.search)
      }
      const queryString = params.toString()
      const url = `/api/inventories/${slug}/items${queryString ? `?${queryString}` : ''}`
      const response = await apiClient.get<Item[]>(url)
      return response.data
    },
    enabled: !!slug,
  })
}

export function useItem(slug: string | undefined, itemId: string | undefined) {
  return useQuery({
    queryKey: ['item', slug, itemId],
    queryFn: async () => {
      const response = await apiClient.get<Item>(`/api/inventories/${slug}/items/${itemId}`)
      return response.data
    },
    enabled: !!slug && !!itemId,
  })
}

export function useCreateItem(slug: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ItemCreate): Promise<Item> => {
      const response = await apiClient.post<Item>(`/api/inventories/${slug}/items`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', slug] })
    },
  })
}

export function useUpdateItem(slug: string | undefined, itemId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ItemUpdate): Promise<Item> => {
      const response = await apiClient.patch<Item>(`/api/inventories/${slug}/items/${itemId}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', slug] })
      queryClient.invalidateQueries({ queryKey: ['item', slug, itemId] })
    },
  })
}

export function useDeleteItem(slug: string | undefined, itemId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await apiClient.delete(`/api/inventories/${slug}/items/${itemId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', slug] })
    },
  })
}
