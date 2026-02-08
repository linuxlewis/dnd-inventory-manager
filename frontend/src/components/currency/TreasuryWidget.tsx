import { Plus, Minus } from 'lucide-react'
import type { Currency } from '../../api/types'

interface TreasuryWidgetProps {
  currency: Currency | undefined
  isLoading: boolean
  isMutating?: boolean
  onAddFunds: () => void
  onSpend: () => void
}

export function TreasuryWidget({
  currency,
  isLoading,
  isMutating = false,
  onAddFunds,
  onSpend,
}: TreasuryWidgetProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Treasury</h2>
        <div className="flex items-center justify-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-indigo-600 border-t-transparent"></div>
          <span className="ml-2 text-gray-400">Loading treasury...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md p-6 mb-6 relative">
      {/* Loading overlay */}
      {isMutating && (
        <div className="absolute inset-0 bg-gray-800/70 flex items-center justify-center rounded-lg z-10">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <h2 className="text-xl font-semibold text-gray-100">Treasury</h2>
        <div className="flex gap-2">
          <button
            onClick={onAddFunds}
            disabled={isMutating}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Funds
          </button>
          <button
            onClick={onSpend}
            disabled={isMutating}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors disabled:opacity-50"
          >
            <Minus className="w-4 h-4" />
            Spend
          </button>
        </div>
      </div>

      {/* Currency grid - 2x2 on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-slate-700/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-slate-300">{currency?.platinum ?? 0}</p>
          <p className="text-sm text-slate-400 font-medium">PP</p>
        </div>
        <div className="bg-yellow-900/30 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{currency?.gold ?? 0}</p>
          <p className="text-sm text-yellow-500 font-medium">GP</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-300">{currency?.silver ?? 0}</p>
          <p className="text-sm text-gray-400 font-medium">SP</p>
        </div>
        <div className="bg-amber-900/30 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{currency?.copper ?? 0}</p>
          <p className="text-sm text-amber-500 font-medium">CP</p>
        </div>
      </div>

      {/* Total value */}
      <div className="text-center text-gray-400 text-sm">
        Total value: <span className="font-semibold text-gray-300">{(currency?.total_gp ?? 0).toFixed(2)} GP</span>
      </div>
    </div>
  )
}
