import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { apiClient } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { useAuthenticateInventory } from '../api/inventories'
import type { InventoryResponse } from '../api/types'
import { AxiosError } from 'axios'

export function Inventory() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { hasSession, setSession, clearSession } = useAuth()
  const authenticateInventory = useAuthenticateInventory()

  const [passphrase, setPassphrase] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const isAuthenticated = slug ? hasSession(slug) : false

  const {
    data: inventory,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['inventory', slug],
    queryFn: async () => {
      const response = await apiClient.get<InventoryResponse>(`/api/inventories/${slug}`)
      return response.data
    },
    enabled: !!slug && isAuthenticated,
    retry: false,
  })

  // Redirect to home if no slug
  useEffect(() => {
    if (!slug) {
      navigate('/')
    }
  }, [slug, navigate])

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!slug || !passphrase) {
      setAuthError('Please enter a passphrase')
      return
    }

    try {
      const result = await authenticateInventory.mutateAsync({
        slug,
        passphrase,
      })

      if (result.success) {
        setSession(slug, passphrase)
        setAuthError(null)
      } else {
        setAuthError('Invalid passphrase')
      }
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 404) {
        setAuthError('Inventory not found')
      } else {
        setAuthError('Failed to authenticate. Please try again.')
      }
    }
  }

  // Show passphrase prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Inventory
          </h1>
          <p className="text-gray-600 mb-6">
            Enter the passphrase for <span className="font-mono bg-gray-100 px-2 py-1 rounded">{slug}</span>
          </p>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authError && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {authError}
              </div>
            )}

            <div>
              <label
                htmlFor="passphrase"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Passphrase
              </label>
              <div className="relative">
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  id="passphrase"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter passphrase"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
                >
                  {showPassphrase ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authenticateInventory.isPending}
              className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {authenticateInventory.isPending ? 'Authenticating...' : 'Access'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-indigo-600 hover:text-indigo-800 text-sm"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Loading inventory...</p>
      </div>
    )
  }

  // Show error state
  if (error) {
    const errorMessage = error instanceof AxiosError && error.response?.status === 401
      ? 'Session expired. Please re-authenticate.'
      : 'Failed to load inventory.'

    return (
      <div className="max-w-md mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">{errorMessage}</p>
          <button
            onClick={() => {
              if (slug) {
                clearSession(slug)
              }
            }}
            className="mt-4 text-indigo-600 hover:text-indigo-800"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  // Show inventory content
  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {inventory?.name}
        </h1>
        {inventory?.description && (
          <p className="text-gray-600">{inventory.description}</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Treasury</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-amber-100 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-amber-800">{inventory?.copper ?? 0}</p>
            <p className="text-sm text-amber-600">Copper</p>
          </div>
          <div className="bg-gray-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-gray-700">{inventory?.silver ?? 0}</p>
            <p className="text-sm text-gray-500">Silver</p>
          </div>
          <div className="bg-yellow-100 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">{inventory?.gold ?? 0}</p>
            <p className="text-sm text-yellow-600">Gold</p>
          </div>
          <div className="bg-slate-200 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-slate-700">{inventory?.platinum ?? 0}</p>
            <p className="text-sm text-slate-500">Platinum</p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-gray-500 text-sm">
        Inventory items will be added in Phase 2.
      </p>
    </div>
  )
}
