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

// OpenAI Connection types
export interface OpenAIStatus {
  connected: boolean
  last_used_at?: string
}

export interface OpenAIConnectRequest {
  api_key: string
}

export interface OpenAITestResponse {
  success: boolean
  message?: string
}

// Item types
export type ItemType = 'weapon' | 'armor' | 'potion' | 'scroll' | 'wand' | 'ring' | 'wondrous' | 'misc'

export interface Item {
  id: string
  inventory_id: string
  name: string
  description: string | null
  type: ItemType
  quantity: number
  weight: number | null
  value_gp: number | null
  rarity: string | null
  attunement_required: boolean
  thumbnail_url: string | null
  thumbnail_generating: boolean
  created_at: string
  updated_at: string
}

export interface ThumbnailGenerateResponse {
  success: boolean
  thumbnail_url?: string
  message?: string
}
