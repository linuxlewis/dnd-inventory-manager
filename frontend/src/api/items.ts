import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Item, ThumbnailGenerateResponse } from './types'

export function useGenerateThumbnail() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ slug, itemId }: { slug: string; itemId: string }): Promise<ThumbnailGenerateResponse> => {
      const response = await apiClient.post<ThumbnailGenerateResponse>(
        `/api/inventories/${slug}/items/${itemId}/thumbnail`
      )
      return response.data
    },
    onSuccess: (_, { slug }) => {
      // Invalidate items query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['items', slug] })
    },
  })
}

// Hook to update an item optimistically when thumbnail is generated
export function useOptimisticThumbnailUpdate() {
  const queryClient = useQueryClient()
  
  return {
    setGenerating: (slug: string, itemId: string) => {
      queryClient.setQueryData<Item[]>(['items', slug], (old) => 
        old?.map(item => 
          item.id === itemId 
            ? { ...item, thumbnail_generating: true } 
            : item
        )
      )
    },
    setThumbnailUrl: (slug: string, itemId: string, thumbnailUrl: string) => {
      queryClient.setQueryData<Item[]>(['items', slug], (old) => 
        old?.map(item => 
          item.id === itemId 
            ? { ...item, thumbnail_url: thumbnailUrl, thumbnail_generating: false } 
            : item
        )
      )
    },
  }
}
