import { getRaceById, races, type Race, type RaceStatus } from '../data/races'
import { requestJson } from './api-client'

export type RaceMutationValues = {
  name: string
  date: string
  description: string
  distance: number
  featured: boolean
  imageUrl: string
  location: string
  price: number
  status: RaceStatus
  time: string
}

async function withFallback<T>(apiCall: () => Promise<T>, fallback: () => T | Promise<T>) {
  try {
    return await apiCall()
  } catch {
    return await fallback()
  }
}

export async function listPublicRaces() {
  return withFallback(
    () => requestJson<Race[]>('/races'),
    () => races.filter((race) => race.status === 'published'),
  )
}

export async function getPublicRaceById(raceId: string) {
  return withFallback(
    () => requestJson<Race | null>(`/races/${raceId}`),
    () => {
      const race = getRaceById(raceId)
      return race?.status === 'published' ? race : null
    },
  )
}

export async function listOrganizerRaces() {
  return requestJson<Race[]>('/organizer/races', undefined, {
    includeOrganizerAuth: true,
  })
}

export async function createOrganizerRace(values: RaceMutationValues) {
  return requestJson<Race>(
    '/organizer/races',
    {
      method: 'POST',
      body: JSON.stringify(values),
    },
    {
      includeOrganizerAuth: true,
    },
  )
}

export async function updateOrganizerRace(raceId: string, values: RaceMutationValues) {
  return requestJson<Race>(
    `/organizer/races/${raceId}`,
    {
      method: 'PUT',
      body: JSON.stringify(values),
    },
    {
      includeOrganizerAuth: true,
    },
  )
}

export async function deleteOrganizerRace(raceId: string) {
  return requestJson<Race[]>(
    `/organizer/races/${raceId}`,
    {
      method: 'DELETE',
    },
    {
      includeOrganizerAuth: true,
    },
  )
}
