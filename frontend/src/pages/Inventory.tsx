import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { apiClient } from '../api/client'
import { useCurrency, useUpdateCurrency } from '../api/currency'
import { useAuth } from '../hooks/useAuth'
import { useRecentInventories } from '../hooks/useRecentInventories'
import { useAuthenticateInventory } from '../api/inventories'
import type { InventoryResponse, Item } from '../api/types'
import { ItemsList, ItemDetail, AddItemModal, EditItemModal } from '../components/items'
import { TreasuryWidget } from '../components/currency/TreasuryWidget'
import { CurrencyModal } from '../components/currency/CurrencyModal'
import { HistoryPanel } from '../components/history'
import { AxiosError } from 'axios'

export function Inventory() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { hasSession, setSession, clearSession } = useAuth()
  const authenticateInventory = useAuthenticateInventory()

  const [passphrase, setPassphrase] = useState('')
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Items UI state
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Currency modal state
  const [showAddFundsModal, setShowAddFundsModal] = useState(false)
  const [showSpendModal, setShowSpendModal] = useState(false)

  const { addRecent } = useRecentInventories()

  const isAuthenticated = slug ? hasSession(slug) : false

  // Currency data and mutations
  const { data: currency, isLoading: currencyLoading } = useCurrency(isAuthenticated ? slug : undefined)
  const updateCurrency = useUpdateCurrency(isAuthenticated ? slug : undefined)

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

  // Track recently accessed inventory
  useEffect(() => {
    if (isAuthenticated && inventory && slug) {
      addRecent(slug, inventory.name)
    }
  }, [isAuthenticated, inventory, slug, addRecent])

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
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-100 mb-2">
            Access Inventory
          </h1>
          <p className="text-gray-400 mb-6">
            Enter the passphrase for <span className="font-mono bg-gray-700 px-2 py-1 rounded">{slug}</span>
          </p>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authError && (
              <div className="p-3 bg-red-900/30 border border-red-500 text-red-400 rounded">
                {authError}
              </div>
            )}

            <div>
              <label
                htmlFor="passphrase"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Passphrase
              </label>
              <div className="relative">
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  id="passphrase"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full px-3 py-2 pr-10 bg-gray-700 text-gray-100 placeholder-gray-400 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
                  placeholder="Enter passphrase"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
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
              className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {authenticateInventory.isPending ? 'Authenticating...' : 'Access'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-indigo-400 hover:text-indigo-300 text-sm"
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
        <p className="mt-4 text-gray-400">Loading inventory...</p>
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
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-6 text-center">
          <p className="text-red-400">{errorMessage}</p>
          <button
            onClick={() => {
              if (slug) {
                clearSession(slug)
              }
            }}
            className="mt-4 text-indigo-400 hover:text-indigo-300"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  // Handlers for item interactions
  const handleItemClick = (item: Item) => {
    setSelectedItem(item)
  }

  const handleEditItem = () => {
    setShowEditModal(true)
  }

  const handleCloseDetail = () => {
    setSelectedItem(null)
  }

  const handleCloseEdit = () => {
    setShowEditModal(false)
  }

  // Show inventory content
  return (
    <div>
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">
          {inventory?.name}
        </h1>
        {inventory?.description && (
          <p className="text-gray-400">{inventory.description}</p>
        )}
      </div>

      {/* Treasury Widget */}
      <TreasuryWidget
        currency={currency}
        isLoading={currencyLoading}
        isMutating={updateCurrency.isPending}
        onAddFunds={() => setShowAddFundsModal(true)}
        onSpend={() => setShowSpendModal(true)}
      />

      {/* Activity Log */}
      {slug && (
        <div className="mt-6 mb-6">
          <HistoryPanel slug={slug} />
        </div>
      )}

      {/* Items Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Items</h2>
        {slug && (
          <ItemsList
            slug={slug}
            onItemClick={handleItemClick}
            onAddClick={() => setShowAddModal(true)}
          />
        )}
      </div>

      {/* Item Modals */}
      {slug && (
        <AddItemModal
          slug={slug}
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {selectedItem && slug && (
        <>
          <ItemDetail
            item={selectedItem}
            slug={slug}
            isOpen={!showEditModal}
            onClose={handleCloseDetail}
            onEdit={handleEditItem}
          />
          <EditItemModal
            item={selectedItem}
            slug={slug}
            isOpen={showEditModal}
            onClose={handleCloseEdit}
          />
        </>
      )}

      {/* Currency Modals */}
      {slug && (
        <>
          <CurrencyModal
            slug={slug}
            mode="add"
            isOpen={showAddFundsModal}
            onClose={() => setShowAddFundsModal(false)}
            currentCurrency={currency}
          />
          <CurrencyModal
            slug={slug}
            mode="spend"
            isOpen={showSpendModal}
            onClose={() => setShowSpendModal(false)}
            currentCurrency={currency}
          />
        </>
      )}
    </div>
  )
}
