import { Sword, FlaskConical, ScrollText, Sparkles, Package } from 'lucide-react'
import type { Item, ItemType } from '../../api/types'
import { RARITY_COLORS, formatRarity } from './utils'

interface ItemCardProps {
  item: Item
  onClick?: () => void
}

const TYPE_ICONS: Record<ItemType, React.ComponentType<{ className?: string }>> = {
  equipment: Sword,
  potion: FlaskConical,
  scroll: ScrollText,
  consumable: Sparkles,
  misc: Package,
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  const rarityColors = RARITY_COLORS[item.rarity]
  const TypeIcon = TYPE_ICONS[item.type]

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border-2 ${rarityColors.border} ${rarityColors.bg} hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500`}
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-12 h-12 rounded bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
          {item.thumbnail_url ? (
            <img
              src={item.thumbnail_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <TypeIcon className={`w-6 h-6 ${rarityColors.text}`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
            {item.quantity > 1 && (
              <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                ×{item.quantity}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded ${rarityColors.badge}`}>
              {formatRarity(item.rarity)}
            </span>
            <span className="text-xs text-gray-500 capitalize">{item.type}</span>
          </div>

          {/* Key stats preview */}
          {item.properties && (
            <div className="mt-2 text-sm text-gray-600">
              {item.type === 'equipment' && item.properties.damage && (
                <span>Damage: {String(item.properties.damage)}</span>
              )}
              {item.type === 'equipment' && item.properties.armor_class && (
                <span>AC: {String(item.properties.armor_class)}</span>
              )}
              {item.type === 'potion' && item.properties.healing && (
                <span>Healing: {String(item.properties.healing)}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
