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
  copper: 'cp',
  silver: 'sp',
  gold: 'gp',
  platinum: 'pp',
}

// Conversion rates to copper pieces
const CURRENCY_TO_COPPER: Record<string, number> = {
  copper: 1,
  silver: 10,
  gold: 100,
  platinum: 1000,
}

interface CurrencyChange {
  old: number
  new: number
}

/**
 * Format currency changes showing individual denominations and net GP value
 */
export function formatCurrencyChanges(details: Record<string, unknown> | null): string | null {
  if (!details) return null

  // Handle the {changes: {...}} structure from the backend
  const changes = (details.changes as Record<string, unknown>) ?? details

  const deltas: string[] = []
  let netCopper = 0

  for (const [key, value] of Object.entries(changes)) {
    const label = CURRENCY_LABELS[key]
    if (!label) continue

    // Handle {old, new} format from backend
    if (value != null && typeof value === 'object' && 'old' in value && 'new' in value) {
      const change = value as CurrencyChange
      const delta = change.new - change.old
      if (delta !== 0) {
        const sign = delta > 0 ? '+' : ''
        deltas.push(`${sign}${delta} ${label}`)
        netCopper += delta * (CURRENCY_TO_COPPER[key] ?? 0)
      }
    }
    // Handle direct number format (legacy/simple format)
    else if (typeof value === 'number' && value !== 0) {
      const sign = value > 0 ? '+' : ''
      deltas.push(`${sign}${value} ${label}`)
      netCopper += value * (CURRENCY_TO_COPPER[key] ?? 0)
    }
  }

  if (deltas.length === 0) return null

  // Calculate net in GP for the summary
  const netGp = netCopper / 100
  const netSign = netGp >= 0 ? '+' : ''
  const netFormatted = Math.abs(netGp) >= 0.01
    ? `${netSign}${netGp.toFixed(netGp % 1 === 0 ? 0 : 2)} gp`
    : null

  // If only one denomination changed, just show that
  if (deltas.length === 1) {
    return deltas[0]
  }

  // Show individual changes with net GP equivalent
  const changesText = deltas.join(', ')
  return netFormatted ? `${changesText} (Net: ${netFormatted})` : changesText
}

/**
 * Format item field changes (for updates)
 */
export function formatFieldChanges(details: Record<string, unknown> | null): string | null {
  if (!details) return null

  // Handle the {changes: {...}} structure from the backend
  const changes = (details.changes as Record<string, unknown>) ?? details

  const formatted: string[] = []

  for (const [key, value] of Object.entries(changes)) {
    if (
      value != null &&
      typeof value === 'object' &&
      'old' in value &&
      'new' in value
    ) {
      const change = value as { old: unknown; new: unknown }
      const fieldLabel = formatFieldLabel(key)
      const oldVal = formatFieldValue(key, change.old)
      const newVal = formatFieldValue(key, change.new)
      formatted.push(`${fieldLabel}: ${oldVal} → ${newVal}`)
    }
  }

  return formatted.length > 0 ? formatted.join(', ') : null
}

/**
 * Format item details for added/removed items
 */
export function formatItemDetails(details: Record<string, unknown> | null): string | null {
  if (!details) return null

  const parts: string[] = []

  // Quantity
  const quantity = details.quantity as number | undefined
  if (quantity != null && quantity > 1) {
    parts.push(`×${quantity}`)
  }

  // Weight
  const weight = details.weight as number | undefined
  if (weight != null) {
    parts.push(`${weight} lb`)
  }

  // Value
  const value = details.estimated_value as number | undefined
  if (value != null) {
    parts.push(`${value} gp`)
  }

  // Rarity (if uncommon or higher)
  const rarity = details.rarity as string | undefined
  if (rarity && rarity !== 'common') {
    parts.push(formatRarity(rarity))
  }

  return parts.length > 0 ? parts.join(' · ') : null
}

/**
 * Format a field key into a readable label
 */
function formatFieldLabel(key: string): string {
  const labels: Record<string, string> = {
    quantity: 'Qty',
    weight: 'Weight',
    estimated_value: 'Value',
    rarity: 'Rarity',
    type: 'Type',
    name: 'Name',
    description: 'Description',
    notes: 'Notes',
    category: 'Category',
  }
  return labels[key] ?? key.replace(/_/g, ' ')
}

/**
 * Format a field value for display
 */
function formatFieldValue(key: string, value: unknown): string {
  if (value == null) return '—'

  if (key === 'weight') {
    return `${value} lb`
  }
  if (key === 'estimated_value') {
    return `${value} gp`
  }
  if (key === 'rarity') {
    return formatRarity(String(value))
  }

  return String(value)
}

/**
 * Format rarity string for display
 */
function formatRarity(rarity: string): string {
  return rarity.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
