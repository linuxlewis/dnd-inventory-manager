import { useCallback, useMemo } from 'react'
import { X, History, Loader2 } from 'lucide-react'
import type { HistoryEntry as HistoryEntryType } from '../../api/types'
import { fetchHistory } from '../../api/history'
import { useInfiniteQuery } from '@tanstack/react-query'
import { HistoryEntry } from './HistoryEntry'

interface HistoryPanelProps {
  slug: string
  isOpen: boolean
  onClose: () => void
}

const PAGE_SIZE = 20

function groupEntriesByDay(entries: HistoryEntryType[]): [string, HistoryEntryType[]][] {
  const groups = new Map<string, HistoryEntryType[]>()
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const toDateKey = (dateStr: string): string => {
    const date = new Date(dateStr)
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  }

  for (const entry of entries) {
    const key = toDateKey(entry.created_at)
    const group = groups.get(key)
    if (group) {
      group.push(entry)
    } else {
      groups.set(key, [entry])
    }
  }
  return Array.from(groups.entries())
}

export function HistoryPanel({ slug, isOpen, onClose }: HistoryPanelProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['history-panel', slug],
    queryFn: ({ pageParam = 0 }) => fetchHistory(slug, { limit: PAGE_SIZE, offset: pageParam * PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const currentCount = pages.reduce((acc, page) => acc + page.entries.length, 0)
      return currentCount < lastPage.total ? pages.length : undefined
    },
    enabled: isOpen,
  })

  const loadedEntries = useMemo(() => data?.pages.flatMap(page => page.entries) ?? [], [data])

  const grouped = useMemo(() => groupEntriesByDay(loadedEntries), [loadedEntries])

  const handleLoadMore = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, fetchNextPage])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={handleClose} />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Activity Log</h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close activity log"
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-sm">Loading activity...</p>
            </div>
          ) : loadedEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <History className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">No activity yet</p>
              <p className="text-xs mt-1">Actions will appear here as items are added or modified.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([dayLabel, entries]) => (
                <div key={dayLabel}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {dayLabel}
                  </h3>
                  <div className="divide-y divide-gray-100">
                    {entries.map((entry) => (
                      <HistoryEntry key={entry.id} entry={entry} />
                    ))}
                  </div>
                </div>
              ))}

              {hasNextPage && (
                <div className="pt-2 pb-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={isFetchingNextPage}
                    className="w-full py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isFetchingNextPage ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
