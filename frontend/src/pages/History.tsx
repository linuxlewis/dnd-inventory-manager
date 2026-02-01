import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Search, Filter, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import {
  useHistory,
  useUndoAction,
  type HistoryAction,
  type HistoryListParams,
} from '../api/history'
import { HistoryEntry } from '../components/history/HistoryEntry'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

const ACTION_FILTERS: { value: HistoryAction | ''; label: string }[] = [
  { value: '', label: 'All Actions' },
  { value: 'item_added', label: 'Items Added' },
  { value: 'item_removed', label: 'Items Removed' },
  { value: 'item_updated', label: 'Items Updated' },
  { value: 'quantity_changed', label: 'Quantity Changed' },
  { value: 'currency_changed', label: 'Currency Changed' },
  { value: 'undo', label: 'Undone Actions' },
]

const PAGE_SIZE = 20

export function History() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { hasSession } = useAuth()

  const [actionFilter, setActionFilter] = useState<HistoryAction | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [undoTarget, setUndoTarget] = useState<string | null>(null)

  const isAuthenticated = slug ? hasSession(slug) : false

  const params: HistoryListParams = {
    limit: PAGE_SIZE,
    offset,
    ...(actionFilter && { action: actionFilter }),
    ...(searchQuery.trim() && { search: searchQuery.trim() }),
  }

  const {
    data: historyData,
    isLoading,
    error,
    isFetching,
  } = useHistory(slug ?? '', params)

  const undoAction = useUndoAction(slug ?? '')

  const handleUndo = useCallback((entryId: string) => {
    setUndoTarget(entryId)
  }, [])

  const confirmUndo = async () => {
    if (!undoTarget) return

    try {
      await undoAction.mutateAsync(undoTarget)
      setUndoTarget(null)
    } catch {
      // Error handling is managed by the mutation
      setUndoTarget(null)
    }
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-gray-600 mb-4">
          Please authenticate to view history.
        </p>
        <Link
          to={`/${slug}`}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Go to inventory →
        </Link>
      </div>
    )
  }

  const totalPages = historyData
    ? Math.ceil(historyData.total / PAGE_SIZE)
    : 0
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/${slug}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Inventory
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          History
        </h1>
        <p className="text-gray-600 mt-1">
          View and manage changes to your inventory
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setOffset(0)
              }}
              placeholder="Search by item name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action Filter */}
          <div className="relative sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value as HistoryAction | '')
                setOffset(0)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
            >
              {ACTION_FILTERS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading history...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">Failed to load history.</p>
        </div>
      )}

      {/* History List */}
      {historyData && (
        <>
          {historyData.entries.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <p className="text-gray-500">No history entries found.</p>
              {(actionFilter || searchQuery) && (
                <button
                  onClick={() => {
                    setActionFilter('')
                    setSearchQuery('')
                    setOffset(0)
                  }}
                  className="mt-2 text-indigo-600 hover:text-indigo-800"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Entry Count */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  {historyData.total} {historyData.total === 1 ? 'entry' : 'entries'}
                  {isFetching && !isLoading && (
                    <Loader2 className="inline w-4 h-4 ml-2 animate-spin" />
                  )}
                </p>
              </div>

              {/* Entries */}
              <div className="space-y-3">
                {historyData.entries.map((entry) => (
                  <HistoryEntry
                    key={entry.id}
                    entry={entry}
                    onUndo={handleUndo}
                    isUndoing={undoAction.isPending}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                    disabled={offset === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setOffset(offset + PAGE_SIZE)}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Undo Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!undoTarget}
        onClose={() => setUndoTarget(null)}
        onConfirm={confirmUndo}
        title="Undo Action"
        message="Are you sure you want to undo this action? This will create a new history entry reversing the change."
        confirmText="Undo"
        confirmVariant="warning"
        isLoading={undoAction.isPending}
      />
    </div>
  )
}
