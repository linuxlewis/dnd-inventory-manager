import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

interface ToastState {
  toasts: Toast[]
  muted: boolean
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  setMuted: (muted: boolean) => void
}

let toastId = 0

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  muted: false,

  addToast: (toast) => {
    if (get().muted) return

    const id = `toast-${++toastId}`
    const newToast: Toast = { ...toast, id }

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }))

    // Auto-remove after duration
    const duration = toast.duration ?? 4000
    setTimeout(() => {
      get().removeToast(id)
    }, duration)
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  setMuted: (muted) => {
    set({ muted })
  },
}))

// Helper functions for common toast types
export function showItemAddedToast(name: string, quantity: number) {
  useToastStore.getState().addToast({
    message: `Item added: ${name}${quantity > 1 ? ` ×${quantity}` : ''}`,
    type: 'info',
  })
}

export function showItemUpdatedToast(name: string) {
  useToastStore.getState().addToast({
    message: `Item updated: ${name}`,
    type: 'info',
  })
}

export function showItemRemovedToast(name: string) {
  useToastStore.getState().addToast({
    message: `Item removed: ${name}`,
    type: 'info',
  })
}

export function showCurrencyUpdatedToast() {
  useToastStore.getState().addToast({
    message: 'Treasury updated',
    type: 'info',
  })
}
