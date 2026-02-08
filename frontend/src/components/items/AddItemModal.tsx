import { useState, useEffect, useRef } from 'react'
import { X, Search, Loader2 } from 'lucide-react'
import { useCreateItem } from '../../api/items'
import { useSrdSearch, type SrdSearchResult } from '../../api/srd/hooks'
import type { ItemType, ItemRarity, ItemCreate } from '../../api/types'
import { ITEM_TYPES, ITEM_RARITIES, TYPE_LABELS, RARITY_LABELS } from './utils'
import { useDebounce } from '../../hooks/useDebounce'

// Currency conversion rates to gold pieces
const CURRENCY_TO_GP: Record<string, number> = {
  gp: 1,
  sp: 0.1,
  cp: 0.01,
  pp: 10,
  ep: 0.5,
}

interface AddItemModalProps {
  slug: string
  isOpen: boolean
  onClose: () => void
}

function srdToRarity(srdRarity?: { name: string }): ItemRarity {
  if (!srdRarity) return 'common'
  const name = srdRarity.name.toLowerCase().replace(/\s+/g, '_')
  if (ITEM_RARITIES.includes(name as ItemRarity)) {
    return name as ItemRarity
  }
  return 'common'
}

function srdToType(item: SrdSearchResult): ItemType {
  if (item.source === 'magic-item') {
    const category = item.equipment_category.name.toLowerCase()
    if (category.includes('potion')) return 'potion'
    if (category.includes('scroll')) return 'scroll'
    return 'misc'
  }
  // Equipment union types
  const typename = item.__typename
  if (typename === 'Weapon' || typename === 'Armor') return 'equipment'
  if ('equipment_category' in item) {
    const category = (item as { equipment_category: { name: string } }).equipment_category.name.toLowerCase()
    if (category.includes('weapon') || category.includes('armor')) return 'equipment'
    if (category.includes('potion')) return 'potion'
    if (category.includes('scroll')) return 'scroll'
  }
  return 'misc'
}

