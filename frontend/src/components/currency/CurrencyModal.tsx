import { useState } from 'react'
import { X, Plus, Minus } from 'lucide-react'
import { useUpdateCurrency, type CurrencyTotals } from '../../api/currency'

interface CurrencyModalProps {
  isOpen: boolean
  onClose: () => void
  slug: string
  currentCurrency: CurrencyTotals
}

type Mode = 'add' | 'spend'

interface CurrencyInputs {
  platinum: number
  gold: number
  silver: number
  copper: number
}

const initialInputs: CurrencyInputs = {
  platinum: 0,
  gold: 0,
  silver: 0,
  copper: 0,
}

interface CurrencyModalContentProps {
  onClose: () => void
  slug: string
  currentCurrency: CurrencyTotals
}

function CurrencyModalContent({
  onClose,
  slug,
  currentCurrency,
}: CurrencyModalContentProps) {
  const [mode, setMode] = useState<Mode>('add')
  const [inputs, setInputs] = useState<CurrencyInputs>(initialInputs)
  const [note, setNote] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const updateCurrency = useUpdateCurrency(slug)

  const handleInputChange = (currency: keyof CurrencyInputs, value: string) => {
    const numValue = Math.max(0, parseInt(value) || 0)
    setInputs((prev) => ({ ...prev, [currency]: numValue }))
    setValidationError(null)
  }

  // Calculate new totals for preview
  const calculateNewTotals = (): CurrencyTotals => {
    const multiplier = mode === 'add' ? 1 : -1
    return {
      platinum: currentCurrency.platinum + inputs.platinum * multiplier,
      gold: currentCurrency.gold + inputs.gold * multiplier,
      silver: currentCurrency.silver + inputs.silver * multiplier,
      copper: currentCurrency.copper + inputs.copper * multiplier,
    }
  }

  const newTotals = calculateNewTotals()

  // Check if spending would result in negative values
  const hasNegative =
    newTotals.platinum < 0 ||
    newTotals.gold < 0 ||
    newTotals.silver < 0 ||
    newTotals.copper < 0

  const hasAnyInput =
    inputs.platinum > 0 ||
    inputs.gold > 0 ||
    inputs.silver > 0 ||
    inputs.copper > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!hasAnyInput) {
      setValidationError('Enter at least one currency amount')
      return
    }

    if (mode === 'spend' && hasNegative) {
      setValidationError("Can't spend more than you have")
      return
    }

    const multiplier = mode === 'add' ? 1 : -1
    const data = {
      platinum: inputs.platinum > 0 ? inputs.platinum * multiplier : undefined,
      gold: inputs.gold > 0 ? inputs.gold * multiplier : undefined,
      silver: inputs.silver > 0 ? inputs.silver * multiplier : undefined,
      copper: inputs.copper > 0 ? inputs.copper * multiplier : undefined,
      note: note.trim() || undefined,
    }

    try {
      await updateCurrency.mutateAsync(data)
      onClose()
    } catch {
      setValidationError('Failed to update currency. Please try again.')
    }
  }

  const currencies = [
    {
      key: 'platinum' as const,
      label: 'Platinum',
      abbrev: 'PP',
      color: 'slate',
    },
    { key: 'gold' as const, label: 'Gold', abbrev: 'GP', color: 'yellow' },
    { key: 'silver' as const, label: 'Silver', abbrev: 'SP', color: 'gray' },
    { key: 'copper' as const, label: 'Copper', abbrev: 'CP', color: 'amber' },
  ]

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
          {mode === 'add' ? 'Add Funds' : 'Spend Currency'}
        </h2>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Mode Toggle */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMode('add')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'add'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            Add Funds
          </button>
          <button
            type="button"
            onClick={() => setMode('spend')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'spend'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Minus className="w-4 h-4" />
            Spend
          </button>
        </div>

        {/* Currency Inputs */}
        <div className="space-y-3">
          {currencies.map(({ key, label, abbrev }) => (
            <div key={key} className="flex items-center gap-3">
              <label className="w-24 text-sm font-medium text-gray-700">
                {label}
              </label>
              <input
                type="number"
                min="0"
                value={inputs[key] || ''}
                onChange={(e) => handleInputChange(key, e.target.value)}
                placeholder="0"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="w-8 text-sm text-gray-500">{abbrev}</span>
            </div>
          ))}
        </div>

        {/* Note Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., Sold dragon scales"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Preview */}
        {hasAnyInput && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">New Totals</p>
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              {currencies.map(({ key, abbrev }) => {
                const isNegative = newTotals[key] < 0
                return (
                  <div
                    key={key}
                    className={isNegative ? 'text-red-600' : 'text-gray-600'}
                  >
                    <span className="font-semibold">{newTotals[key]}</span>
                    <span className="ml-1">{abbrev}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Validation Error */}
        {validationError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {validationError}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            updateCurrency.isPending ||
            !hasAnyInput ||
            (mode === 'spend' && hasNegative)
          }
          className={`w-full py-3 px-4 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            mode === 'add'
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {updateCurrency.isPending
            ? 'Processing...'
            : mode === 'add'
              ? 'Add Funds'
              : 'Spend Currency'}
        </button>
      </form>
    </div>
  )
}

export function CurrencyModal({
  isOpen,
  onClose,
  slug,
  currentCurrency,
}: CurrencyModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      {/* Using key to remount content when modal opens, resetting all state */}
      <CurrencyModalContent
        key={isOpen.toString()}
        onClose={onClose}
        slug={slug}
        currentCurrency={currentCurrency}
      />
    </div>
  )
}
