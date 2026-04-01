import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { OperatorLayout } from './Layout'
import {
  fetchOrganizerSession,
  loginOrganizer,
  logoutOrganizer,
  type OrganizerSession,
} from '../lib/organizer-auth'

type OrganizerAuthContextValue = {
  isLoading: boolean
  login: (email: string, password: string) => Promise<OrganizerSession>
  logout: () => Promise<void>
  refreshSession: () => Promise<OrganizerSession | null>
  session: OrganizerSession | null
}

const OrganizerAuthContext = createContext<OrganizerAuthContextValue | null>(null)

export function OrganizerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<OrganizerSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function refreshSession() {
    const nextSession = await fetchOrganizerSession()
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
    const nextSession = await loginOrganizer(email, password)
    setSession(nextSession)
    return nextSession
  }

  async function handleLogout() {
    await logoutOrganizer()
    setSession(null)
  }

  return (
    <OrganizerAuthContext.Provider
      value={{
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        refreshSession,
        session,
      }}
    >
      {children}
    </OrganizerAuthContext.Provider>
  )
}

export function useOrganizerAuth() {
  const context = useContext(OrganizerAuthContext)

  if (!context) {
    throw new Error('useOrganizerAuth must be used within OrganizerAuthProvider')
  }

  return context
}

export function OrganizerProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoading, session } = useOrganizerAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <OperatorLayout>
        <section className="section section--compact">
          <div className="container">
            <article className="panel confirmation-empty">
              <h1>Carregando acesso do organizador</h1>
              <p>Validando sua sessao antes de abrir o painel.</p>
            </article>
          </div>
        </section>
      </OperatorLayout>
    )
  }

  if (!session) {
    return (
      <Navigate
        replace
        to={`/organizer/login?redirect=${encodeURIComponent(
          `${location.pathname}${location.search}`,
        )}`}
      />
    )
  }

  return <>{children}</>
}
