import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { useOrganizerAuth } from '../components/OrganizerAuth'
import { OperatorLayout, usePageMeta } from '../components/Layout'

function resolveOrganizerRedirect(rawRedirect: string | null) {
  if (!rawRedirect || !rawRedirect.startsWith('/organizer') || rawRedirect.startsWith('//')) {
    return '/organizer'
  }

  return rawRedirect
}

export function OrganizerLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, session } = useOrganizerAuth()
  const isDevelopment = import.meta.env.DEV
  const [email, setEmail] = useState(isDevelopment ? 'organizer@runtrack.local' : '')
  const [password, setPassword] = useState(isDevelopment ? 'runtrack123' : '')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = resolveOrganizerRedirect(searchParams.get('redirect'))

  usePageMeta(
    'RunTrack | Login do organizador',
    'Acesse o painel do organizador para gerenciar corridas, leads e operacao do evento.',
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel entrar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (session) {
    return <Navigate replace to={redirectTo} />
  }

  return (
    <OperatorLayout>
      <section className="operator-login">
        <div className="container container--wide">
          <div className="row g-4 operator-login__grid">
            <div className="col-12 col-xl-7">
              <article className="operator-login__panel h-100">
                <span className="section-eyebrow">Acesso do organizador</span>
                <h1>Entrar no centro de operacoes</h1>
                <p className="panel-intro">
                  Ambiente separado da jornada do atleta para controlar eventos, receita, fila
                  operacional, check-in e campanhas.
                </p>

                {errorMessage ? <div className="success-note success-note--error">{errorMessage}</div> : null}

                <form className="contact-form" onSubmit={handleSubmit}>
                  <label className="field">
                    <span>Email</span>
                    <input
                      className="input"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>

                  <label className="field">
                    <span>Senha</span>
                    <input
                      className="input"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </label>

                  <button className="button button--primary" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Entrando...' : 'Entrar no painel'}
                  </button>
                </form>
              </article>
            </div>

            <div className="col-12 col-xl-5">
              <aside className="operator-login__support h-100">
                <article className="operator-login__brief">
                  <span className="operator-login__brief-label">Ambiente de backoffice</span>
                  <h2>Separado da experiencia do cliente</h2>
                  <p>
                    O operador acompanha operacao diaria, mensagens, pagamentos e publicacao de eventos
                    sem misturar a interface administrativa com a area do atleta.
                  </p>
                </article>

                {isDevelopment ? (
                  <article className="operator-login__card">
                    <h3>Credencial local do ambiente</h3>
                    <div className="dashboard-list-item__meta">
                      <span>organizer@runtrack.local</span>
                      <span>runtrack123</span>
                    </div>
                    <p className="panel-intro">
                      Depois podemos trocar por usuarios reais, reset de senha, perfis e niveis de permissao.
                    </p>
                  </article>
                ) : null}

                <article className="operator-login__card operator-login__card--soft">
                  <h3>O que voce libera</h3>
                  <ul className="bullet-list">
                    <li>Visao completa do funil operacional da prova.</li>
                    <li>Gestao de catalogo, cupons, integracoes e campanhas.</li>
                    <li>Controle de check-in, kit, leads e comunicacao transacional.</li>
                  </ul>
                </article>
              </aside>
            </div>
          </div>
        </div>
      </section>
    </OperatorLayout>
  )
}
