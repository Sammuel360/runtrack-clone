const ATHLETE_OWNER_STORAGE_KEY = 'runtrack-athlete-owner-id'
export const ATHLETE_SESSION_STORAGE_KEY = 'runtrack-athlete-session'
export const ORGANIZER_SESSION_STORAGE_KEY = 'runtrack-organizer-session'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function resolveApiBase() {
  const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim()

  if (configuredBase) {
    return configuredBase
  }

  if (typeof window !== 'undefined') {
    const { hostname, protocol, port } = window.location
    const isLocalHost = hostname === '127.0.0.1' || hostname === 'localhost'

    if (isLocalHost && port !== '8787') {
      return `${protocol}//${hostname}:8787/api`
    }
  }

  return '/api'
}

export function getAthleteOwnerId() {
  const currentId = window.localStorage.getItem(ATHLETE_OWNER_STORAGE_KEY)

  if (currentId) {
    return currentId
  }

  const nextId = crypto.randomUUID()
  window.localStorage.setItem(ATHLETE_OWNER_STORAGE_KEY, nextId)
  return nextId
}

export function getStoredOrganizerAuthToken() {
  try {
    const raw = window.localStorage.getItem(ORGANIZER_SESSION_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as { token?: string }
    return typeof parsed.token === 'string' && parsed.token ? parsed.token : null
  } catch {
    return null
  }
}

export function getStoredAthleteAuthToken() {
  try {
    const raw = window.localStorage.getItem(ATHLETE_SESSION_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as { token?: string }
    return typeof parsed.token === 'string' && parsed.token ? parsed.token : null
  } catch {
    return null
  }
}

export async function requestJson<T>(
  path: string,
  init?: RequestInit,
  options?: {
    includeAthleteOwnerId?: boolean
    includeAthleteAuth?: boolean
    includeOrganizerAuth?: boolean
  },
) {
  const headers = new Headers(init?.headers ?? {})

  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (options?.includeAthleteOwnerId) {
    headers.set('x-runtrack-athlete-id', getAthleteOwnerId())
  }

  if (options?.includeAthleteAuth) {
    const athleteToken = getStoredAthleteAuthToken()

    if (athleteToken) {
      headers.set('x-runtrack-athlete-token', athleteToken)
    }
  }

  if (options?.includeOrganizerAuth) {
    const token = getStoredOrganizerAuthToken()

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(`${resolveApiBase()}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`

    try {
      const payload = (await response.json()) as { error?: string }
      if (payload.error) {
        message = payload.error
      }
    } catch {
      // Ignore parsing failures and keep the default message.
    }

    throw new ApiError(message, response.status)
  }

  const payload = (await response.json()) as { data: T }
  return payload.data
}
