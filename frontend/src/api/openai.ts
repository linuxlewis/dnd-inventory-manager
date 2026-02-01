import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { OpenAIStatus, OpenAIConnectRequest, OpenAITestResponse } from './types'

export function useOpenAIStatus(slug: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['openai-status', slug],
    queryFn: async () => {
      const response = await apiClient.get<OpenAIStatus>(`/api/inventories/${slug}/openai/status`)
      return response.data
    },
    enabled: !!slug && enabled,
    retry: false,
  })
}

export function useTestOpenAIKey() {
  return useMutation({
    mutationFn: async ({ slug, apiKey }: { slug: string; apiKey: string }): Promise<OpenAITestResponse> => {
      const response = await apiClient.post<OpenAITestResponse>(
        `/api/inventories/${slug}/openai/test`,
        { api_key: apiKey }
      )
      return response.data
    },
  })
}

export function useConnectOpenAI() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ slug, apiKey }: { slug: string; apiKey: string }): Promise<void> => {
      const data: OpenAIConnectRequest = { api_key: apiKey }
      await apiClient.post(`/api/inventories/${slug}/openai/connect`, data)
    },
    onSuccess: (_, { slug }) => {
      queryClient.invalidateQueries({ queryKey: ['openai-status', slug] })
    },
  })
}

export function useDisconnectOpenAI() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (slug: string): Promise<void> => {
      await apiClient.delete(`/api/inventories/${slug}/openai`)
    },
    onSuccess: (_, slug) => {
      queryClient.invalidateQueries({ queryKey: ['openai-status', slug] })
    },
  })
}
