import type { Race } from '../data/races'

export const raceDistanceFilters = [
  { value: 'all', label: 'Todas as distancias' },
  { value: 'short', label: 'Sprint e 5K' },
  { value: '10k', label: '10K' },
  { value: 'half', label: 'Meia maratona' },
  { value: 'marathon', label: 'Maratona' },
  { value: 'trail', label: 'Trilha' },
] as const

export const sortOptions = [
  { value: 'date', label: 'Ordenar por data' },
  { value: 'price-asc', label: 'Menor preco' },
  { value: 'price-desc', label: 'Maior preco' },
  { value: 'distance', label: 'Maior distancia' },
] as const

export type DistanceFilter = (typeof raceDistanceFilters)[number]['value']
export type SortOption = (typeof sortOptions)[number]['value']

export function formatCardDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatLongDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2)}`
}

export function getDistanceFilterMatch(race: Race, filter: DistanceFilter) {
  const isTrail = /trilha|trail/i.test(`${race.name} ${race.description}`)

  switch (filter) {
    case 'all':
      return true
    case 'short':
      return race.distance <= 5
    case '10k':
      return race.distance > 5 && race.distance <= 10 && !isTrail
    case 'half':
      return race.distance > 10 && race.distance <= 21.1 && !isTrail
    case 'marathon':
      return race.distance > 21.1
    case 'trail':
      return isTrail
    default:
      return true
  }
}

export function sortRaces(items: Race[], sortBy: SortOption) {
  return [...items].sort((left, right) => {
    if (sortBy === 'price-asc') {
      return left.price - right.price
    }

    if (sortBy === 'price-desc') {
      return right.price - left.price
    }

    if (sortBy === 'distance') {
      return right.distance - left.distance
    }

    return new Date(left.date).getTime() - new Date(right.date).getTime()
  })
}
