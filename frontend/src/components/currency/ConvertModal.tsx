import { useState } from 'react'
import { X, ArrowRight, RefreshCw } from 'lucide-react'
import {
  useConvertCurrency,
  getConversionRate,
  type CurrencyTotals,
} from '../../api/currency'

interface ConvertModalProps {
  isOpen: boolean
  onClose: () => void
  slug: string
  currentCurrency: CurrencyTotals
}

type Denomination = 'copper' | 'silver' | 'gold' | 'platinum'

const DENOMINATIONS: { value: Denomination; label: string; abbrev: string }[] =
  [
    { value: 'platinum', label: 'Platinum', abbrev: 'PP' },
    { value: 'gold', label: 'Gold', abbrev: 'GP' },
    { value: 'silver', label: 'Silver', abbrev: 'SP' },
    { value: 'copper', label: 'Copper', abbrev: 'CP' },
  ]

interface ConvertModalContentProps {
  onClose: () => void
  slug: string
  currentCurrency: CurrencyTotals
}

function ConvertModalContent({
  onClose,
  slug,
  currentCurrency,
}: ConvertModalContentProps) {
  const [fromDenom, setFromDenom] = useState<Denomination>('gold')
  const [toDenom, setToDenom] = useState<Denomination>('silver')
  const [amount, setAmount] = useState<number>(0)
  const [validationError, setValidationError] = useState<string | null>(null)

  const convertCurrency = useConvertCurrency(slug)

  const availableAmount = currentCurrency[fromDenom]
  const conversionRate = getConversionRate(fromDenom, toDenom)
  const resultAmount = Math.floor(amount * conversionRate)
  const insufficientFunds = amount > availableAmount

  const handleSwap = () => {
    setFromDenom(toDenom)
    setToDenom(fromDenom)
    setAmount(0)
    setValidationError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (amount <= 0) {
      setValidationError('Enter an amount to convert')
      return
    }

    if (fromDenom === toDenom) {
      setValidationError('Select different denominations')
      return
    }

    if (insufficientFunds) {
      setValidationError(
        `Insufficient ${fromDenom}. You have ${availableAmount}.`
      )
      return
    }

    try {
      await convertCurrency.mutateAsync({
        from: fromDenom,
        to: toDenom,
        amount,
      })
      onClose()
    } catch {
      setValidationError('Failed to convert currency. Please try again.')
    }
  }

  const getAbbrev = (denom: Denomination) =>
    DENOMINATIONS.find((d) => d.value === denom)?.abbrev ?? ''

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Convert Currency</h2>
        <button
          onClick={onClose}
          className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* From/To Selection */}
        <div className="flex items-center gap-3">
          {/* From */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From
            </label>
            <select
              value={fromDenom}
              onChange={(e) => {
                setFromDenom(e.target.value as Denomination)
                setValidationError(null)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {DENOMINATIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label} ({currentCurrency[d.value]})
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <button
            type="button"
            onClick={handleSwap}
            className="mt-6 p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
            title="Swap denominations"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* To */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <select
              value={toDenom}
              onChange={(e) => {
                setToDenom(e.target.value as Denomination)
                setValidationError(null)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {DENOMINATIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              max={availableAmount}
              value={amount || ''}
              onChange={(e) => {
                setAmount(Math.max(0, parseInt(e.target.value) || 0))
                setValidationError(null)
              }}
              placeholder="0"
              className={`w-full px-3 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                insufficientFunds ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {getAbbrev(fromDenom)}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Available: {availableAmount.toLocaleString()} {getAbbrev(fromDenom)}
          </p>
        </div>

        {/* Conversion Preview */}
        {amount > 0 && fromDenom !== toDenom && (
          <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-700">{amount}</p>
              <p className="text-sm text-gray-500">{getAbbrev(fromDenom)}</p>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400" />
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{resultAmount}</p>
              <p className="text-sm text-gray-500">{getAbbrev(toDenom)}</p>
            </div>
          </div>
        )}

        {/* Same denomination warning */}
        {fromDenom === toDenom && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm">
            Select different denominations to convert.
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
            convertCurrency.isPending ||
            amount <= 0 ||
            fromDenom === toDenom ||
            insufficientFunds
          }
          className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {convertCurrency.isPending ? 'Converting...' : 'Convert'}
        </button>
      </form>
    </div>
  )
}

export function ConvertModal({
  isOpen,
  onClose,
  slug,
  currentCurrency,
}: ConvertModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      {/* Using key to remount content when modal opens, resetting all state */}
      <ConvertModalContent
        key={isOpen.toString()}
        onClose={onClose}
        slug={slug}
        currentCurrency={currentCurrency}
      />
    </div>
  )
}
