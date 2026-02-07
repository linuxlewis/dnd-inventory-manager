import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RecentInventory {
  slug: string
  name: string
  lastAccessed: number
}

const MAX_ITEMS = 10

interface RecentInventoriesState {
  recentInventories: RecentInventory[]
  addRecent: (slug: string, name: string) => void
  removeRecent: (slug: string) => void
  clearAll: () => void
}

export const useRecentInventoriesStore = create<RecentInventoriesState>()(
  persist(
    (set) => ({
      recentInventories: [],
      addRecent: (slug: string, name: string) =>
        set((state) => {
          const filtered = state.recentInventories.filter((item) => item.slug !== slug)
          const updated = [{ slug, name, lastAccessed: Date.now() }, ...filtered].slice(0, MAX_ITEMS)
          return { recentInventories: updated }
        }),
      removeRecent: (slug: string) =>
        set((state) => ({
          recentInventories: state.recentInventories.filter((item) => item.slug !== slug),
        })),
      clearAll: () => set({ recentInventories: [] }),
    }),
    {
      name: 'dnd-inventory-recent',
    }
  )
)