export function AddItemModal({ slug, isOpen, onClose }: AddItemModalProps) {
  const createItem = useCreateItem(slug)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  
  const [srdSelectCount, setSrdSelectCount] = useState(0)
  const [name, setName] = useState('')
  const [type, setType] = useState<ItemType>('equipment')
  const [category, setCategory] = useState('')
  const [rarity, setRarity] = useState<ItemRarity>('common')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [weight, setWeight] = useState<number | ''>('')
  const [estimatedValue, setEstimatedValue] = useState<number | ''>('')

  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debounce search using custom hook
  const debouncedQuery = useDebounce(searchQuery, 300)

  const { data: srdResults = [], isLoading: srdLoading } = useSrdSearch(debouncedQuery)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const resetForm = () => {
    setSearchQuery('')
    setName('')
    setType('equipment')
    setCategory('')
    setRarity('common')
    setDescription('')
    setNotes('')
    setQuantity(1)
    setWeight('')
    setEstimatedValue('')
    setFormError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const cleanSrdDescription = (desc?: string[] | null): string => {
    if (!desc || desc.length === 0) return ''
    // Filter out lines that are just type/rarity headers (e.g. "Potion, varies", "Weapon, rare")
    // and markdown table formatting (|---|---|)
    const cleaned = desc
      .filter((line) => {
        const trimmed = line.trim()
        // Skip "Type, rarity" header lines
        if (/^(Potion|Weapon|Armor|Wondrous item|Ring|Rod|Staff|Wand|Scroll),\s/i.test(trimmed)) return false
        // Skip table separator lines
        if (/^\|[-|:\s]+\|$/.test(trimmed)) return false
        // Skip table header/title lines like "Potions of Healing (table)"
        if (/\(table\)\s*$/i.test(trimmed)) return false
        return true
      })
      // Clean markdown table rows into readable text
      .map((line) => {
        if (line.startsWith('|') && line.endsWith('|')) {
          return line.split('|').filter(Boolean).map(s => s.trim()).join(' — ')
        }
        return line
      })
    return cleaned.join('\n').trim()
  }

  const handleSrdSelect = (item: SrdSearchResult) => {
    setSrdSelectCount((c) => c + 1)
    setName(item.name)
    setType(srdToType(item))
    // Build description from structured data + raw desc
    let desc = cleanSrdDescription(item.desc)
    if (item.source === 'equipment') {
      const parts: string[] = []
      if (item.__typename === 'Weapon') {
        if (item.weapon_category) parts.push(`${item.weapon_category} Weapon`)
        if (item.damage) {
          const dmgStr = item.damage.damage_type
            ? `${item.damage.damage_dice} ${item.damage.damage_type.name}`
            : item.damage.damage_dice
          parts.push(`Damage: ${dmgStr}`)
        }
        if (item.properties?.length) {
          parts.push(`Properties: ${item.properties.map(p => p.name).join(', ')}`)
        }
      } else if (item.__typename === 'Armor') {
        if (item.armor_category) parts.push(`${item.armor_category} Armor`)
        if (item.armor_class) {
          const acStr = item.armor_class.dex_bonus
            ? `AC ${item.armor_class.base} + Dex modifier`
            : `AC ${item.armor_class.base}`
          parts.push(acStr)
        }
      }
      if (parts.length) {
        desc = desc ? `${parts.join(' · ')}\n\n${desc}` : parts.join(' · ')
      }
    }
    setDescription(desc)

    if (item.source === 'magic-item') {
      setCategory(item.equipment_category.name)
      setRarity(srdToRarity(item.rarity))
    } else {
      // Equipment: extract category from __typename or equipment_category
      if ('equipment_category' in item) {
        setCategory((item as { equipment_category: { name: string } }).equipment_category.name)
      } else if (item.__typename === 'Weapon') {
        setCategory('Weapon')
      } else if (item.__typename === 'Armor') {
        setCategory('Armor')
      } else {
        setCategory(item.__typename ?? '')
      }
      setRarity('common')
      if (item.weight) setWeight(item.weight)
      if (item.cost) {
        const rate = CURRENCY_TO_GP[item.cost.unit] ?? 0
        const costInGp = item.cost.quantity * rate
        setEstimatedValue(costInGp)
      }
    }

    setSearchQuery('')
    setShowDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!name.trim()) {
      setFormError('Name is required')
      return
    }

    const itemData: ItemCreate = {
      name: name.trim(),
      type,
      category: category || type,
      rarity,
      description: description || undefined,
      notes: notes || undefined,
      quantity: quantity || 1,
      weight: weight || undefined,
      estimated_value: estimatedValue || undefined,
    }

    try {
      await createItem.mutateAsync(itemData)
      handleClose()
    } catch {
      setFormError('Failed to create item. Please try again.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

        {/* Modal */}
        <div className="relative w-full max-w-lg bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-gray-100">Add Item</h2>
            <button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* SRD Search - outside scrollable area so dropdown isn't clipped */}
          <div className="p-4 border-b border-gray-700" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Search SRD (optional)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search D&D 5e items..."
                className="w-full pl-10 pr-10 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
              />
              {srdLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
              )}
            </div>
            
            {/* Dropdown */}
            {showDropdown && srdResults.length > 0 && (
              <div className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {srdResults.map((item) => (
                  <button
                    key={`${item.source}-${item.index}`}
                    type="button"
                    onClick={() => handleSrdSelect(item)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-600 border-b border-gray-600 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-100">{item.name}</span>
                      {item.source === 'magic-item' && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-900/50 text-purple-300 rounded">Magic</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {item.source === 'magic-item'
                        ? item.equipment_category.name
                        : ('equipment_category' in item
                            ? (item as { equipment_category: { name: string } }).equipment_category.name
                            : item.__typename)}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showDropdown && !srdLoading && debouncedQuery.length >= 2 && srdResults.length === 0 && (
              <div className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-400">
                No items found
              </div>
            )}
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
            {formError && (
              <div className="p-3 bg-red-900/30 border border-red-500 text-red-400 rounded">
                {formError}
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="add-item-name" className="block text-sm font-medium text-gray-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                key={`name-${srdSelectCount}`}
                id="add-item-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                required
                className="w-full px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
              />
            </div>

            {/* Type and Rarity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="add-item-type" className="block text-sm font-medium text-gray-300 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="add-item-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as ItemType)}
                  className="w-full px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
                >
                  {ITEM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="add-item-rarity" className="block text-sm font-medium text-gray-300 mb-1">
                  Rarity
                </label>
                <select
                  id="add-item-rarity"
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value as ItemRarity)}
                  className="w-full px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
                >
                  {ITEM_RARITIES.map((r) => (
                    <option key={r} value={r}>
                      {RARITY_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="add-item-category" className="block text-sm font-medium text-gray-300 mb-1">
                Category
              </label>
              <input
                id="add-item-category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Weapon, Armor, Adventuring Gear"
                className="w-full px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
              />
            </div>

            {/* Quantity and Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="add-item-quantity" className="block text-sm font-medium text-gray-300 mb-1">
                  Quantity
                </label>
                <input
                  id="add-item-quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
                />
              </div>
              <div>
                <label htmlFor="add-item-weight" className="block text-sm font-medium text-gray-300 mb-1">
                  Weight (lbs)
                </label>
                <input
                  id="add-item-weight"
                  type="number"
                  min="0"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
                />
              </div>
            </div>

            {/* Estimated Value */}
            <div>
              <label htmlFor="add-item-value" className="block text-sm font-medium text-gray-300 mb-1">
                Estimated Value (GP)
              </label>
              <input
                id="add-item-value"
                type="number"
                min="0"
                step="0.01"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value ? parseFloat(e.target.value) : '')}
                className="w-full px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="add-item-description" className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                id="add-item-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-gray-800 resize-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="add-item-notes" className="block text-sm font-medium text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                id="add-item-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Personal notes about this item..."
                className="w-full px-3 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-gray-800 resize-none"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-700 bg-gray-900 rounded-b-lg">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={createItem.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 transition-colors"
            >
              {createItem.isPending ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
