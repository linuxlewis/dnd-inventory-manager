import type { HistoryAction } from '../../api/types'

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const ACTION_VERBS: Record<HistoryAction, string> = {
  item_added: 'Added',
  item_updated: 'Updated',
  item_removed: 'Removed',
  currency_updated: 'Treasury updated',
}

export function formatActionDescription(action: HistoryAction, entityName: string | null): string {
  const verb = ACTION_VERBS[action]
  if (action === 'currency_updated') return verb
  return entityName ? `${verb} ${entityName}` : verb
}
