import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import type { RecentInventory } from '../hooks/useRecentInventories'

interface RecentInventoriesListProps {
  inventories: RecentInventory[]
  onRemove: (slug: string) => void
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function RecentInventoriesList({
  inventories,
  onRemove,
}: RecentInventoriesListProps) {
  if (inventories.length === 0) return null

  return (
    <ul className="space-y-2">
      {inventories.map((inv) => (
        <li
          key={inv.slug}
          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all text-left group"
        >
          <Link to={`/i/${inv.slug}`} className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
              {inv.name}
            </p>
            <p className="text-sm text-gray-500">
              {formatRelativeTime(inv.lastAccessed)}
            </p>
          </Link>
          <button
            type="button"
            onClick={() => onRemove(inv.slug)}
            className="flex-shrink-0 ml-3 p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
            aria-label={`Remove ${inv.name} from recents`}
          >
            <X className="w-4 h-4" />
          </button>
        </li>
      ))}
    </ul>
  )
}
