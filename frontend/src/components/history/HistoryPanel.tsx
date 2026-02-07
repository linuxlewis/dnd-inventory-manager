import { History } from 'lucide-react'
import { useHistoryPanel } from '../../api/history'
import { HistoryEntry } from './HistoryEntry'

interface HistoryPanelProps {
  slug: string
}

export function HistoryPanel({ slug }: HistoryPanelProps) {
  const { data, isLoading, error } = useHistoryPanel(slug)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <History className="w-4 h-4" />
          Activity Log
        </h3>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-2 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <History className="w-4 h-4" />
          Activity Log
        </h3>
        <p className="text-gray-500 text-xs">Failed to load activity log</p>
      </div>
    )
  }

  const entries = data?.entries ?? []

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <History className="w-4 h-4" />
        Activity Log
      </h3>
      
      {entries.length === 0 ? (
        <p className="text-gray-500 text-xs">No activity yet</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {entries.map((entry) => (
            <HistoryEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
