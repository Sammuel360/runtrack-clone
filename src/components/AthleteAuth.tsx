import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  fetchAthleteSession,
  getStoredAthleteSession,
  loginAthlete,
  logoutAthlete,
  signupAthlete,
  type AthleteSession,
} from '../lib/athlete-auth'

type AthleteAuthContextValue = {
  isLoading: boolean
  login: (email: string, password: string) => Promise<AthleteSession>
  logout: () => Promise<void>
  refreshSession: () => Promise<AthleteSession | null>
  session: AthleteSession | null
  signup: (name: string, email: string, password: string) => Promise<AthleteSession>
}

const AthleteAuthContext = createContext<AthleteAuthContextValue | null>(null)

export function AthleteAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AthleteSession | null>(() => getStoredAthleteSession())
  const [isLoading, setIsLoading] = useState(true)

  async function refreshSession() {
    const nextSession = await fetchAthleteSession()
    setSession(nextSession)
    return nextSession
  }

  useEffect(() => {
    void (async () => {
      await refreshSession()
      setIsLoading(false)
    })()
  }, [])

  async function handleLogin(email: string, password: string) {
    const nextSession = await loginAthlete(email, password)
    setSession(nextSession)
    return nextSession
  }

  async function handleSignup(name: string, email: string, password: string) {
    const nextSession = await signupAthlete(name, email, password)
    setSession(nextSession)
    return nextSession
  }

  async function handleLogout() {
    await logoutAthlete()
    setSession(null)
  }

  return (
    <AthleteAuthContext.Provider
      value={{
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        refreshSession,
        session,
        signup: handleSignup,
      }}
    >
      {children}
    </AthleteAuthContext.Provider>
  )
}

export function useAthleteAuth() {
  const context = useContext(AthleteAuthContext)

  if (!context) {
    throw new Error('useAthleteAuth must be used within AthleteAuthProvider')
  }

  return context
}
