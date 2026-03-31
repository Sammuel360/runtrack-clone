import { Copy, Printer } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

import { SiteLayout, usePageMeta } from '../components/Layout'
import { formatDate } from '../lib/registration-utils'
import { formatCurrency } from '../lib/race-utils'
import { getRegistrationById, type RegistrationRecord } from '../lib/storage'

function buildFallbackLine(registration: RegistrationRecord) {
  const reference = registration.confirmationNumber.replace(/\D/g, '').padStart(15, '0').slice(-15)
  const amount = Math.round(registration.finalPrice * 100)
    .toString()
    .padStart(10, '0')

  return `34191.${reference.slice(0, 5)} ${reference.slice(5, 10)}.${reference.slice(10, 15)} ${amount.slice(0, 5)}.${amount.slice(5)} 7 000000${amount}`
}

function buildFallbackDueDate(registration: RegistrationRecord) {
  const dueDate = new Date(registration.created)
  dueDate.setDate(dueDate.getDate() + 2)
  return dueDate.toISOString()
}

export function PaymentSlipPage() {
  const params = useParams<{ registrationId: string }>()
  const [registration, setRegistration] = useState<RegistrationRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [feedbackMessage, setFeedbackMessage] = useState('')

  usePageMeta(
    'RunTrack | Segunda via do boleto',
    'Abra a segunda via do boleto da inscricao, copie a linha digitavel e salve em PDF.',
  )

  useEffect(() => {
    let active = true

    void (async () => {
      const nextRegistration = await getRegistrationById(params.registrationId ?? null)

      if (!active) {
        return
      }

      setRegistration(nextRegistration)
      setIsLoading(false)
    })()

    return () => {
      active = false
    }
  }, [params.registrationId])

  if (isLoading) {
    return (
      <SiteLayout>
        <section className="section section--compact">
          <div className="container">
            <article className="panel confirmation-empty">
              <h1>Carregando boleto</h1>
              <p>Buscando a segunda via mais recente da inscricao.</p>
            </article>
          </div>
        </section>
      </SiteLayout>
    )
  }

  if (!registration) {
    return (
      <SiteLayout>
        <section className="section section--compact">
          <div className="container">
            <article className="panel confirmation-empty">
              <h1>Boleto nao encontrado</h1>
              <p>Esta inscricao nao possui boleto disponivel no momento.</p>
              <Link className="button button--primary" to="/my-registrations">
                Voltar para inscricoes
              </Link>
            </article>
          </div>
        </section>
      </SiteLayout>
    )
  }

  const digitableLine = registration.paymentDigitableLine || buildFallbackLine(registration)
  const dueDate = registration.paymentExpiresAt || buildFallbackDueDate(registration)

  async function handleCopyFallbackSafe() {
    try {
      await navigator.clipboard.writeText(digitableLine)
      setFeedbackMessage('Linha digitavel copiada com sucesso.')
    } catch {
      setFeedbackMessage('Nao foi possivel copiar a linha digitavel automaticamente.')
    }
  }

  return (
    <SiteLayout>
      <section className="section section--compact">
        <div className="container payment-slip-stack">
          <div className="checkout-actions">
            <Link className="button button--secondary" to={`/checkout/${registration.id}/boleto`}>
              Voltar para o boleto
            </Link>
            <button className="button button--secondary" type="button" onClick={handleCopyFallbackSafe}>
              <Copy size={16} />
              <span>Copiar linha digitavel</span>
            </button>
            <button className="button button--primary" type="button" onClick={() => window.print()}>
              <Printer size={16} />
              <span>Salvar em PDF / Imprimir</span>
            </button>
          </div>

          {feedbackMessage ? <div className="success-note">{feedbackMessage}</div> : null}

          <article className="panel payment-slip">
            <header className="payment-slip__header">
              <div>
                <span className="section-eyebrow">Segunda via do boleto</span>
                <h1>RunTrack Eventos</h1>
                <p>Boleto de inscricao para {registration.raceName}</p>
              </div>
              <div className="payment-slip__bank">
                <strong>341-7</strong>
                <span>Banco Itau</span>
              </div>
            </header>

            <div className="payment-slip__line">
              <span>Linha digitavel</span>
              <strong>{digitableLine}</strong>
            </div>

            <div className="payment-slip__grid">
              <SlipField label="Beneficiario" value="RunTrack Tecnologia de Eventos" />
              <SlipField label="Pagador" value={registration.fullName} />
              <SlipField label="CPF" value={registration.paymentPayer?.documentNumber || 'Nao informado'} />
              <SlipField label="Nosso numero" value={registration.confirmationNumber} />
              <SlipField label="Valor" value={formatCurrency(registration.finalPrice)} />
              <SlipField
                label="Vencimento"
                value={formatDate(dueDate)}
              />
            </div>

            <div className="payment-slip__address">
              <span>Endereco de cobranca</span>
              <strong>
                {registration.paymentPayer
                  ? `${registration.paymentPayer.address.streetName}, ${registration.paymentPayer.address.streetNumber} - ${registration.paymentPayer.address.neighborhood}, ${registration.paymentPayer.address.city} - ${registration.paymentPayer.address.state}, CEP ${registration.paymentPayer.address.zipCode}`
                  : 'Endereco sera exibido apos a emissao completa do boleto.'}
              </strong>
            </div>

            <div className="payment-slip__instructions">
              <h2>Instrucoes</h2>
              <ul className="bullet-list">
                <li>Pague em qualquer banco, internet banking ou loterica ate a data de vencimento.</li>
                <li>Depois do pagamento, volte para suas inscricoes para atualizar o status da reserva.</li>
                <li>Se o boleto expirou, gere uma nova segunda via no checkout.</li>
              </ul>
            </div>
          </article>
        </div>
      </section>
    </SiteLayout>
  )
}

function SlipField({ label, value }: { label: string; value: string }) {
  return (
    <div className="payment-slip__field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
