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
