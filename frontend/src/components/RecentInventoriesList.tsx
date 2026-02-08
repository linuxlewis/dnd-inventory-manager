import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import type { RecentInventory } from '../hooks/useRecentInventories'
import { formatRelativeTime } from './history/utils'

interface RecentInventoriesListProps {
  inventories: RecentInventory[]
  onRemove: (slug: string) => void
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
          className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-indigo-500 hover:shadow-sm transition-all text-left group"
        >
          <Link to={`/${inv.slug}`} className="flex-1 min-w-0">
            <p className="font-medium text-gray-100 truncate group-hover:text-indigo-400 transition-colors">
              {inv.name}
            </p>
            <p className="text-sm text-gray-400">
              {formatRelativeTime(inv.lastAccessed)}
            </p>
          </Link>
          <button
            type="button"
            onClick={() => onRemove(inv.slug)}
            className="flex-shrink-0 ml-3 p-1 text-gray-500 hover:text-red-400 rounded hover:bg-red-900/30 transition-colors"
            aria-label={`Remove ${inv.name} from recents`}
          >
            <X className="w-4 h-4" />
          </button>
        </li>
      ))}
    </ul>
  )
}
