import { useState } from 'react'
import { X, Pencil, Trash2, Sword, FlaskConical, ScrollText, Sparkles, Package, AlertTriangle } from 'lucide-react'
import type { Item, ItemType } from '../../api/types'
import { useDeleteItem } from '../../api/items'
import { RARITY_COLORS, formatRarity, formatType, formatDamage, formatArmorClass, formatHealing } from './utils'

interface ItemDetailProps {
  item: Item
  slug: string
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
}

const TYPE_ICONS: Record<ItemType, React.ComponentType<{ className?: string }>> = {
  equipment: Sword,
  potion: FlaskConical,
  scroll: ScrollText,
  consumable: Sparkles,
  misc: Package,
}

export function ItemDetail({ item, slug, isOpen, onClose, onEdit }: ItemDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const deleteItem = useDeleteItem(slug, item.id)

  const rarityColors = RARITY_COLORS[item.rarity]
  const TypeIcon = TYPE_ICONS[item.type]

  const handleDelete = async () => {
    try {
      await deleteItem.mutateAsync()
      onClose()
    } catch {
      // Error handling could show toast
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className={`flex items-start justify-between p-4 border-b ${rarityColors.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-lg bg-white border-2 ${rarityColors.border} flex items-center justify-center overflow-hidden`}>
              {item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <TypeIcon className={`w-8 h-8 ${rarityColors.text}`} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${rarityColors.badge}`}>
                  {formatRarity(item.rarity)}
                </span>
                {item.quantity > 1 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                    ×{item.quantity}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Basic Info */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Basic Info
            </h3>
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-sm text-gray-500">Type</dt>
                <dd className="font-medium text-gray-900">{formatType(item.type)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Category</dt>
                <dd className="font-medium text-gray-900">{item.category}</dd>
              </div>
              {item.weight !== undefined && item.weight !== null && (
                <div>
                  <dt className="text-sm text-gray-500">Weight</dt>
                  <dd className="font-medium text-gray-900">{item.weight} lbs</dd>
                </div>
              )}
              {item.estimated_value !== undefined && item.estimated_value !== null && (
                <div>
                  <dt className="text-sm text-gray-500">Est. Value</dt>
                  <dd className="font-medium text-gray-900">{item.estimated_value} GP</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Description */}
          {item.description && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Description
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>
            </section>
          )}

          {/* Type-specific properties */}
          {item.properties && Object.keys(item.properties).length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Properties
              </h3>
              <dl className="space-y-2">
                {item.type === 'equipment' && item.properties.damage && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-gray-500">Damage</dt>
                    <dd className="font-medium text-gray-900">{formatDamage(item.properties.damage)}</dd>
                  </div>
                )}
                {item.type === 'equipment' && item.properties.armor_class && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-gray-500">Armor Class</dt>
                    <dd className="font-medium text-gray-900">{formatArmorClass(item.properties.armor_class)}</dd>
                  </div>
                )}
                {item.type === 'potion' && item.properties.healing && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-gray-500">Healing</dt>
                    <dd className="font-medium text-gray-900">{formatHealing(item.properties.healing)}</dd>
                  </div>
                )}
                {item.type === 'potion' && item.properties.duration && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-gray-500">Duration</dt>
                    <dd className="font-medium text-gray-900">{String(item.properties.duration)}</dd>
                  </div>
                )}
                {item.type === 'scroll' && item.properties.spell && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-gray-500">Spell</dt>
                    <dd className="font-medium text-gray-900">{String(item.properties.spell)}</dd>
                  </div>
                )}
                {item.type === 'scroll' && item.properties.spell_level && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-gray-500">Spell Level</dt>
                    <dd className="font-medium text-gray-900">{String(item.properties.spell_level)}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* Notes */}
          {item.notes && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Notes
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                {item.notes}
              </p>
            </section>
          )}

          {/* Metadata */}
          <section className="text-xs text-gray-400">
            <p>Added: {new Date(item.created_at).toLocaleDateString()}</p>
            <p>Updated: {new Date(item.updated_at).toLocaleDateString()}</p>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Item?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteItem.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteItem.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
