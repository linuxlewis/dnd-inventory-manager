import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateInventory } from '../api/inventories'
import { useAuth } from '../hooks/useAuth'

interface FormErrors {
  name?: string
  passphrase?: string
  confirmPassphrase?: string
  general?: string
}

export function Home() {
  const navigate = useNavigate()
  const { setSession } = useAuth()
  const createInventory = useCreateInventory()

  const [name, setName] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [confirmPassphrase, setConfirmPassphrase] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!name.trim()) {
      newErrors.name = 'Party name is required'
    }

    if (!passphrase) {
      newErrors.passphrase = 'Passphrase is required'
    } else if (passphrase.length < 6) {
      newErrors.passphrase = 'Passphrase must be at least 6 characters'
    }

    if (passphrase !== confirmPassphrase) {
      newErrors.confirmPassphrase = 'Passphrases do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const inventory = await createInventory.mutateAsync({
        name: name.trim(),
        passphrase,
        description: description.trim() || undefined,
      })

      // Save session and navigate
      setSession(inventory.slug, passphrase)
      navigate(`/${inventory.slug}`)
    } catch {
      setErrors({
        general: 'Failed to create inventory. Please try again.',
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          D&D Party Inventory Manager
        </h1>
        <p className="text-lg text-gray-600">
          Keep track of your party's loot, equipment, and gold. Share with your
          fellow adventurers using a simple passphrase.
        </p>
      </section>

      {/* Create New Inventory Section */}
      <section className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Create New Inventory
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.general}
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Party Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="The Mighty Nein"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="passphrase"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Passphrase <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.passphrase ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Min 6 characters"
            />
            {errors.passphrase && (
              <p className="mt-1 text-sm text-red-500">{errors.passphrase}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassphrase"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Passphrase <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="confirmPassphrase"
              value={confirmPassphrase}
              onChange={(e) => setConfirmPassphrase(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.confirmPassphrase ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Confirm your passphrase"
            />
            {errors.confirmPassphrase && (
              <p className="mt-1 text-sm text-red-500">
                {errors.confirmPassphrase}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Campaign notes, party details, etc."
            />
          </div>

          <button
            type="submit"
            disabled={createInventory.isPending}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createInventory.isPending ? 'Creating...' : 'Create Inventory'}
          </button>
        </form>
      </section>
    </div>
  )
}
