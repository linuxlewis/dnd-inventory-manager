export interface InventoryCreate {
  name: string
  passphrase: string
  description?: string
  slug?: string
}

export interface InventoryResponse {
  id: string
  slug: string
  name: string
  description: string | null
  copper: number
  silver: number
  gold: number
  platinum: number
  created_at: string
  updated_at: string
}

export interface InventoryAuth {
  passphrase: string
}

export interface AuthResponse {
  success: boolean
  message?: string
}

// Item types
export type ItemType = 'equipment' | 'potion' | 'scroll' | 'consumable' | 'misc'
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'artifact'

export interface Item {
  id: string
  inventory_id: string
  name: string
  type: ItemType
  category: string
  rarity: ItemRarity
  description: string
  notes?: string
  quantity: number
  weight?: number
  estimated_value?: number
  thumbnail_url?: string
  properties?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ItemCreate {
  name: string
  type: ItemType
  category?: string
  rarity?: ItemRarity
  description?: string
  notes?: string
  quantity?: number
  weight?: number
  estimated_value?: number
  thumbnail_url?: string
  properties?: Record<string, unknown>
}

export type ItemUpdate = Partial<ItemCreate>

export interface SrdItem {
  index: string
  name: string
  equipment_category?: { name: string }
  weapon_category?: string
  armor_category?: string
  desc?: string[]
  cost?: { quantity: number; unit: string }
  weight?: number
  damage?: { damage_dice: string; damage_type: { name: string } }
  armor_class?: { base: number; dex_bonus: boolean }
  properties?: { name: string }[]
  rarity?: { name: string }
}

// Currency types
export type CurrencyDenomination = 'copper' | 'silver' | 'gold' | 'platinum'

export interface Currency {
  copper: number
  silver: number
  gold: number
  platinum: number
  total_gp: number
}

export interface CurrencyUpdateRequest {
  copper?: number
  silver?: number
  gold?: number
  platinum?: number
  note?: string
}

export interface CurrencyConvertRequest {
  from_denomination: CurrencyDenomination
  to_denomination: CurrencyDenomination
  amount: number
}

// History types
export type HistoryAction = 'item_added' | 'item_updated' | 'item_removed' | 'currency_updated'
export type HistoryEntityType = 'item' | 'currency'

export interface HistoryEntry {
  id: string
  action: HistoryAction
  entity_type: HistoryEntityType
  entity_id: string | null
  entity_name: string | null
  details: Record<string, unknown> | null
  created_at: string
}

export interface HistoryResponse {
  entries: HistoryEntry[]
  total: number
  limit: number
  offset: number
}
