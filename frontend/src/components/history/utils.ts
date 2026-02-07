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

const CURRENCY_LABELS: Record<string, string> = {
  copper: 'CP',
  silver: 'SP',
  gold: 'GP',
  platinum: 'PP',
}

export function formatCurrencyChanges(details: Record<string, unknown> | null): string | null {
  if (!details) return null
  const changes: string[] = []
  for (const [key, value] of Object.entries(details)) {
    const label = CURRENCY_LABELS[key]
    if (!label || typeof value !== 'number') continue
    const sign = value >= 0 ? '+' : ''
    changes.push(`${sign}${value} ${label}`)
  }
  return changes.length > 0 ? changes.join(', ') : null
}

export function formatFieldChanges(details: Record<string, unknown> | null): string | null {
  if (!details) return null
  const changes: string[] = []
  for (const [key, value] of Object.entries(details)) {
    if (
      value != null &&
      typeof value === 'object' &&
      'old' in (value as Record<string, unknown>) &&
      'new' in (value as Record<string, unknown>)
    ) {
      const change = value as { old: unknown; new: unknown }
      changes.push(`${key}: ${String(change.old)} → ${String(change.new)}`)
    }
  }
  return changes.length > 0 ? changes.join(', ') : null
}
