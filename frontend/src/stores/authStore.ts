import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  sessions: Record<string, string> // slug -> passphrase
  setSession: (slug: string, passphrase: string) => void
  clearSession: (slug: string) => void
  getPassphrase: (slug: string) => string | null
  hasSession: (slug: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      sessions: {},
      setSession: (slug: string, passphrase: string) =>
        set((state) => ({
          sessions: { ...state.sessions, [slug]: passphrase },
        })),
      clearSession: (slug: string) =>
        set((state) => {
          const newSessions = { ...state.sessions }
          delete newSessions[slug]
          return { sessions: newSessions }
        }),
      getPassphrase: (slug: string) => get().sessions[slug] ?? null,
      hasSession: (slug: string) => slug in get().sessions,
    }),
    {
      name: 'dnd-inventory-sessions',
    }
  )
)
