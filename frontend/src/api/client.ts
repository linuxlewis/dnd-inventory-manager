import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add passphrase header
apiClient.interceptors.request.use((config) => {
  // Extract slug from URL if present (e.g., /api/inventories/{slug})
  const urlMatch = config.url?.match(/\/api\/inventories\/([^/]+)/)
  if (urlMatch) {
    const slug = urlMatch[1]
    // Skip auth header for the auth endpoint itself
    if (!config.url?.endsWith('/auth')) {
      const passphrase = useAuthStore.getState().getPassphrase(slug)
      if (passphrase) {
        config.headers['X-Passphrase'] = passphrase
      }
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
      // Could clear the session here if desired
      const urlMatch = error.config?.url?.match(/\/api\/inventories\/([^/]+)/)
      if (urlMatch) {
        const slug = urlMatch[1]
        useAuthStore.getState().clearSession(slug)
      }
    }
    return Promise.reject(error)
  }
)
