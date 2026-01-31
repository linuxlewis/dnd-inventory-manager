import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add passphrase header
// Note: getPassphrase will be properly implemented in FE-004
let getPassphraseForSlug: ((slug: string) => string | null) | null = null

export function setPassphraseGetter(getter: (slug: string) => string | null) {
  getPassphraseForSlug = getter
}

apiClient.interceptors.request.use((config) => {
  // Extract slug from URL if present (e.g., /api/inventories/{slug})
  const urlMatch = config.url?.match(/\/api\/inventories\/([^/]+)/)
  if (urlMatch && getPassphraseForSlug) {
    const slug = urlMatch[1]
    const passphrase = getPassphraseForSlug(slug)
    if (passphrase) {
      config.headers['X-Passphrase'] = passphrase
    }
  }
  return config
})

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized - invalid or missing passphrase')
      // Full handling will be implemented in FE-004
    }
    return Promise.reject(error)
  }
)
