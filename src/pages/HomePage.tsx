import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { RaceCard } from '../components/RaceCard'
import { SectionHeader, SiteLayout, usePageMeta } from '../components/Layout'
import type { Race } from '../data/races'
import {
  athleteValueProps,
  featureHighlights,
  heroBenefits,
  organizerBenefits,
  processSteps,
} from '../data/site-content'
import { listPublicRaces } from '../lib/races-api'
import { raceDistanceFilters, type DistanceFilter } from '../lib/race-utils'

export function HomePage() {
  const navigate = useNavigate()
  const [quickSearch, setQuickSearch] = useState('')
  const [quickDistance, setQuickDistance] = useState<DistanceFilter>('all')
  const [catalogRaces, setCatalogRaces] = useState<Race[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  const cityCount = new Set(catalogRaces.map((race) => race.location)).size
  const featuredRaces = catalogRaces.filter((race) => race.featured).slice(0, 3)

  usePageMeta(
    'RunTrack | Descubra corridas e feche inscricoes',
    'Encontre corridas, filtre por perfil e transforme visitas em inscricoes, pagamentos e contatos qualificados para organizadores.',
  )

  function handleQuickSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const params = new URLSearchParams()
    if (quickSearch.trim()) {
      params.set('search', quickSearch.trim())
    }
    if (quickDistance !== 'all') {
      params.set('distance', quickDistance)
    }

    navigate(`/races${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <SiteLayout>
      <section className="hero-section">
        <img
          className="hero-image"
          src="/images/hero.jpg"
          alt="Corredores participando de uma prova de rua"
        />
        <div className="hero-overlay" />

        <div className="container hero-content">
          <div className="hero-copy">
            <span className="hero-kicker">Plataforma para atletas e organizadores</span>
            <h1>Descubra corridas, conclua inscricoes e opere eventos em um so lugar</h1>
            <p>
              O RunTrack agora conecta descoberta, pagamento, disparos operacionais e visao
              de painel para quem organiza cada prova.
            </p>

            <form className="hero-search" onSubmit={handleQuickSearchSubmit}>
              <label className="hero-search__field">
                <Search size={18} />
                <input
                  aria-label="Buscar corrida"
                  placeholder="Busque por cidade, nome da prova ou distancia"
                  value={quickSearch}
                  onChange={(event) => setQuickSearch(event.target.value)}
                />
              </label>

              <label className="hero-search__select">
                <span className="sr-only">Filtrar distancia</span>
                <select
                  value={quickDistance}
                  onChange={(event) => setQuickDistance(event.target.value as DistanceFilter)}
                >
                  {raceDistanceFilters.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </label>

              <button className="button button--primary hero-search__button" type="submit">
                <span>Explorar corridas</span>
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="hero-benefits">
              {heroBenefits.map((benefit) => (
                <span className="hero-benefit" key={benefit.label}>
                  <benefit.icon size={16} />
                  <span>{benefit.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="metrics-strip">
        <div className="container metrics-grid">
          <article className="metric-card">
            <strong>{catalogRaces.length} eventos</strong>
            <span>catalogados para o MVP</span>
          </article>
          <article className="metric-card">
            <strong>{cityCount} localidades</strong>
            <span>com provas e oportunidades de expansao</span>
          </article>
          <article className="metric-card">
            <strong>2 frentes</strong>
            <span>atletas buscando provas e organizadores captando demanda</span>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow="Ideia melhorada"
            title="Mais do que um catalogo: um funil de aquisicao para o ecossistema de corrida"
            description="O site deixa de ser apenas uma vitrine e passa a operar como descoberta, inscricao, pagamento e captacao comercial."
          />

          <div className="feature-grid">
            {featureHighlights.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <span className="feature-icon">
                  <feature.icon size={26} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <SectionHeader
            eyebrow="Fluxo do produto"
            title="Como o MVP funciona agora"
            description="A experiencia ja esta pronta para discovery, pagamento e acompanhamento operacional com backend proprio, sem depender do site antigo."
          />

          <div className="process-grid">
            {processSteps.map((step) => (
              <article className="process-card" key={step.title}>
                <span className="feature-icon">
                  <step.icon size={24} />
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container dual-panel">
          <article className="panel callout-panel">
            <span className="section-eyebrow">Para atletas</span>
            <h2>Escolha uma prova e confirme a inscricao no mesmo fluxo</h2>
            <ul className="bullet-list">
              {athleteValueProps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link className="button button--secondary" to="/races">
              Ver corridas disponiveis
            </Link>
          </article>

          <article className="panel callout-panel callout-panel--highlight">
            <span className="section-eyebrow">Para organizadores</span>
            <h2>Use o site como canal de vendas, operacao e parcerias</h2>
            <ul className="bullet-list">
              {organizerBenefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
            <Link className="button button--primary" to="/organizer">
              Abrir painel do organizador
            </Link>
          </article>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <SectionHeader
            eyebrow="Destaques"
            title="Corridas em destaque"
            description="Alguns eventos prontos para ativar o fluxo de inscricao, pagamento e acompanhamento do usuario."
          />

          <div className="race-grid race-grid--featured">
            {isLoading ? (
              <article className="panel empty-panel">
                <h2>Carregando destaques</h2>
                <p>Buscando as corridas publicadas mais recentes.</p>
              </article>
            ) : featuredRaces.length === 0 ? (
              <article className="panel empty-panel">
                <h2>Nenhum destaque publicado</h2>
                <p>Assim que houver eventos em destaque, eles aparecerao aqui.</p>
              </article>
            ) : (
              featuredRaces.map((race) => <RaceCard key={race.id} race={race} />)
            )}
          </div>

          <div className="section-cta">
            <Link className="button button--secondary" to="/races">
              <span>Ver todas as corridas</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
