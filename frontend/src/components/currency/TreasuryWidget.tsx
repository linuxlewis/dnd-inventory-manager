import { Coins, CircleDollarSign } from 'lucide-react'
import { calculateTotalInGold, type CurrencyTotals } from '../../api/currency'

interface TreasuryWidgetProps {
  currency: CurrencyTotals
  compact?: boolean
  onAddSpend?: () => void
  onConvert?: () => void
}

interface CurrencyDisplayProps {
  value: number
  label: string
  abbrev: string
  bgColor: string
  textColor: string
  labelColor: string
}

function CurrencyDisplay({
  value,
  label,
  abbrev,
  bgColor,
  textColor,
  labelColor,
}: CurrencyDisplayProps) {
  return (
    <div className={`${bgColor} rounded-lg p-3 md:p-4 text-center`}>
      <p className={`text-xl md:text-2xl font-bold ${textColor}`}>
        {value.toLocaleString()}
      </p>
      <p className={`text-xs md:text-sm ${labelColor}`}>
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{abbrev}</span>
      </p>
    </div>
  )
}

export function TreasuryWidget({
  currency,
  compact = false,
  onAddSpend,
  onConvert,
}: TreasuryWidgetProps) {
  const totalGP = calculateTotalInGold(currency)

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-600" />
            <span className="font-semibold text-gray-900">Treasury</span>
          </div>
          <span className="text-sm text-gray-500">
            {totalGP.toLocaleString(undefined, { maximumFractionDigits: 2 })} GP total
          </span>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="text-slate-600">{currency.platinum} PP</span>
          <span className="text-yellow-600">{currency.gold} GP</span>
          <span className="text-gray-500">{currency.silver} SP</span>
          <span className="text-amber-700">{currency.copper} CP</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Coins className="w-6 h-6 text-yellow-600" />
          <h2 className="text-xl font-semibold text-gray-900">Treasury</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <CircleDollarSign className="w-4 h-4" />
          <span>
            {totalGP.toLocaleString(undefined, { maximumFractionDigits: 2 })} GP total
          </span>
        </div>
      </div>

      {/* 2x2 grid on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
        <CurrencyDisplay
          value={currency.platinum}
          label="Platinum"
          abbrev="PP"
          bgColor="bg-slate-200"
          textColor="text-slate-700"
          labelColor="text-slate-500"
        />
        <CurrencyDisplay
          value={currency.gold}
          label="Gold"
          abbrev="GP"
          bgColor="bg-yellow-100"
          textColor="text-yellow-700"
          labelColor="text-yellow-600"
        />
        <CurrencyDisplay
          value={currency.silver}
          label="Silver"
          abbrev="SP"
          bgColor="bg-gray-200"
          textColor="text-gray-700"
          labelColor="text-gray-500"
        />
        <CurrencyDisplay
          value={currency.copper}
          label="Copper"
          abbrev="CP"
          bgColor="bg-amber-100"
          textColor="text-amber-800"
          labelColor="text-amber-600"
        />
      </div>

      {/* Action buttons */}
      {(onAddSpend || onConvert) && (
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          {onAddSpend && (
            <button
              onClick={onAddSpend}
              className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Add / Spend
            </button>
          )}
          {onConvert && (
            <button
              onClick={onConvert}
              className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Convert
            </button>
          )}
        </div>
      )}
    </div>
  )
}
