import {
  ATHLETE_SESSION_STORAGE_KEY,
  getAthleteOwnerId,
  requestJson,
} from './api-client'

export type AthleteSession = {
  token: string
  athlete: {
    id: string
    name: string
    email: string
  }
}

export function getStoredAthleteSession() {
  try {
    const raw = window.localStorage.getItem(ATHLETE_SESSION_STORAGE_KEY)
    if (!raw) {
      return null
    }

    return JSON.parse(raw) as AthleteSession
  } catch {
    return null
  }
}

export function storeAthleteSession(session: AthleteSession) {
  window.localStorage.setItem(ATHLETE_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearAthleteSession() {
  window.localStorage.removeItem(ATHLETE_SESSION_STORAGE_KEY)
}

export async function signupAthlete(name: string, email: string, password: string) {
  const session = await requestJson<AthleteSession>(
    '/athlete-auth/signup',
    {
      method: 'POST',
      body: JSON.stringify({ name, email, password, ownerId: getAthleteOwnerId() }),
    },
  )

  storeAthleteSession(session)
  return session
}

export async function loginAthlete(email: string, password: string) {
  const session = await requestJson<AthleteSession>(
    '/athlete-auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password, ownerId: getAthleteOwnerId() }),
    },
  )

  storeAthleteSession(session)
  return session
}

export async function fetchAthleteSession() {
  try {
    const session = await requestJson<AthleteSession | null>('/athlete-auth/session', undefined, {
      includeAthleteAuth: true,
    })

    if (session) {
      storeAthleteSession(session)
      return session
    }

    clearAthleteSession()
    return null
  } catch {
    clearAthleteSession()
    return null
  }
}

export async function logoutAthlete() {
  try {
    await requestJson<{ success: boolean }>(
      '/athlete-auth/logout',
      {
        method: 'POST',
      },
      {
        includeAthleteAuth: true,
      },
    )
  } finally {
    clearAthleteSession()
  }
}
