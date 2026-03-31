import { useEffect, useState } from 'react'
import { Calendar, Search, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { RaceCard } from '../components/RaceCard'
import { SiteLayout, usePageMeta } from '../components/Layout'
import type { Race } from '../data/races'
import { listPublicRaces } from '../lib/races-api'
import {
  getDistanceFilterMatch,
  raceDistanceFilters,
  sortOptions,
  sortRaces,
  type DistanceFilter,
  type SortOption,
} from '../lib/race-utils'

export function RacesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '')
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>(
    (searchParams.get('distance') as DistanceFilter) || 'all',
  )
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'date',
  )
  const [catalogRaces, setCatalogRaces] = useState<Race[]>([])
  const [isLoading, setIsLoading] = useState(true)

  usePageMeta(
    'RunTrack | Catalogo de corridas',
    'Busque corridas por nome, cidade, distancia e preco. Gere inscricoes, pagamentos e demanda qualificada para eventos esportivos.',
  )

  useEffect(() => {
    const params = new URLSearchParams()

    if (searchTerm.trim()) {
      params.set('search', searchTerm.trim())
    }

    if (distanceFilter !== 'all') {
      params.set('distance', distanceFilter)
    }

    if (sortBy !== 'date') {
      params.set('sort', sortBy)
    }

    setSearchParams(params, { replace: true })
  }, [distanceFilter, searchTerm, setSearchParams, sortBy])

  useEffect(() => {
    let active = true

    void (async () => {
      const nextRaces = await listPublicRaces()

      if (!active) {
        return
      }

      setCatalogRaces(nextRaces)
      setIsLoading(false)
    })()

    return () => {
      active = false
    }
  }, [])

  const filteredRaces = sortRaces(
    catalogRaces.filter((race) => {
      const haystack = `${race.name} ${race.location} ${race.description}`.toLowerCase()
      const matchesSearch = !searchTerm.trim() || haystack.includes(searchTerm.trim().toLowerCase())
      const matchesDistance = getDistanceFilterMatch(race, distanceFilter)

      return matchesSearch && matchesDistance
    }),
    sortBy,
  )

  function resetFilters() {
    setSearchTerm('')
    setDistanceFilter('all')
    setSortBy('date')
  }

  return (
    <SiteLayout>
      <section className="page-hero">
        <div className="container page-hero__content">
          <span className="section-eyebrow">Catalogo funcional</span>
          <h1>Encontre a corrida ideal para cada perfil</h1>
          <p>
            Agora o site ja oferece busca, filtros e ordenacao para transformar visita em
            inscricao real com continuidade operacional.
          </p>
        </div>
      </section>

      <section className="section section--compact">
        <div className="container">
          <div className="filters-shell">
            <div className="filters-shell__header">
              <div>
                <span className="section-eyebrow">Filtros</span>
                <h2>Refine o catalogo</h2>
              </div>
              <span className="results-count">{filteredRaces.length} resultado(s)</span>
            </div>

            <div className="filters-grid">
              <label className="filter-control filter-control--search">
                <Search size={18} />
                <input
                  placeholder="Buscar por nome, cidade ou tipo de corrida"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>

              <label className="filter-control">
                <SlidersHorizontal size={18} />
                <select
                  value={distanceFilter}
                  onChange={(event) => setDistanceFilter(event.target.value as DistanceFilter)}
                >
                  {raceDistanceFilters.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="filter-control">
                <Calendar size={18} />
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortOption)}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <button className="button button--ghost" type="button" onClick={resetFilters}>
                Limpar filtros
              </button>
            </div>
          </div>

          {isLoading ? (
            <article className="panel empty-panel">
              <h2>Carregando corridas</h2>
              <p>Buscando o catalogo publicado no backend.</p>
            </article>
          ) : filteredRaces.length === 0 ? (
            <article className="panel empty-panel">
              <h2>Nenhuma corrida encontrada</h2>
              <p>
                Ajuste os filtros ou limpe a busca para visualizar novamente todas as opcoes.
              </p>
              <button className="button button--secondary" type="button" onClick={resetFilters}>
                Mostrar todas as corridas
              </button>
            </article>
          ) : (
            <div className="race-grid">
              {filteredRaces.map((race) => (
                <RaceCard key={race.id} race={race} />
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  )
}
