import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useUpdateCurrency } from '../../api/currency'
import type { Currency, CurrencyUpdateRequest } from '../../api/types'

interface CurrencyModalProps {
  slug: string
  mode: 'add' | 'spend'
  isOpen: boolean
  onClose: () => void
  currentCurrency: Currency | undefined
}

export function CurrencyModal({
  slug,
  mode,
  isOpen,
  onClose,
  currentCurrency,
}: CurrencyModalProps) {
  const updateCurrency = useUpdateCurrency(slug)

  const [platinum, setPlatinum] = useState(0)
  const [gold, setGold] = useState(0)
  const [silver, setSilver] = useState(0)
  const [copper, setCopper] = useState(0)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isSpendMode = mode === 'spend'
  const title = isSpendMode ? 'Spend Currency' : 'Add Funds'

  // Conversion rates (in copper)
  const COPPER_RATES = { platinum: 1000, gold: 100, silver: 10, copper: 1 }

  // Calculate total available in copper
  const totalAvailableCopper = 
    (currentCurrency?.platinum ?? 0) * COPPER_RATES.platinum +
    (currentCurrency?.gold ?? 0) * COPPER_RATES.gold +
    (currentCurrency?.silver ?? 0) * COPPER_RATES.silver +
    (currentCurrency?.copper ?? 0) * COPPER_RATES.copper

  // Calculate total spend in copper
  const totalSpendCopper = 
    platinum * COPPER_RATES.platinum +
    gold * COPPER_RATES.gold +
    silver * COPPER_RATES.silver +
    copper * COPPER_RATES.copper

  // Check if spending exceeds total available (not per-denomination)
  const exceedsTotal = isSpendMode && totalSpendCopper > totalAvailableCopper

  // Calculate new totals for preview (backend will optimize denominations)
  const newTotalCopper = isSpendMode 
    ? totalAvailableCopper - totalSpendCopper 
    : totalAvailableCopper + totalSpendCopper
  
  // Preview: show what the backend will calculate (optimal denominations)
  const previewPlatinum = Math.floor(newTotalCopper / COPPER_RATES.platinum)
  const remainingAfterPP = newTotalCopper % COPPER_RATES.platinum
  const previewGold = Math.floor(remainingAfterPP / COPPER_RATES.gold)
  const remainingAfterGP = remainingAfterPP % COPPER_RATES.gold
  const previewSilver = Math.floor(remainingAfterGP / COPPER_RATES.silver)
  const previewCopper = remainingAfterGP % COPPER_RATES.silver

  const resetForm = () => {
    setPlatinum(0)
    setGold(0)
    setSilver(0)
    setCopper(0)
    setNote('')
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate spend mode - check total value, not per-denomination
    if (isSpendMode && exceedsTotal) {
      setError('Cannot spend more than total available funds')
      return
    }

    // Build request - negative values for spend mode
    const multiplier = isSpendMode ? -1 : 1
    const data: CurrencyUpdateRequest = {
      ...(platinum !== 0 && { platinum: platinum * multiplier }),
      ...(gold !== 0 && { gold: gold * multiplier }),
      ...(silver !== 0 && { silver: silver * multiplier }),
      ...(copper !== 0 && { copper: copper * multiplier }),
      ...(note.trim() && { note: note.trim() }),
    }

    // Check if anything is being changed
    if (!data.platinum && !data.gold && !data.silver && !data.copper) {
      setError('Please enter at least one denomination amount')
      return
    }

    try {
      await updateCurrency.mutateAsync(data)
      handleClose()
    } catch {
      setError('Failed to update currency. Please try again.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

        {/* Modal */}
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Spend mode warning */}
            {isSpendMode && exceedsTotal && (
              <div className="flex items-center gap-2 p-3 bg-amber-100 border border-amber-400 text-amber-800 rounded">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>Total spend exceeds available funds</span>
              </div>
            )}

            {/* Currency inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="currency-platinum" className="block text-sm font-medium text-gray-700 mb-1">
                  Platinum (PP)
                </label>
                <input
                  id="currency-platinum"
                  type="number"
                  min="0"
                  value={platinum}
                  onChange={(e) => setPlatinum(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {isSpendMode && (
                  <p className="text-xs text-gray-500 mt-1">Available: {currentCurrency?.platinum ?? 0}</p>
                )}
              </div>
              <div>
                <label htmlFor="currency-gold" className="block text-sm font-medium text-gray-700 mb-1">
                  Gold (GP)
                </label>
                <input
                  id="currency-gold"
                  type="number"
                  min="0"
                  value={gold}
                  onChange={(e) => setGold(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {isSpendMode && (
                  <p className="text-xs text-gray-500 mt-1">Available: {currentCurrency?.gold ?? 0}</p>
                )}
              </div>
              <div>
                <label htmlFor="currency-silver" className="block text-sm font-medium text-gray-700 mb-1">
                  Silver (SP)
                </label>
                <input
                  id="currency-silver"
                  type="number"
                  min="0"
                  value={silver}
                  onChange={(e) => setSilver(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {isSpendMode && (
                  <p className="text-xs text-gray-500 mt-1">Available: {currentCurrency?.silver ?? 0}</p>
                )}
              </div>
              <div>
                <label htmlFor="currency-copper" className="block text-sm font-medium text-gray-700 mb-1">
                  Copper (CP)
                </label>
                <input
                  id="currency-copper"
                  type="number"
                  min="0"
                  value={copper}
                  onChange={(e) => setCopper(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {isSpendMode && (
                  <p className="text-xs text-gray-500 mt-1">Available: {currentCurrency?.copper ?? 0}</p>
                )}
              </div>
            </div>

            {/* Preview section */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div>
                  <p className="text-gray-500">PP</p>
                  <p className="font-medium">{currentCurrency?.platinum ?? 0} → <span className={exceedsTotal ? 'text-red-600' : ''}>{previewPlatinum}</span></p>
                </div>
                <div>
                  <p className="text-gray-500">GP</p>
                  <p className="font-medium">{currentCurrency?.gold ?? 0} → <span className={exceedsTotal ? 'text-red-600' : ''}>{previewGold}</span></p>
                </div>
                <div>
                  <p className="text-gray-500">SP</p>
                  <p className="font-medium">{currentCurrency?.silver ?? 0} → <span className={exceedsTotal ? 'text-red-600' : ''}>{previewSilver}</span></p>
                </div>
                <div>
                  <p className="text-gray-500">CP</p>
                  <p className="font-medium">{currentCurrency?.copper ?? 0} → <span className={exceedsTotal ? 'text-red-600' : ''}>{previewCopper}</span></p>
                </div>
              </div>
            </div>

            {/* Note */}
            <div>
              <label htmlFor="currency-note" className="block text-sm font-medium text-gray-700 mb-1">
                Note (optional)
              </label>
              <input
                id="currency-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Sold dragon scales, Bought supplies"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={updateCurrency.isPending || (isSpendMode && exceedsTotal)}
              className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                isSpendMode
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {updateCurrency.isPending
                ? 'Processing...'
                : isSpendMode
                  ? 'Spend'
                  : 'Add Funds'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
