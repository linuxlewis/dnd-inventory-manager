import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Settings as SettingsIcon, Sparkles, AlertTriangle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { OpenAIConnection } from '../components/settings/OpenAIConnection'

export function Settings() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { hasSession } = useAuth()

  const isAuthenticated = slug ? hasSession(slug) : false

  // Redirect to inventory page if not authenticated
  useEffect(() => {
    if (slug && !isAuthenticated) {
      navigate(`/${slug}`)
    }
  }, [slug, isAuthenticated, navigate])

  if (!slug || !isAuthenticated) {
    return null
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/${slug}`}
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Inventory
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8" />
          Settings
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your inventory configuration
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* General Section */}
        <section className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              General
            </h2>
          </div>
          <div className="p-6">
            <p className="text-gray-500 text-sm">
              General settings will be available in a future update.
            </p>
          </div>
        </section>

        {/* OpenAI Integration Section */}
        <section className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Thumbnails
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Connect your OpenAI API key to generate AI-powered item thumbnails
            </p>
          </div>
          <div className="p-6">
            <OpenAIConnection slug={slug} />
          </div>
        </section>

        {/* Danger Zone Section */}
        <section className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-red-200">
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <h2 className="text-lg font-semibold text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h2>
          </div>
          <div className="p-6">
            <p className="text-gray-500 text-sm">
              Destructive actions will be available in a future update.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
