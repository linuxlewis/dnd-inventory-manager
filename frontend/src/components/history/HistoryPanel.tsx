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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <History className="w-5 h-5" />
          Activity Log
        </h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <History className="w-5 h-5" />
          Activity Log
        </h2>
        <p className="text-gray-500 text-sm">Failed to load activity log</p>
      </div>
    )
  }

  const entries = data?.entries ?? []

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <History className="w-5 h-5" />
        Activity Log
      </h2>
      
      {entries.length === 0 ? (
        <p className="text-gray-500 text-sm">No activity yet</p>
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
