import { useRecentInventoriesStore } from '../stores/recentInventoriesStore'
import type { RecentInventory } from '../stores/recentInventoriesStore'

export type { RecentInventory }

export function useRecentInventories() {
  const recentInventories = useRecentInventoriesStore((state) => state.recentInventories)
  const addRecent = useRecentInventoriesStore((state) => state.addRecent)
  const removeRecent = useRecentInventoriesStore((state) => state.removeRecent)
  const clearAll = useRecentInventoriesStore((state) => state.clearAll)

  return {
    recentInventories,
    addRecent,
    removeRecent,
    clearAll,
  }
}
