import { useState, useMemo } from 'react'
import { X, ArrowRight, AlertTriangle } from 'lucide-react'
import { useConvertCurrency } from '../../api/currency'
import type { Currency, CurrencyDenomination, CurrencyConvertRequest } from '../../api/types'

interface ConvertModalProps {
  slug: string
  isOpen: boolean
  onClose: () => void
  currentCurrency: Currency | undefined
}

const DENOMINATIONS: { value: CurrencyDenomination; label: string; abbrev: string }[] = [
  { value: 'platinum', label: 'Platinum', abbrev: 'PP' },
  { value: 'gold', label: 'Gold', abbrev: 'GP' },
  { value: 'silver', label: 'Silver', abbrev: 'SP' },
  { value: 'copper', label: 'Copper', abbrev: 'CP' },
]

// Conversion rates: value in copper pieces
const COPPER_VALUES: Record<CurrencyDenomination, number> = {
  copper: 1,
  silver: 10,
  gold: 100,
  platinum: 1000,
}

export function ConvertModal({
  slug,
  isOpen,
  onClose,
  currentCurrency,
}: ConvertModalProps) {
  const convertCurrency = useConvertCurrency(slug)

  const [fromDenom, setFromDenom] = useState<CurrencyDenomination>('gold')
  const [toDenom, setToDenom] = useState<CurrencyDenomination>('silver')
  const [amount, setAmount] = useState(1)
  const [error, setError] = useState<string | null>(null)

  // Get available balance for selected denomination
  const availableBalance = currentCurrency?.[fromDenom] ?? 0

  // Check validations
  const isSameDenom = fromDenom === toDenom
  const exceedsBalance = amount > availableBalance

  // Calculate conversion result
  const conversionResult = useMemo(() => {
    if (isSameDenom || amount <= 0) return null

    const fromCopperValue = COPPER_VALUES[fromDenom]
    const toCopperValue = COPPER_VALUES[toDenom]
    const totalCopper = amount * fromCopperValue
    const resultAmount = Math.floor(totalCopper / toCopperValue)
    const remainder = totalCopper % toCopperValue

    return {
      amount: resultAmount,
      remainder: remainder,
      remainderDenom: 'copper' as CurrencyDenomination,
    }
  }, [fromDenom, toDenom, amount, isSameDenom])

  const resetForm = () => {
    setFromDenom('gold')
    setToDenom('silver')
    setAmount(1)
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (isSameDenom) {
      setError('Cannot convert to the same denomination')
      return
    }

    if (exceedsBalance) {
      setError('Amount exceeds available balance')
      return
    }

    if (amount < 1) {
      setError('Amount must be at least 1')
      return
    }

    const data: CurrencyConvertRequest = {
      from_denomination: fromDenom,
      to_denomination: toDenom,
      amount,
    }

    try {
      await convertCurrency.mutateAsync(data)
      handleClose()
    } catch {
      setError('Failed to convert currency. Please try again.')
    }
  }

  // Get abbreviation for denomination
  const getAbbrev = (denom: CurrencyDenomination) => {
    return DENOMINATIONS.find((d) => d.value === denom)?.abbrev ?? denom.toUpperCase()
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
            <h2 className="text-xl font-semibold text-gray-900">Convert Currency</h2>
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

            {/* Same denomination warning */}
            {isSameDenom && (
              <div className="flex items-center gap-2 p-3 bg-amber-100 border border-amber-400 text-amber-800 rounded">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>Cannot convert to the same denomination</span>
              </div>
            )}

            {/* From denomination */}
            <div>
              <label htmlFor="convert-from" className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <select
                id="convert-from"
                value={fromDenom}
                onChange={(e) => setFromDenom(e.target.value as CurrencyDenomination)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DENOMINATIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label} ({d.abbrev}) - Available: {currentCurrency?.[d.value] ?? 0}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="convert-amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                id="convert-amount"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  exceedsBalance ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {exceedsBalance && (
                <p className="text-xs text-red-600 mt-1">
                  Exceeds available balance ({availableBalance} {getAbbrev(fromDenom)})
                </p>
              )}
            </div>

            {/* To denomination */}
            <div>
              <label htmlFor="convert-to" className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <select
                id="convert-to"
                value={toDenom}
                onChange={(e) => setToDenom(e.target.value as CurrencyDenomination)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DENOMINATIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label} ({d.abbrev})
                  </option>
                ))}
              </select>
            </div>

            {/* Conversion preview */}
            {conversionResult && !isSameDenom && (
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h3 className="text-sm font-medium text-indigo-900 mb-2">Conversion Preview</h3>
                <div className="flex items-center justify-center gap-3 text-lg">
                  <span className="font-semibold text-indigo-700">
                    {amount} {getAbbrev(fromDenom)}
                  </span>
                  <ArrowRight className="w-5 h-5 text-indigo-500" />
                  <span className="font-semibold text-indigo-700">
                    {conversionResult.amount} {getAbbrev(toDenom)}
                  </span>
                </div>
                {conversionResult.remainder > 0 && (
                  <p className="text-xs text-indigo-600 text-center mt-2">
                    (Remainder: {conversionResult.remainder} CP will be kept)
                  </p>
                )}
              </div>
            )}

            {/* Conversion rates reference */}
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Conversion rates:</p>
              <p>10 CP = 1 SP • 10 SP = 1 GP • 10 GP = 1 PP</p>
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
              disabled={convertCurrency.isPending || isSameDenom || exceedsBalance}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {convertCurrency.isPending ? 'Converting...' : 'Convert'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
