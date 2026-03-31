import { ORGANIZER_SESSION_STORAGE_KEY, requestJson } from './api-client'

export type OrganizerSession = {
  token: string
  organizer: {
    id: string
    name: string
    email: string
  }
}

export function getStoredOrganizerSession() {
  try {
    const raw = window.localStorage.getItem(ORGANIZER_SESSION_STORAGE_KEY)
    if (!raw) {
      return null
    }

    return JSON.parse(raw) as OrganizerSession
  } catch {
    return null
  }
}

export function storeOrganizerSession(session: OrganizerSession) {
  window.localStorage.setItem(ORGANIZER_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearOrganizerSession() {
  window.localStorage.removeItem(ORGANIZER_SESSION_STORAGE_KEY)
}

export async function loginOrganizer(email: string, password: string) {
  const session = await requestJson<OrganizerSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  storeOrganizerSession(session)
  return session
}

export async function fetchOrganizerSession() {
  try {
    const session = await requestJson<OrganizerSession | null>('/auth/session', undefined, {
      includeOrganizerAuth: true,
    })

    if (session) {
      storeOrganizerSession(session)
      return session
    }

    clearOrganizerSession()
    return null
  } catch {
    clearOrganizerSession()
    return null
  }
}

export async function logoutOrganizer() {
  try {
    await requestJson<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    }, {
      includeOrganizerAuth: true,
    })
  } finally {
    clearOrganizerSession()
  }
}
