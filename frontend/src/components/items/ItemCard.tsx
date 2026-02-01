import { useState } from 'react'
import { ItemThumbnail, ThumbnailPreviewModal } from './ItemThumbnail'
import type { Item } from '../../api/types'

interface ItemCardProps {
  item: Item
  onClick?: () => void
}

export function ItemCard({ item, onClick }: ItemCardProps) {
  const [showPreview, setShowPreview] = useState(false)

  const rarityColors: Record<string, string> = {
    common: 'text-gray-600',
    uncommon: 'text-green-600',
    rare: 'text-blue-600',
    'very rare': 'text-purple-600',
    legendary: 'text-orange-600',
    artifact: 'text-red-600',
  }

  const handleThumbnailClick = () => {
    if (item.thumbnail_url) {
      setShowPreview(true)
    }
  }

  return (
    <>
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-shadow hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          {/* Thumbnail */}
          <ItemThumbnail
            thumbnailUrl={item.thumbnail_url}
            type={item.type}
            name={item.name}
            isGenerating={item.thumbnail_generating}
            size="lg"
            onClick={item.thumbnail_url ? handleThumbnailClick : undefined}
          />

          {/* Item Info */}
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
              {item.quantity > 1 && (
                <span className="flex-shrink-0 bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded">
                  ×{item.quantity}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 capitalize">{item.type}</span>
              {item.rarity && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className={`text-xs font-medium capitalize ${rarityColors[item.rarity.toLowerCase()] || 'text-gray-600'}`}>
                    {item.rarity}
                  </span>
                </>
              )}
              {item.attunement_required && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-indigo-600">Attunement</span>
                </>
              )}
            </div>

            {item.description && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.description}</p>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              {item.weight !== null && (
                <span>{item.weight} lb</span>
              )}
              {item.value_gp !== null && (
                <span>{item.value_gp} gp</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail Preview Modal */}
      {showPreview && item.thumbnail_url && (
        <ThumbnailPreviewModal
          thumbnailUrl={item.thumbnail_url}
          name={item.name}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  )
}
