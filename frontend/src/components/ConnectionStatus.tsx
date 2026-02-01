import type { SSEConnectionStatus } from '../api/sse-types'

interface ConnectionStatusProps {
  status: SSEConnectionStatus
  showLabel?: boolean
}

const statusConfig = {
  connected: {
    color: 'bg-green-500',
    pulse: false,
    label: 'Connected',
    tooltip: 'Real-time updates active',
  },
  connecting: {
    color: 'bg-yellow-500',
    pulse: true,
    label: 'Connecting',
    tooltip: 'Connecting to real-time updates...',
  },
  disconnected: {
    color: 'bg-red-500',
    pulse: false,
    label: 'Disconnected',
    tooltip: 'Real-time updates unavailable. Reconnecting automatically...',
  },
}

export function ConnectionStatus({
  status,
  showLabel = false,
}: ConnectionStatusProps) {
  const config = statusConfig[status]

  return (
    <div
      className="flex items-center gap-2"
      title={config.tooltip}
      role="status"
      aria-label={`Connection status: ${config.label}`}
    >
      <span className="relative flex h-3 w-3">
        {config.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-3 w-3 ${config.color}`}
        />
      </span>
      {showLabel && (
        <span className="text-sm text-gray-600">{config.label}</span>
      )}
    </div>
  )
}

export function ConnectionStatusWithMessage({
  status,
}: ConnectionStatusProps) {
  if (status === 'connected') {
    return <ConnectionStatus status={status} />
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
      <ConnectionStatus status={status} />
      <span className="text-sm text-gray-600">
        {status === 'connecting'
          ? 'Connecting...'
          : 'Offline - reconnecting automatically'}
      </span>
    </div>
  )
}
