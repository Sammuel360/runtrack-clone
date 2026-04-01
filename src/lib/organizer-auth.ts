import { requestJson } from './api-client'

export type OrganizerSession = {
  token: string
  organizer: {
    id: string
    name: string
    email: string
  }
}

export async function loginOrganizer(email: string, password: string) {
  return requestJson<OrganizerSession>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
    {
      includeCredentials: true,
    },
  )
}

export async function fetchOrganizerSession() {
  try {
    return await requestJson<OrganizerSession | null>('/auth/session', undefined, {
      includeOrganizerAuth: true,
    })
  } catch {
    return null
  }
}

export async function logoutOrganizer() {
  await requestJson<{ success: boolean }>(
    '/auth/logout',
    {
      method: 'POST',
    },
    {
      includeOrganizerAuth: true,
    },
  )
}
