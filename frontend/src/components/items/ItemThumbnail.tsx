import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { ItemTypePlaceholder } from './ItemTypePlaceholder'
import type { ItemType } from '../../api/types'

interface ItemThumbnailProps {
  thumbnailUrl: string | null
  type: ItemType
  name: string
  isGenerating?: boolean
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
}

export function ItemThumbnail({
  thumbnailUrl,
  type,
  name,
  isGenerating = false,
  size = 'md',
  onClick,
  className = '',
}: ItemThumbnailProps) {
  const [imageError, setImageError] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  // Show generating state
  if (isGenerating) {
    return (
      <div
        className={`${sizeClasses[size]} bg-indigo-50 rounded-lg flex items-center justify-center ${className}`}
        title="Generating thumbnail..."
      >
        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
      </div>
    )
  }

  // Show thumbnail if available and no error
  if (thumbnailUrl && !imageError) {
    return (
      <button
        onClick={onClick}
        className={`${sizeClasses[size]} rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : 'cursor-default'} ${className}`}
        disabled={!onClick}
        title={`${name} thumbnail`}
      >
        <img
          src={thumbnailUrl}
          alt={`${name} thumbnail`}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </button>
    )
  }

  // Show placeholder icon
  return <ItemTypePlaceholder type={type} size={size} className={className} />
}

// Modal component for viewing full-size thumbnail
interface ThumbnailPreviewModalProps {
  thumbnailUrl: string
  name: string
  onClose: () => void
}

export function ThumbnailPreviewModal({ thumbnailUrl, name, onClose }: ThumbnailPreviewModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Close preview"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-4">
          <img
            src={thumbnailUrl}
            alt={`${name} thumbnail`}
            className="w-full rounded-lg"
          />
          <p className="mt-3 text-center text-gray-700 font-medium">{name}</p>
        </div>
      </div>
    </div>
  )
}
