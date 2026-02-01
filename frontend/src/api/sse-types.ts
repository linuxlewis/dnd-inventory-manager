/**
 * SSE Event Types
 * Events received from the backend SSE endpoint
 */

export type SSEConnectionStatus = 'connected' | 'connecting' | 'disconnected'

export interface SSEItemEvent {
  id: string
  name: string
  quantity: number
  description?: string
  category?: string
  weight?: number
  value?: number
}

export interface SSECurrencyEvent {
  copper: number
  silver: number
  gold: number
  platinum: number
}

export interface SSEConnectionCountEvent {
  count: number
}

export interface SSEEvent {
  event: string
  data: unknown
  timestamp?: string
}

export interface ItemAddedEvent extends SSEEvent {
  event: 'item_added'
  data: SSEItemEvent
}

export interface ItemUpdatedEvent extends SSEEvent {
  event: 'item_updated'
  data: SSEItemEvent
}

export interface ItemRemovedEvent extends SSEEvent {
  event: 'item_removed'
  data: { id: string }
}

export interface CurrencyUpdatedEvent extends SSEEvent {
  event: 'currency_updated'
  data: SSECurrencyEvent
}

export interface ConnectionCountEvent extends SSEEvent {
  event: 'connection_count'
  data: SSEConnectionCountEvent
}

export interface ConnectedEvent extends SSEEvent {
  event: 'connected'
  data: { message: string }
}

export type InventorySSEEvent =
  | ItemAddedEvent
  | ItemUpdatedEvent
  | ItemRemovedEvent
  | CurrencyUpdatedEvent
  | ConnectionCountEvent
  | ConnectedEvent
