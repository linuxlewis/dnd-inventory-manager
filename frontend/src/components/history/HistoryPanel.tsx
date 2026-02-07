import { useState } from 'react'
import { History, ChevronRight } from 'lucide-react'
import { useHistoryPanel } from '../../api/history'
import { HistoryEntry } from './HistoryEntry'
import { HistorySidebar } from './HistorySidebar'

interface HistoryPanelProps {
  slug: string
}

export function HistoryPanel({ slug }: HistoryPanelProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data, isLoading } = useHistoryPanel(slug)

  const lastEntry = data?.entries?.[0]

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-4">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-700 rounded-full" />
          <div className="h-3 bg-gray-700 rounded w-32" />
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setSidebarOpen(true)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg shadow-md p-4 hover:bg-gray-700 transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
            <History className="w-4 h-4" />
            Recent Activity
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
        
        {lastEntry ? (
          <div className="mt-2 pointer-events-none">
            <HistoryEntry entry={lastEntry} />
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-400">No activity yet</p>
        )}
      </button>

      <HistorySidebar
        slug={slug}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </>
  )
}
