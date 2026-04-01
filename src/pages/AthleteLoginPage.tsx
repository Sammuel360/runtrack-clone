import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { useAthleteAuth } from '../components/AthleteAuth'
import { SiteLayout, usePageMeta } from '../components/Layout'

type Mode = 'login' | 'signup'

export function AthleteLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/my-registrations'
  const { isLoading, login, session, signup } = useAthleteAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  usePageMeta(
    'RunTrack | Login do atleta',
    'Entre na sua conta para sincronizar inscricoes, pagamentos e acompanhamento do evento na nuvem.',
  )

  useEffect(() => {
    if (!isLoading && session) {
      navigate(redirectTo, { replace: true })
    }
  }, [isLoading, navigate, redirectTo, session])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      if (mode === 'signup') {
        await signup(name.trim(), email.trim(), password)
      } else {
        await login(email.trim(), password)
      }

      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel autenticar sua conta.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SiteLayout>
      <section className="section section--compact">
        <div className="container auth-panel-grid">
          <article className="panel auth-panel">
            <span className="section-eyebrow">Conta do atleta</span>
            <h1>{mode === 'login' ? 'Entrar para sincronizar inscricoes' : 'Criar conta na nuvem'}</h1>
            <p className="panel-intro">
              Sua conta conecta inscricoes, comprovantes e futuros check-ins ao mesmo historico,
              mesmo quando voce troca de navegador ou dispositivo.
            </p>

            <div className="segmented-control" role="tablist" aria-label="Modo de autenticacao">
              <button
                className={`segmented-control__item${
                  mode === 'login' ? ' segmented-control__item--active' : ''
                }`}
                type="button"
                onClick={() => setMode('login')}
              >
                Entrar
              </button>
              <button
                className={`segmented-control__item${
                  mode === 'signup' ? ' segmented-control__item--active' : ''
                }`}
                type="button"
                onClick={() => setMode('signup')}
              >
                Criar conta
              </button>
            </div>

            {errorMessage ? <div className="success-note success-note--error">{errorMessage}</div> : null}

            <form className="registration-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                {mode === 'signup' ? (
                  <label className="field field--full">
                    <span>Nome completo</span>
                    <input
                      required
                      className="input"
                      placeholder="Seu nome"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </label>
                ) : null}

                <label className={mode === 'signup' ? 'field' : 'field field--full'}>
                  <span>Email</span>
                  <input
                    required
                    className="input"
                    type="email"
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>

                <label className={mode === 'signup' ? 'field' : 'field field--full'}>
                  <span>Senha</span>
                  <input
                    required
                    className="input"
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
              </div>

              <div className="checkout-actions">
                <button className="button button--primary" disabled={isSubmitting} type="submit">
                  {isSubmitting
                    ? mode === 'login'
                      ? 'Entrando...'
                      : 'Criando conta...'
                    : mode === 'login'
                      ? 'Entrar e sincronizar'
                      : 'Criar conta'}
                </button>
                <Link className="button button--secondary" to="/my-registrations">
                  Voltar para minhas inscricoes
                </Link>
              </div>
            </form>
          </article>

          <aside className="panel side-panel side-panel--soft">
            <h2>O que a conta libera</h2>
            <ul className="bullet-list">
              <li>Sincronizacao do historico de inscricoes na nuvem.</li>
              <li>Acesso ao comprovante em qualquer dispositivo.</li>
              <li>Base pronta para check-in por QR, kits e comunicacao operacional.</li>
            </ul>
            <p>
              Inscricoes criadas antes do login neste navegador sao vinculadas automaticamente
              quando voce entra na conta.
            </p>
            <Link className="button button--ghost" to="/contact?audience=organizer">
              Quero publicar um evento
            </Link>
          </aside>
        </div>
      </section>
    </SiteLayout>
  )
}
