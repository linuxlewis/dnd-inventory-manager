import { useState } from 'react'
import { Eye, EyeOff, Check, X, Loader2, Unplug, Plug, TestTube } from 'lucide-react'
import { useOpenAIStatus, useTestOpenAIKey, useConnectOpenAI, useDisconnectOpenAI } from '../../api/openai'

interface OpenAIConnectionProps {
  slug: string
}

export function OpenAIConnection({ slug }: OpenAIConnectionProps) {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [connectError, setConnectError] = useState<string | null>(null)

  const { data: status, isLoading: statusLoading, error: statusError } = useOpenAIStatus(slug)
  const testKey = useTestOpenAIKey()
  const connectOpenAI = useConnectOpenAI()
  const disconnectOpenAI = useDisconnectOpenAI()

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter an API key' })
      return
    }

    setTestResult(null)
    setConnectError(null)

    try {
      const result = await testKey.mutateAsync({ slug, apiKey })
      setTestResult({
        success: result.success,
        message: result.success ? 'API key is valid!' : (result.message || 'Invalid API key'),
      })
    } catch {
      setTestResult({ success: false, message: 'Failed to test API key' })
    }
  }

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setConnectError('Please enter an API key')
      return
    }

    // Require successful test before connecting
    if (!testResult?.success) {
      setConnectError('Please test your API key before saving')
      return
    }

    setConnectError(null)

    try {
      await connectOpenAI.mutateAsync({ slug, apiKey })
      setApiKey('')
      setTestResult(null)
    } catch {
      setConnectError('Failed to save API key')
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect OpenAI? This will disable AI thumbnail generation.')) {
      return
    }

    try {
      await disconnectOpenAI.mutateAsync(slug)
    } catch {
      // Error is handled by the mutation
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    )
  }

  if (statusError) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">
          Unable to load OpenAI status. The feature may not be available yet.
        </p>
      </div>
    )
  }

  // Connected state
  if (status?.connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex-shrink-0">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-grow">
            <p className="font-medium text-green-800">OpenAI Connected</p>
            {status.last_used_at && (
              <p className="text-sm text-green-600">
                Last used: {formatDate(status.last_used_at)}
              </p>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Your API key is securely stored. AI thumbnail generation is enabled for this inventory.
        </p>

        <button
          onClick={handleDisconnect}
          disabled={disconnectOpenAI.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {disconnectOpenAI.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Unplug className="w-4 h-4" />
          )}
          Disconnect
        </button>
      </div>
    )
  }

  // Not connected state
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex-shrink-0">
          <X className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <p className="font-medium text-gray-700">Not Connected</p>
          <p className="text-sm text-gray-500">
            Connect your OpenAI API key to enable AI-generated thumbnails
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">
          OpenAI API Key
        </label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            id="api-key"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value)
              setTestResult(null)
              setConnectError(null)
            }}
            placeholder="sk-..."
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
            aria-label={showKey ? 'Hide API key' : 'Show API key'}
          >
            {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Your API key will be encrypted and stored securely. 
          Get your API key from{' '}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 underline"
          >
            OpenAI Platform
          </a>
        </p>
      </div>

      {/* Test Result */}
      {testResult && (
        <div
          className={`p-3 rounded-lg ${
            testResult.success
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
            <span className="text-sm">{testResult.message}</span>
          </div>
        </div>
      )}

      {/* Connect Error */}
      {connectError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <div className="flex items-center gap-2">
            <X className="w-4 h-4" />
            <span className="text-sm">{connectError}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleTest}
          disabled={testKey.isPending || !apiKey.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {testKey.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <TestTube className="w-4 h-4" />
          )}
          Test Key
        </button>

        <button
          onClick={handleConnect}
          disabled={connectOpenAI.isPending || !apiKey.trim() || !testResult?.success}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {connectOpenAI.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plug className="w-4 h-4" />
          )}
          Save & Connect
        </button>
      </div>
    </div>
  )
}
