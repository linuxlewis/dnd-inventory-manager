import { useCallback, useRef } from 'react'
import { useSSE, type SSEOptions } from './useSSE'
import {
  showItemAddedToast,
  showItemUpdatedToast,
  showItemRemovedToast,
  showCurrencyUpdatedToast,
} from '../stores/toastStore'
import type { SSEItemEvent } from '../api/sse-types'

interface UseInventorySSEOptions {
  enabled?: boolean
  showNotifications?: boolean
}

/**
 * Hook that combines SSE connection with toast notifications
 * for inventory changes made by other users.
 */
export function useInventorySSE(
  slug: string | undefined,
  options: UseInventorySSEOptions = {}
) {
  const { enabled = true, showNotifications = true } = options

  // Track items we know about to provide names for removed items
  const itemsRef = useRef<Map<string, SSEItemEvent>>(new Map())

  const handleItemAdded = useCallback(
    (item: SSEItemEvent) => {
      itemsRef.current.set(item.id, item)
      if (showNotifications) {
        showItemAddedToast(item.name, item.quantity)
      }
    },
    [showNotifications]
  )

  const handleItemUpdated = useCallback(
    (item: SSEItemEvent) => {
      itemsRef.current.set(item.id, item)
      if (showNotifications) {
        showItemUpdatedToast(item.name)
      }
    },
    [showNotifications]
  )

  const handleItemRemoved = useCallback(
    (id: string) => {
      const item = itemsRef.current.get(id)
      itemsRef.current.delete(id)
      if (showNotifications) {
        showItemRemovedToast(item?.name ?? 'Unknown item')
      }
    },
    [showNotifications]
  )

  const handleCurrencyUpdated = useCallback(() => {
    if (showNotifications) {
      showCurrencyUpdatedToast()
    }
  }, [showNotifications])

  const sseOptions: SSEOptions = {
    enabled,
    onItemAdded: handleItemAdded,
    onItemUpdated: handleItemUpdated,
    onItemRemoved: handleItemRemoved,
    onCurrencyUpdated: handleCurrencyUpdated,
  }

  return useSSE(slug, sseOptions)
}
