import { 
  Sword, 
  Shield, 
  FlaskConical, 
  ScrollText, 
  Wand2, 
  CircleDot, 
  Sparkles, 
  Package,
  type LucideIcon
} from 'lucide-react'
import type { ItemType } from '../../api/types'

// Map item types to Lucide icons
const itemTypeIcons: Record<ItemType, LucideIcon> = {
  weapon: Sword,
  armor: Shield,
  potion: FlaskConical,
  scroll: ScrollText,
  wand: Wand2,
  ring: CircleDot,
  wondrous: Sparkles,
  misc: Package,
}

// Map item types to colors for placeholder backgrounds
const itemTypeColors: Record<ItemType, { bg: string; icon: string }> = {
  weapon: { bg: 'bg-red-100', icon: 'text-red-600' },
  armor: { bg: 'bg-slate-100', icon: 'text-slate-600' },
  potion: { bg: 'bg-green-100', icon: 'text-green-600' },
  scroll: { bg: 'bg-amber-100', icon: 'text-amber-600' },
  wand: { bg: 'bg-purple-100', icon: 'text-purple-600' },
  ring: { bg: 'bg-yellow-100', icon: 'text-yellow-600' },
  wondrous: { bg: 'bg-indigo-100', icon: 'text-indigo-600' },
  misc: { bg: 'bg-gray-100', icon: 'text-gray-600' },
}

interface ItemTypePlaceholderProps {
  type: ItemType
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ItemTypePlaceholder({ type, size = 'md', className = '' }: ItemTypePlaceholderProps) {
  const IconComponent = itemTypeIcons[type] || Package
  const colors = itemTypeColors[type] || itemTypeColors.misc

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div 
      className={`${sizeClasses[size]} ${colors.bg} rounded-lg flex items-center justify-center ${className}`}
      title={`${type.charAt(0).toUpperCase() + type.slice(1)} item`}
    >
      <IconComponent className={`${iconSizes[size]} ${colors.icon}`} />
    </div>
  )
}

// Export for use in other components
export { itemTypeIcons, itemTypeColors }
