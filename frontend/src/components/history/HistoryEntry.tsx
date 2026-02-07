import { Sword, Pencil, Trash2, Coins } from 'lucide-react'
import type { HistoryEntry as HistoryEntryType } from '../../api/types'
import { formatRelativeTime, formatActionDescription, formatCurrencyChanges, formatFieldChanges, formatItemDetails } from './utils'

const ACTION_ICONS = {
  item_added: { icon: Sword, bg: 'bg-green-100', color: 'text-green-600' },
  item_updated: { icon: Pencil, bg: 'bg-blue-100', color: 'text-blue-600' },
  item_removed: { icon: Trash2, bg: 'bg-red-100', color: 'text-red-600' },
  currency_updated: { icon: Coins, bg: 'bg-amber-100', color: 'text-amber-600' },
} as const

interface HistoryEntryProps {
  entry: HistoryEntryType
}

export function HistoryEntry({ entry }: HistoryEntryProps) {
  const { icon: Icon, bg, color } = ACTION_ICONS[entry.action]

  // Determine detail text based on action type
  let detailText: string | null = null
  if (entry.action === 'currency_updated') {
    detailText = formatCurrencyChanges(entry.details)
  } else if (entry.action === 'item_updated') {
    detailText = formatFieldChanges(entry.details)
  } else if (entry.action === 'item_added' || entry.action === 'item_removed') {
    detailText = formatItemDetails(entry.details)
  }

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {formatActionDescription(entry.action, entry.entity_name)}
        </p>
        {detailText && (
          <p className="text-xs text-gray-500 mt-0.5">{detailText}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          {formatRelativeTime(entry.created_at)}
        </p>
      </div>
    </div>
  )
}
