import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

export type HistoryAction =
  | 'item_added'
  | 'item_removed'
  | 'item_updated'
  | 'quantity_changed'
  | 'currency_changed'
  | 'rollback'
  | 'undo'

export interface HistoryEntry {
  id: string
  inventory_id: string
  action: HistoryAction
  item_id: string | null
  item_name: string | null
  item_snapshot: Record<string, unknown> | null
  previous_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  note: string | null
  timestamp: string
  is_undone: boolean
  undone_by: string | null
}

export interface HistoryListParams {
  action?: HistoryAction
  item_id?: string
  limit?: number
  offset?: number
  search?: string
}

export interface HistoryListResponse {
  entries: HistoryEntry[]
  total: number
  limit: number
  offset: number
}

export function useHistory(slug: string, params: HistoryListParams = {}) {
  return useQuery({
    queryKey: ['history', slug, params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params.action) searchParams.set('action', params.action)
      if (params.item_id) searchParams.set('item_id', params.item_id)
      if (params.limit) searchParams.set('limit', params.limit.toString())
      if (params.offset) searchParams.set('offset', params.offset.toString())
      if (params.search) searchParams.set('search', params.search)

      const queryString = searchParams.toString()
      const url = `/api/inventories/${slug}/history${queryString ? `?${queryString}` : ''}`
      const response = await apiClient.get<HistoryListResponse>(url)
      return response.data
    },
    enabled: !!slug,
  })
}

export interface UndoResponse {
  success: boolean
  message?: string
}

export function useUndoAction(slug: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entryId: string): Promise<UndoResponse> => {
      const response = await apiClient.post<UndoResponse>(
        `/api/inventories/${slug}/history/${entryId}/undo`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', slug] })
      queryClient.invalidateQueries({ queryKey: ['history', slug] })
    },
  })
}

// Helper to format relative timestamps
export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
  if (diffWeek < 4) return `${diffWeek} week${diffWeek === 1 ? '' : 's'} ago`
  if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`

  return date.toLocaleDateString()
}

// Get icon name for action type
export function getActionIcon(action: HistoryAction): string {
  switch (action) {
    case 'item_added':
      return 'plus'
    case 'item_removed':
      return 'minus'
    case 'item_updated':
      return 'edit'
    case 'quantity_changed':
      return 'hash'
    case 'currency_changed':
      return 'coins'
    case 'rollback':
      return 'rotate-ccw'
    case 'undo':
      return 'undo-2'
    default:
      return 'circle'
  }
}

// Get description for history entry
export function getActionDescription(entry: HistoryEntry): string {
  switch (entry.action) {
    case 'item_added':
      return `Added ${entry.item_name || 'item'}`
    case 'item_removed':
      return `Removed ${entry.item_name || 'item'}`
    case 'item_updated':
      return `Updated ${entry.item_name || 'item'}`
    case 'quantity_changed': {
      const prev = entry.previous_value?.quantity as number | undefined
      const next = entry.new_value?.quantity as number | undefined
      if (prev !== undefined && next !== undefined) {
        const delta = next - prev
        return `${entry.item_name || 'Item'} quantity ${delta > 0 ? '+' : ''}${delta}`
      }
      return `Changed quantity of ${entry.item_name || 'item'}`
    }
    case 'currency_changed':
      return formatCurrencyDelta(entry)
    case 'rollback':
      return 'Rolled back changes'
    case 'undo':
      return 'Undid previous action'
    default:
      return 'Unknown action'
  }
}

function formatCurrencyDelta(entry: HistoryEntry): string {
  const prev = entry.previous_value as Record<string, number> | null
  const next = entry.new_value as Record<string, number> | null

  if (!prev || !next) return 'Currency changed'

  const deltas: string[] = []
  const currencies = ['platinum', 'gold', 'silver', 'copper'] as const
  const abbrev = { platinum: 'PP', gold: 'GP', silver: 'SP', copper: 'CP' }

  for (const curr of currencies) {
    const delta = (next[curr] ?? 0) - (prev[curr] ?? 0)
    if (delta !== 0) {
      deltas.push(`${delta > 0 ? '+' : ''}${delta} ${abbrev[curr]}`)
    }
  }

  return deltas.length > 0 ? deltas.join(', ') : 'Currency unchanged'
}
