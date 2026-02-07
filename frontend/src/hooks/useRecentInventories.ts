import { useState, useCallback } from 'react'

export interface RecentInventory {
  slug: string
  name: string
  lastAccessed: number
}

const STORAGE_KEY = 'dnd-inventory-recent'
const MAX_ITEMS = 10

function loadRecent(): RecentInventory[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecent(items: RecentInventory[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function useRecentInventories() {
  const [recentInventories, setRecentInventories] = useState<RecentInventory[]>(loadRecent)

  const addRecent = useCallback((slug: string, name: string) => {
    setRecentInventories((prev) => {
      const filtered = prev.filter((item) => item.slug !== slug)
      const updated = [{ slug, name, lastAccessed: Date.now() }, ...filtered].slice(0, MAX_ITEMS)
      saveRecent(updated)
      return updated
    })
  }, [])

  const removeRecent = useCallback((slug: string) => {
    setRecentInventories((prev) => {
      const updated = prev.filter((item) => item.slug !== slug)
      saveRecent(updated)
      return updated
    })
  }, [])

  const clearAll = useCallback(() => {
    setRecentInventories([])
    saveRecent([])
  }, [])

  return { recentInventories, addRecent, removeRecent, clearAll }
}
