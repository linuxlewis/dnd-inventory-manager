import { Clock, History } from 'lucide-react'
import type { HistoryEntry } from '../../api/types'
import { formatRelativeTime, formatActionDescription } from './utils'

interface ActivityWidgetProps {
  lastEntry: HistoryEntry | undefined
  isLoading: boolean
  onClick: () => void
}

export function ActivityWidget({ lastEntry, isLoading, onClick }: ActivityWidgetProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!lastEntry) {
    return (
      <button
        onClick={onClick}
        className="w-full bg-white rounded-lg shadow-md p-4 mb-6 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <History className="w-4 h-4 text-gray-400" />
        </div>
        <span className="text-sm text-gray-400">No activity yet</span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-lg shadow-md p-4 mb-6 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
    >
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
        <Clock className="w-4 h-4 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {formatActionDescription(lastEntry.action, lastEntry.entity_name)}
        </p>
        <p className="text-xs text-gray-500">
          {formatRelativeTime(lastEntry.created_at)}
        </p>
      </div>
      <History className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </button>
  )
}
