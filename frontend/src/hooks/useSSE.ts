import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import type {
  SSEConnectionStatus,
  SSEItemEvent,
  InventorySSEEvent,
} from '../api/sse-types'
import type { InventoryResponse } from '../api/types'

const MIN_RETRY_DELAY = 1000 // 1 second
const MAX_RETRY_DELAY = 30000 // 30 seconds
const BACKOFF_MULTIPLIER = 2

export interface SSEState {
  status: SSEConnectionStatus
  viewerCount: number
  lastEvent: InventorySSEEvent | null
}

export interface SSEOptions {
  onItemAdded?: (item: SSEItemEvent) => void
  onItemUpdated?: (item: SSEItemEvent) => void
  onItemRemoved?: (id: string) => void
  onCurrencyUpdated?: (currency: { copper: number; silver: number; gold: number; platinum: number }) => void
  onViewerCountChanged?: (count: number) => void
  enabled?: boolean
}

export function useSSE(slug: string | undefined, options: SSEOptions = {}) {
  const { enabled = true } = options
  const queryClient = useQueryClient()
  const getPassphrase = useAuthStore((state) => state.getPassphrase)

  const [state, setState] = useState<SSEState>({
    status: 'disconnected',
    viewerCount: 0,
    lastEvent: null,
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const retryDelayRef = useRef(MIN_RETRY_DELAY)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  // Store options in ref to avoid stale closures
  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  })

  // Update items in TanStack Query cache
  const updateItemsCache = useCallback(
    (
      updater: (
        items: SSEItemEvent[] | undefined
      ) => SSEItemEvent[] | undefined
    ) => {
      if (!slug) return
      queryClient.setQueryData<SSEItemEvent[]>(['items', slug], updater)
    },
    [queryClient, slug]
  )

  // Update inventory cache (for currency)
  const updateInventoryCache = useCallback(
    (
      updater: (
        inventory: InventoryResponse | undefined
      ) => InventoryResponse | undefined
    ) => {
      if (!slug) return
      queryClient.setQueryData<InventoryResponse>(['inventory', slug], updater)
    },
    [queryClient, slug]
  )

  // Handle SSE events
  const handleEvent = useCallback(
    (event: InventorySSEEvent) => {
      if (!mountedRef.current) return

      setState((prev) => ({ ...prev, lastEvent: event }))

      switch (event.event) {
        case 'item_added': {
          const item = event.data
          updateItemsCache((items) => {
            if (!items) return [item]
            // Avoid duplicates
            if (items.some((i) => i.id === item.id)) return items
            return [...items, item]
          })
          optionsRef.current.onItemAdded?.(item)
          break
        }

        case 'item_updated': {
          const item = event.data
          updateItemsCache((items) => {
            if (!items) return items
            return items.map((i) => (i.id === item.id ? item : i))
          })
          optionsRef.current.onItemUpdated?.(item)
          break
        }

        case 'item_removed': {
          const { id } = event.data
          updateItemsCache((items) => {
            if (!items) return items
            return items.filter((i) => i.id !== id)
          })
          optionsRef.current.onItemRemoved?.(id)
          break
        }

        case 'currency_updated': {
          const currency = event.data
          updateInventoryCache((inventory) => {
            if (!inventory) return inventory
            return { ...inventory, ...currency }
          })
          optionsRef.current.onCurrencyUpdated?.(currency)
          break
        }

        case 'connection_count': {
          const { count } = event.data
          setState((prev) => ({ ...prev, viewerCount: count }))
          optionsRef.current.onViewerCountChanged?.(count)
          break
        }

        case 'connected':
          // Initial connection event, reset retry delay
          retryDelayRef.current = MIN_RETRY_DELAY
          break
      }
    },
    [updateItemsCache, updateInventoryCache]
  )

  // Disconnect from SSE
  const disconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setState((prev) => ({ ...prev, status: 'disconnected', viewerCount: 0 }))
  }, [])

  // Connection setup effect
  useEffect(() => {
    mountedRef.current = true

    const connectSSE = () => {
      if (!slug || !enabled) return

      const passphrase = getPassphrase(slug)
      if (!passphrase) {
        setState((prev) => ({ ...prev, status: 'disconnected' }))
        return
      }

      // Clean up existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      setState((prev) => ({ ...prev, status: 'connecting' }))

      // Note: EventSource doesn't support custom headers, so we pass auth via query param
      // The backend should support both X-Passphrase header and ?passphrase query param
      const url = `/api/inventories/${slug}/events?passphrase=${encodeURIComponent(passphrase)}`
      const eventSource = new EventSource(url)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        if (!mountedRef.current) return
        setState((prev) => ({ ...prev, status: 'connected' }))
        retryDelayRef.current = MIN_RETRY_DELAY
      }

      eventSource.onmessage = (messageEvent) => {
        if (!mountedRef.current) return
        try {
          const event = JSON.parse(messageEvent.data) as InventorySSEEvent
          handleEvent(event)
        } catch (error) {
          console.error('Failed to parse SSE event:', error)
        }
      }

      eventSource.onerror = () => {
        if (!mountedRef.current) return

        eventSource.close()
        eventSourceRef.current = null
        setState((prev) => ({ ...prev, status: 'disconnected' }))

        // Exponential backoff retry
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current)
        }

        retryTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            connectSSE()
          }
        }, retryDelayRef.current)

        // Increase retry delay with exponential backoff
        retryDelayRef.current = Math.min(
          retryDelayRef.current * BACKOFF_MULTIPLIER,
          MAX_RETRY_DELAY
        )
      }
    }

    connectSSE()

    return () => {
      mountedRef.current = false
      disconnect()
    }
  }, [slug, enabled, getPassphrase, handleEvent, disconnect])

  // Manual reconnect function
  const reconnect = useCallback(() => {
    disconnect()
    retryDelayRef.current = MIN_RETRY_DELAY
    // Force re-run of the effect
    setState((prev) => ({ ...prev, status: 'connecting' }))
  }, [disconnect])

  return {
    ...state,
    reconnect,
    disconnect,
    isConnected: state.status === 'connected',
    isConnecting: state.status === 'connecting',
  }
}
