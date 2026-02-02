import type { ItemRarity, ItemType } from '../../api/types'

export const RARITY_COLORS: Record<ItemRarity, { bg: string; border: string; text: string; badge: string }> = {
  common: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-600', badge: 'bg-gray-200 text-gray-700' },
  uncommon: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-600', badge: 'bg-green-100 text-green-700' },
  rare: { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  very_rare: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
  legendary: { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
  artifact: { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
}

export const TYPE_LABELS: Record<ItemType, string> = {
  equipment: 'Equipment',
  potion: 'Potion',
  scroll: 'Scroll',
  consumable: 'Consumable',
  misc: 'Misc',
}

export const RARITY_LABELS: Record<ItemRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  very_rare: 'Very Rare',
  legendary: 'Legendary',
  artifact: 'Artifact',
}

export const ITEM_TYPES: ItemType[] = ['equipment', 'potion', 'scroll', 'consumable', 'misc']
export const ITEM_RARITIES: ItemRarity[] = ['common', 'uncommon', 'rare', 'very_rare', 'legendary', 'artifact']

export function formatRarity(rarity: ItemRarity): string {
  return RARITY_LABELS[rarity]
}

export function formatType(type: ItemType): string {
  return TYPE_LABELS[type]
}

/**
 * Format damage property for display.
 * Handles both SRD format {damage_dice, damage_type: {name}} and simple strings.
 */
export function formatDamage(damage: unknown): string {
  if (typeof damage === 'string') return damage
  if (typeof damage === 'object' && damage !== null) {
    const d = damage as Record<string, unknown>
    const dice = d.damage_dice || d.dice || ''
    const damageType = d.damage_type
    const typeName = typeof damageType === 'object' && damageType !== null
      ? (damageType as Record<string, unknown>).name
      : damageType
    if (dice && typeName) return `${dice} ${typeName}`
    if (dice) return String(dice)
  }
  return String(damage)
}

/**
 * Format armor class property for display.
 * Handles both SRD format {base, dex_bonus} and simple numbers.
 */
export function formatArmorClass(ac: unknown): string {
  if (typeof ac === 'number') return String(ac)
  if (typeof ac === 'string') return ac
  if (typeof ac === 'object' && ac !== null) {
    const a = ac as Record<string, unknown>
    const base = a.base ?? a.value
    const dexBonus = a.dex_bonus
    if (base !== undefined) {
      if (dexBonus === true) return `${base} + Dex`
      if (dexBonus === false) return String(base)
      return String(base)
    }
  }
  return String(ac)
}

/**
 * Format healing property for display.
 * Handles dice strings and object formats.
 */
export function formatHealing(healing: unknown): string {
  if (typeof healing === 'string') return healing
  if (typeof healing === 'object' && healing !== null) {
    const h = healing as Record<string, unknown>
    return h.dice || h.healing_dice || h.amount || String(healing)
  }
  return String(healing)
}
