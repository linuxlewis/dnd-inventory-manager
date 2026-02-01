import { Users } from 'lucide-react'

interface ViewerCountProps {
  count: number
}

export function ViewerCount({ count }: ViewerCountProps) {
  // Hide if count is 1 (just me) or 0 (not connected)
  if (count <= 1) return null

  return (
    <div
      className="flex items-center gap-1.5 text-sm text-gray-600"
      title={`${count} party members currently viewing this inventory`}
    >
      <Users className="w-4 h-4" />
      <span>{count} party members viewing</span>
    </div>
  )
}
