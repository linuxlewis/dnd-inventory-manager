import type { ItemRarity, ItemType } from '../../api/types'

export const RARITY_COLORS: Record<ItemRarity, { bg: string; border: string; text: string; badge: string }> = {
  common: { bg: 'bg-gray-800', border: 'border-gray-500', text: 'text-gray-400', badge: 'bg-gray-700 text-gray-300' },
  uncommon: { bg: 'bg-green-900/30', border: 'border-green-500', text: 'text-green-400', badge: 'bg-green-900/40 text-green-300' },
  rare: { bg: 'bg-blue-900/30', border: 'border-blue-500', text: 'text-blue-400', badge: 'bg-blue-900/40 text-blue-300' },
  very_rare: { bg: 'bg-purple-900/30', border: 'border-purple-500', text: 'text-purple-400', badge: 'bg-purple-900/40 text-purple-300' },
  legendary: { bg: 'bg-orange-900/30', border: 'border-orange-500', text: 'text-orange-400', badge: 'bg-orange-900/40 text-orange-300' },
  artifact: { bg: 'bg-red-900/30', border: 'border-red-500', text: 'text-red-400', badge: 'bg-red-900/40 text-red-300' },
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
    const value = h.dice ?? h.healing_dice ?? h.amount
    if (value !== undefined) return String(value)
  }
  return String(healing)
}
