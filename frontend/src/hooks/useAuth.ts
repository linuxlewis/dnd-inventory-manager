import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const sessions = useAuthStore((state) => state.sessions)
  const setSession = useAuthStore((state) => state.setSession)
  const clearSession = useAuthStore((state) => state.clearSession)
  const getPassphrase = useAuthStore((state) => state.getPassphrase)
  const hasSession = useAuthStore((state) => state.hasSession)

  return {
    sessions,
    setSession,
    clearSession,
    getPassphrase,
    hasSession,
  }
}
