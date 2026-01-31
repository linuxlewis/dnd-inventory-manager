import { useMutation } from '@tanstack/react-query'
import { apiClient } from './client'
import type { InventoryCreate, InventoryResponse, InventoryAuth, AuthResponse } from './types'

export function useCreateInventory() {
  return useMutation({
    mutationFn: async (data: InventoryCreate): Promise<InventoryResponse> => {
      const response = await apiClient.post<InventoryResponse>('/api/inventories', data)
      return response.data
    },
  })
}

export function useAuthenticateInventory() {
  return useMutation({
    mutationFn: async ({ slug, passphrase }: { slug: string; passphrase: string }): Promise<AuthResponse> => {
      const data: InventoryAuth = { passphrase }
      const response = await apiClient.post<AuthResponse>(`/api/inventories/${slug}/auth`, data)
      return response.data
    },
  })
}
