import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useRecentInventories } from '../../hooks/useRecentInventories'

export function RecentInventorySelector() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { recentInventories } = useRecentInventories()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Don't show if no recent inventories
  if (recentInventories.length === 0) return null

  const currentInventory = recentInventories.find(inv => inv.slug === slug)
  const otherInventories = recentInventories.filter(inv => inv.slug !== slug)

  const handleSelect = (selectedSlug: string) => {
    setIsOpen(false)
    navigate(`/${selectedSlug}`)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-colors"
      >
        <span className="max-w-[150px] truncate">
          {currentInventory?.name || 'Recent'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
          {currentInventory && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Current
              </div>
              <div className="px-3 py-2 text-sm text-gray-100 bg-indigo-900/40 font-medium truncate">
                {currentInventory.name}
              </div>
            </>
          )}
          
          {otherInventories.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide border-t border-gray-700 mt-1">
                Switch to
              </div>
              {otherInventories.map(inv => (
                <button
                  key={inv.slug}
                  onClick={() => handleSelect(inv.slug)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-gray-100 truncate"
                >
                  {inv.name}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
