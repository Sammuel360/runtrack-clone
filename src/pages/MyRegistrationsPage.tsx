import { useEffect, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  CreditCard,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  TicketPercent,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAthleteAuth } from '../components/AthleteAuth'
import { SiteLayout, usePageMeta } from '../components/Layout'
import {
  formatDate,
  getPaymentMethodLabel,
  getRegistrationStatusMeta,
} from '../lib/registration-utils'
import { formatCurrency } from '../lib/race-utils'
import { deleteRegistration, listRegistrations, type RegistrationRecord } from '../lib/storage'

export function MyRegistrationsPage() {
  const { isLoading: isAuthLoading, logout, refreshSession, session } = useAthleteAuth()
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')

  usePageMeta(
    'RunTrack | Minhas inscricoes',
    'Consulte inscricoes, pagamentos, cupons, kits e acompanhamento da sua conta de atleta.',
  )

  async function refreshRegistrations() {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const nextRegistrations = await listRegistrations()
      setRegistrations(nextRegistrations)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel carregar suas inscricoes.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshRegistrations()
  }, [session?.athlete.id])

  async function handleDeleteRegistration(registrationId: string) {
    const shouldDelete = window.confirm('Deseja remover esta inscricao da plataforma?')
    if (!shouldDelete) {
      return
    }

    try {
      setRegistrations(await deleteRegistration(registrationId))
      setFeedbackMessage('Inscricao removida com sucesso.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel remover a inscricao.',
      )
    }
  }

  async function handleLogout() {
    try {
      await logout()
      setFeedbackMessage('Sua conta foi desconectada deste navegador.')
      await refreshRegistrations()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel encerrar a sessao.',
      )
    }
  }

  async function handleRefreshCloud() {
    try {
      await refreshSession()
      await refreshRegistrations()
      setFeedbackMessage('Sincronizacao atualizada com o backend.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel atualizar a sincronizacao.',
      )
    }
  }

  return (
    <SiteLayout>
      <section className="page-hero">
        <div className="container page-hero__content">
          <span className="section-eyebrow">Area do atleta</span>
          <h1>Minhas inscricoes</h1>
          <p>
            Acompanhe pagamento, comprovante, desconto aplicado, status de kit e check-in em um
            historico unico.
          </p>
        </div>
      </section>

      <section className="section section--compact">
        <div className="container">
          <article className="panel dashboard-callout account-callout">
            <div>
              <span className="section-eyebrow">Sincronizacao em nuvem</span>
              <h2>{session ? `Conta conectada: ${session.athlete.name}` : 'Modo navegador'}</h2>
              <span>
                {session
                  ? `As inscricoes estao vinculadas ao email ${session.athlete.email} e podem ser acessadas em qualquer dispositivo.`
                  : 'As inscricoes ainda ficam ligadas a este navegador. Entre na conta para sincronizar com a nuvem.'}
              </span>
            </div>

            <div className="dashboard-toolbar">
              <button
                className="button button--secondary"
                type="button"
                disabled={isLoading || isAuthLoading}
                onClick={handleRefreshCloud}
              >
                <RefreshCw size={16} />
                <span>Atualizar</span>
              </button>

              {session ? (
                <button className="button button--ghost" type="button" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Sair da conta</span>
                </button>
              ) : (
                <Link
                  className="button button--primary"
                  to={`/athlete/login?redirect=${encodeURIComponent('/my-registrations')}`}
                >
                  Entrar para sincronizar
                </Link>
              )}
            </div>
          </article>

          {feedbackMessage ? <div className="success-note">{feedbackMessage}</div> : null}
          {errorMessage ? <div className="success-note success-note--error">{errorMessage}</div> : null}

          {isLoading ? (
            <article className="panel empty-panel">
              <h2>Carregando inscricoes</h2>
              <p>Buscando o historico mais recente no backend.</p>
            </article>
          ) : registrations.length === 0 ? (
            <article className="panel empty-panel">
              <h2>Nenhuma inscricao registrada ainda</h2>
              <p>
                Escolha uma corrida para criar sua primeira reserva. Se ja tiver conta, entre
                primeiro para centralizar tudo no mesmo historico.
              </p>
              <div className="checkout-actions">
                <Link className="button button--primary" to="/races">
                  Explorar corridas
                </Link>
                <Link
                  className="button button--secondary"
                  to={`/athlete/login?redirect=${encodeURIComponent('/my-registrations')}`}
                >
                  Entrar na conta
                </Link>
              </div>
            </article>
          ) : (
            <div className="registrations-grid">
              {registrations.map((registration) => (
                <RegistrationCard
                  key={registration.id}
                  registration={registration}
                  onDelete={handleDeleteRegistration}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  )
}

function RegistrationCard({
  onDelete,
  registration,
}: {
  onDelete: (registrationId: string) => void
  registration: RegistrationRecord
}) {
  const registrationStatus = getRegistrationStatusMeta(registration)

  return (
    <article className="panel registration-card">
      <div className="registration-card__header">
        <div>
          <span className="section-eyebrow">#{registration.confirmationNumber}</span>
          <h2>{registration.raceName}</h2>
        </div>
        <span className={`status-badge status-badge--${registrationStatus.tone}`}>
          {registrationStatus.label}
        </span>
      </div>

      <div className="registration-card__meta">
        <span>
          <Calendar size={15} />
          <span>{formatDate(registration.created)}</span>
        </span>
        <span>
          <Mail size={15} />
          <span>{registration.email}</span>
        </span>
        <span>
          <Phone size={15} />
          <span>{registration.phone}</span>
        </span>
        <span>
          <CreditCard size={15} />
          <span>
            {registration.paymentStatus === 'paid'
              ? `${getPaymentMethodLabel(registration.paymentMethod)} | ${formatCurrency(
                  registration.finalPrice,
                )}`
              : `Pagamento pendente | ${formatCurrency(registration.finalPrice)}`}
          </span>
        </span>
      </div>

      <div className="mini-grid">
        <StatusChip
          icon={CheckCircle2}
          label="Check-in"
          value={registration.checkInStatus === 'checked_in' ? 'Realizado' : 'Pendente'}
        />
        <StatusChip
          icon={Shield}
          label="Kit"
          value={
            registration.kitStatus === 'delivered'
              ? 'Entregue'
              : registration.kitStatus === 'separated'
                ? 'Separado'
                : 'Pendente'
          }
        />
        <StatusChip
          icon={TicketPercent}
          label="Cupom"
          value={
            registration.couponCode
              ? `${registration.couponCode} | -${formatCurrency(registration.discountAmount)}`
              : 'Sem cupom'
          }
        />
      </div>

      <div className="registration-card__actions">
        <Link
          className="button button--secondary"
          to={
            registration.paymentStatus === 'paid'
              ? `/confirmation?registration=${registration.id}`
              : `/checkout/${registration.id}`
          }
        >
          {registration.paymentStatus === 'paid' ? 'Abrir comprovante' : 'Finalizar pagamento'}
        </Link>
        {registration.paymentMethod === 'boleto' || registration.paymentDigitableLine ? (
          <Link className="button button--secondary" to={`/payment-slip/${registration.id}`}>
            Segunda via do boleto
          </Link>
        ) : null}
        <button
          className="button button--ghost"
          type="button"
          onClick={() => onDelete(registration.id)}
        >
          <Trash2 size={16} />
          <span>Remover</span>
        </button>
      </div>
    </article>
  )
}

function StatusChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar
  label: string
  value: string
}) {
  return (
    <div className="info-chip info-chip--compact">
      <span>
        <Icon size={14} />
        <span>{label}</span>
      </span>
      <strong>{value}</strong>
    </div>
  )
}
