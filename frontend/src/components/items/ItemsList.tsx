import { useState, useMemo } from 'react'
import { Search, Plus, PackageOpen } from 'lucide-react'
import { useItems } from '../../api/items'
import type { Item, ItemType } from '../../api/types'
import { ItemCard } from './ItemCard'
import { TYPE_LABELS } from './utils'
import { useDebounce } from '../../hooks/useDebounce'

interface ItemsListProps {
  slug: string
  onItemClick: (item: Item) => void
  onAddClick: () => void
}

type TabType = 'all' | ItemType

interface TabConfig {
  key: TabType
  label: string
}

const TABS: TabConfig[] = [
  { key: 'all', label: 'All' },
  { key: 'equipment', label: TYPE_LABELS.equipment },
  { key: 'potion', label: TYPE_LABELS.potion },
  { key: 'scroll', label: TYPE_LABELS.scroll },
  { key: 'consumable', label: TYPE_LABELS.consumable },
  { key: 'misc', label: TYPE_LABELS.misc },
]

export function ItemsList({ slug, onItemClick, onAddClick }: ItemsListProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Debounce search to avoid API calls on every keystroke
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Fetch all items once - filter client-side to avoid duplicate API calls
  const { data: allItems = [], isLoading } = useItems(slug)

  // Filter items client-side based on tab and search
  const items = useMemo(() => {
    let filtered = allItems
    
    // Filter by type tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(item => item.type === activeTab)
    }
    
    // Filter by search query
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [allItems, activeTab, debouncedSearch])

  // Count items by type for badges
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allItems.length }
    for (const item of allItems) {
      counts[item.type] = (counts[item.type] || 0) + 1
    }
    return counts
  }, [allItems])

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          />
        </div>
        <button
          onClick={onAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Item</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 min-w-max bg-gray-800 p-1 rounded-lg">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-gray-700 text-gray-100 shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
              {typeCounts[tab.key] > 0 && (
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.key
                      ? 'bg-indigo-900/40 text-indigo-300'
                      : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {typeCounts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-400">Loading items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600">
          <PackageOpen className="mx-auto w-12 h-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-100">No items found</h3>
          <p className="mt-2 text-gray-400">
            {searchQuery
              ? 'Try a different search term'
              : 'Get started by adding your first item'}
          </p>
          {!searchQuery && (
            <button
              onClick={onAddClick}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onClick={() => onItemClick(item)} />
          ))}
        </div>
      )}
    </div>
  )
}
