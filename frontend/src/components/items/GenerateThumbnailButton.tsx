import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw, Loader2, Clock } from 'lucide-react'
import { useGenerateThumbnail } from '../../api/items'
import { useOpenAIStatus } from '../../api/openai'

interface GenerateThumbnailButtonProps {
  slug: string
  itemId: string
  hasThumbnail: boolean
  onSuccess?: (thumbnailUrl: string) => void
}

// Cooldown in milliseconds (30 seconds)
const COOLDOWN_MS = 30000

export function GenerateThumbnailButton({
  slug,
  itemId,
  hasThumbnail,
  onSuccess,
}: GenerateThumbnailButtonProps) {
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [lastGenerated, setLastGenerated] = useState<number | null>(null)

  const { data: openAIStatus, isLoading: statusLoading } = useOpenAIStatus(slug)
  const generateThumbnail = useGenerateThumbnail()

  const isConnected = openAIStatus?.connected ?? false
  const isGenerating = generateThumbnail.isPending
  const isOnCooldown = cooldownRemaining > 0

  // Cooldown timer effect
  useEffect(() => {
    if (!lastGenerated) return

    const updateCooldown = () => {
      const elapsed = Date.now() - lastGenerated
      const remaining = Math.max(0, COOLDOWN_MS - elapsed)
      setCooldownRemaining(remaining)

      if (remaining > 0) {
        requestAnimationFrame(updateCooldown)
      }
    }

    updateCooldown()
  }, [lastGenerated])

  const handleGenerate = async () => {
    if (isGenerating || isOnCooldown || !isConnected) return

    try {
      const result = await generateThumbnail.mutateAsync({ slug, itemId })
      
      if (result.success && result.thumbnail_url) {
        setLastGenerated(Date.now())
        onSuccess?.(result.thumbnail_url)
      }
    } catch {
      // Error is handled by the mutation
    }
  }

  const formatCooldown = (ms: number) => {
    const seconds = Math.ceil(ms / 1000)
    return `${seconds}s`
  }

  // Loading state for OpenAI status
  if (statusLoading) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-400 text-sm rounded-lg cursor-not-allowed"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading...
      </button>
    )
  }

  // Not connected state with tooltip
  if (!isConnected) {
    return (
      <div className="relative group">
        <button
          disabled
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-400 text-sm rounded-lg cursor-not-allowed"
          aria-describedby="no-openai-tooltip"
        >
          <Sparkles className="w-4 h-4" />
          {hasThumbnail ? 'Regenerate' : 'Generate'} Thumbnail
        </button>
        
        {/* Tooltip */}
        <div
          id="no-openai-tooltip"
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
        >
          Connect OpenAI in Settings to enable thumbnails
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      </div>
    )
  }

  // Generating state
  if (isGenerating) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-600 text-sm rounded-lg cursor-not-allowed"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Generating...
      </button>
    )
  }

  // Cooldown state
  if (isOnCooldown) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-500 text-sm rounded-lg cursor-not-allowed"
      >
        <Clock className="w-4 h-4" />
        Wait {formatCooldown(cooldownRemaining)}
      </button>
    )
  }

  // Error state
  if (generateThumbnail.isError) {
    return (
      <div className="space-y-1">
        <button
          onClick={handleGenerate}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
        <p className="text-xs text-red-600">Failed to generate. Try again.</p>
      </div>
    )
  }

  // Normal state
  return (
    <button
      onClick={handleGenerate}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
    >
      {hasThumbnail ? (
        <>
          <RefreshCw className="w-4 h-4" />
          Regenerate Thumbnail
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          Generate Thumbnail
        </>
      )}
    </button>
  )
}
