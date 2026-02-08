import { Sword, FlaskConical, ScrollText, Sparkles, Package, Coins, Pencil, Trash2 } from 'lucide-react'
import type { HistoryEntry as HistoryEntryType, ItemType } from '../../api/types'
import { formatRelativeTime, formatActionDescription, formatCurrencyChanges, formatFieldChanges, formatItemDetails } from './utils'

// Same icons as ItemCard for consistency
const TYPE_ICONS: Record<ItemType, React.ComponentType<{ className?: string }>> = {
  equipment: Sword,
  potion: FlaskConical,
  scroll: ScrollText,
  consumable: Sparkles,
  misc: Package,
}

// Action-based styling
const ACTION_STYLES = {
  item_added: { bg: 'bg-green-900/40', color: 'text-green-400' },
  item_updated: { bg: 'bg-blue-900/40', color: 'text-blue-400' },
  item_removed: { bg: 'bg-red-900/40', color: 'text-red-400' },
  currency_updated: { bg: 'bg-amber-900/40', color: 'text-amber-400' },
} as const

interface HistoryEntryProps {
  entry: HistoryEntryType
}

export function HistoryEntry({ entry }: HistoryEntryProps) {
  const style = ACTION_STYLES[entry.action]
  
  // Get the appropriate icon
  let Icon: React.ComponentType<{ className?: string }>
  if (entry.action === 'currency_updated') {
    Icon = Coins
  } else if (entry.action === 'item_updated') {
    // Use pencil for updates to indicate editing
    Icon = Pencil
  } else if (entry.action === 'item_removed') {
    // Use item type icon if available, otherwise trash
    const itemType = entry.details?.type as ItemType | undefined
    Icon = itemType ? TYPE_ICONS[itemType] : Trash2
  } else {
    // item_added - use item type icon if available
    const itemType = entry.details?.type as ItemType | undefined
    Icon = itemType ? TYPE_ICONS[itemType] : Package
  }

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
    <div className="flex items-start gap-2 py-2">
      <div className={`w-6 h-6 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-3 h-3 ${style.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-100">
          {formatActionDescription(entry.action, entry.entity_name)}
        </p>
        {detailText && (
          <p className="text-[11px] text-gray-500 mt-0.5">{detailText}</p>
        )}
        <p className="text-[10px] text-gray-400 mt-0.5">
          {formatRelativeTime(entry.created_at)}
        </p>
      </div>
    </div>
  )
}
