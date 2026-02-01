import { useState } from 'react'
import {
  Plus,
  Minus,
  Edit,
  Hash,
  Coins,
  RotateCcw,
  Undo2,
  Circle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  type HistoryEntry as HistoryEntryType,
  type HistoryAction,
  formatRelativeTime,
  getActionDescription,
} from '../../api/history'

interface HistoryEntryProps {
  entry: HistoryEntryType
  onUndo?: (entryId: string) => void
  isUndoing?: boolean
}

function getActionIcon(action: HistoryAction) {
  switch (action) {
    case 'item_added':
      return <Plus className="w-4 h-4" />
    case 'item_removed':
      return <Minus className="w-4 h-4" />
    case 'item_updated':
      return <Edit className="w-4 h-4" />
    case 'quantity_changed':
      return <Hash className="w-4 h-4" />
    case 'currency_changed':
      return <Coins className="w-4 h-4" />
    case 'rollback':
      return <RotateCcw className="w-4 h-4" />
    case 'undo':
      return <Undo2 className="w-4 h-4" />
    default:
      return <Circle className="w-4 h-4" />
  }
}

function getActionColor(action: HistoryAction): string {
  switch (action) {
    case 'item_added':
      return 'bg-green-100 text-green-600'
    case 'item_removed':
      return 'bg-red-100 text-red-600'
    case 'item_updated':
    case 'quantity_changed':
      return 'bg-blue-100 text-blue-600'
    case 'currency_changed':
      return 'bg-yellow-100 text-yellow-600'
    case 'rollback':
    case 'undo':
      return 'bg-gray-100 text-gray-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

function formatCurrencyDelta(
  prev: Record<string, number> | null,
  next: Record<string, number> | null
): React.ReactNode {
  if (!prev || !next) return null

  const currencies = ['platinum', 'gold', 'silver', 'copper'] as const
  const abbrev = { platinum: 'PP', gold: 'GP', silver: 'SP', copper: 'CP' }

  const deltas: { currency: string; delta: number; abbr: string }[] = []
  for (const curr of currencies) {
    const delta = (next[curr] ?? 0) - (prev[curr] ?? 0)
    if (delta !== 0) {
      deltas.push({ currency: curr, delta, abbr: abbrev[curr] })
    }
  }

  if (deltas.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {deltas.map(({ currency, delta, abbr }) => (
        <span
          key={currency}
          className={`text-sm font-medium ${
            delta > 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {delta > 0 ? '+' : ''}
          {delta} {abbr}
        </span>
      ))}
    </div>
  )
}

export function HistoryEntry({ entry, onUndo, isUndoing }: HistoryEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const description = getActionDescription(entry)
  const relativeTime = formatRelativeTime(entry.timestamp)
  const canUndo = !entry.is_undone && entry.action !== 'undo' && onUndo

  const hasDetails =
    entry.item_snapshot ||
    (entry.action === 'currency_changed' &&
      entry.previous_value &&
      entry.new_value)

  return (
    <div
      className={`bg-white rounded-lg border shadow-sm ${
        entry.is_undone ? 'opacity-60' : ''
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Action Icon */}
          <div
            className={`flex-shrink-0 p-2 rounded-full ${getActionColor(entry.action)}`}
          >
            {getActionIcon(entry.action)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p
                  className={`font-medium text-gray-900 ${
                    entry.is_undone ? 'line-through' : ''
                  }`}
                >
                  {description}
                </p>
                <p className="text-sm text-gray-500">{relativeTime}</p>
                {entry.note && (
                  <p className="text-sm text-gray-600 mt-1 italic">
                    "{entry.note}"
                  </p>
                )}
              </div>

              {/* Undo Button */}
              {canUndo && (
                <button
                  onClick={() => onUndo(entry.id)}
                  disabled={isUndoing}
                  className="flex-shrink-0 p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Undo this action"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
              )}

              {entry.is_undone && (
                <span className="flex-shrink-0 px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded">
                  Undone
                </span>
              )}
            </div>

            {/* Currency delta display */}
            {entry.action === 'currency_changed' &&
              !isExpanded &&
              formatCurrencyDelta(
                entry.previous_value as Record<string, number> | null,
                entry.new_value as Record<string, number> | null
              )}
          </div>
        </div>

        {/* Expand button for details */}
        {hasDetails && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show details
              </>
            )}
          </button>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && hasDetails && (
        <div className="px-4 pb-4 pt-0">
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            {entry.item_snapshot && (
              <div>
                <p className="font-medium text-gray-700 mb-1">Item Snapshot:</p>
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {JSON.stringify(entry.item_snapshot, null, 2)}
                </pre>
              </div>
            )}

            {entry.action === 'currency_changed' && (
              <div className="grid grid-cols-2 gap-4">
                {entry.previous_value && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Before:</p>
                    <div className="space-y-1">
                      {Object.entries(
                        entry.previous_value as Record<string, number>
                      ).map(([key, value]) => (
                        <p key={key} className="text-gray-600">
                          {key}: {value}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {entry.new_value && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">After:</p>
                    <div className="space-y-1">
                      {Object.entries(
                        entry.new_value as Record<string, number>
                      ).map(([key, value]) => (
                        <p key={key} className="text-gray-600">
                          {key}: {value}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
