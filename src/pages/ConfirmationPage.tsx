import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { SiteLayout, usePageMeta } from '../components/Layout'
import { productRoadmap } from '../data/site-content'
import {
  formatDate,
  getPaymentMethodLabel,
  getRegistrationStatusMeta,
} from '../lib/registration-utils'
import { getRegistrationById, type RegistrationRecord } from '../lib/storage'
import { formatCurrency } from '../lib/race-utils'

export function ConfirmationPage() {
  const [searchParams] = useSearchParams()
  const [registration, setRegistration] = useState<RegistrationRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const registrationId = searchParams.get('registration')
  const paymentFlowStatus = searchParams.get('payment')

  useEffect(() => {
    let active = true

    setIsLoading(true)

    void (async () => {
      const nextRegistration = await getRegistrationById(registrationId)

      if (!active) {
        return
      }

      setRegistration(nextRegistration)
      setIsLoading(false)
    })()

    return () => {
      active = false
    }
  }, [registrationId])

  usePageMeta(
    'RunTrack | Confirmacao da inscricao',
    'Visualize o comprovante da inscricao, o status do pagamento e os proximos passos do produto.',
  )

  return (
    <SiteLayout>
      <section className="section section--compact">
        <div className="container confirmation-container">
          {isLoading ? (
            <article className="panel confirmation-empty">
              <h1>Carregando comprovante</h1>
              <p>Buscando os dados mais recentes da inscricao.</p>
            </article>
          ) : !registration ? (
            <article className="panel confirmation-empty">
              <h1>Nenhuma confirmacao encontrada</h1>
              <p>Verifique se esta inscricao foi registrada corretamente no sistema.</p>
              <Link className="button button--primary" to="/races">
                Procurar corridas
              </Link>
            </article>
          ) : (
            <div className="confirmation-stack">
              <article className="panel confirmation-hero">
                <div className="confirmation-hero__icon">
                  <Trophy size={28} />
                </div>
                <span className="section-eyebrow">Comprovante gerado</span>
                <h1>
                  {getRegistrationStatusMeta(registration).label === 'Inscricao confirmada'
                    ? 'Inscricao confirmada'
                    : 'Reserva registrada'}
                </h1>
                <p>
                  O atleta ja possui um numero de confirmacao, status operacional e um fluxo
                  pronto para acompanhamento pelo organizador.
                </p>
                {paymentFlowStatus === 'pending' ? (
                  <div className="success-note">
                    O gateway informou pagamento pendente. Assim que houver aprovacao, o
                    comprovante sera atualizado automaticamente.
                  </div>
                ) : null}
              </article>

              <div className="confirmation-grid">
                <article className="panel">
                  <h2>Resumo da confirmacao</h2>
                  <div className="info-grid">
                    <div className="info-chip">
                      <span>Numero</span>
                      <strong>{registration.confirmationNumber}</strong>
                    </div>
                    <div className="info-chip">
                      <span>Status</span>
                      <strong>{getRegistrationStatusMeta(registration).label}</strong>
                    </div>
                    <div className="info-chip">
                      <span>Pagamento</span>
                      <strong>
                        {registration.paymentStatus === 'paid' ? 'Aprovado' : 'Pendente'}
                      </strong>
                    </div>
                  </div>
                </article>

                <article className="panel">
                  <h2>Dados da corrida</h2>
                  <div className="info-list">
                    <div>
                      <span>Evento</span>
                      <strong>{registration.raceName}</strong>
                    </div>
                    <div>
                      <span>Data do registro</span>
                      <strong>{formatDate(registration.created)}</strong>
                    </div>
                    <div>
                      <span>Valor original</span>
                      <strong>{formatCurrency(registration.racePrice)}</strong>
                    </div>
                    <div>
                      <span>Desconto</span>
                      <strong>-{formatCurrency(registration.discountAmount)}</strong>
                    </div>
                    <div>
                      <span>Valor final</span>
                      <strong>{formatCurrency(registration.finalPrice)}</strong>
                    </div>
                    <div>
                      <span>Meio de pagamento</span>
                      <strong>{getPaymentMethodLabel(registration.paymentMethod)}</strong>
                    </div>
                    <div>
                      <span>Gateway</span>
                      <strong>
                        {registration.paymentProvider === 'mercadopago'
                          ? 'Mercado Pago'
                          : 'Operacional interno'}
                      </strong>
                    </div>
                  </div>
                </article>

                <article className="panel panel--wide">
                  <h2>Dados do atleta</h2>
                  <div className="info-grid info-grid--wide">
                    <div className="info-chip">
                      <span>Nome completo</span>
                      <strong>{registration.fullName}</strong>
                    </div>
                    <div className="info-chip">
                      <span>Email</span>
                      <strong>{registration.email}</strong>
                    </div>
                    <div className="info-chip">
                      <span>Telefone</span>
                      <strong>{registration.phone}</strong>
                    </div>
                    <div className="info-chip">
                      <span>Camiseta</span>
                      <strong>{registration.tShirtSize}</strong>
                    </div>
                    <div className="info-chip">
                      <span>Contato de emergencia</span>
                      <strong>{registration.emergencyContactName}</strong>
                    </div>
                    <div className="info-chip">
                      <span>Telefone de emergencia</span>
                      <strong>{registration.emergencyContactPhone}</strong>
                    </div>
                  </div>
                </article>

                <article className="panel panel--wide">
                  <h2>Operacao do evento</h2>
                  <div className="info-grid info-grid--wide">
                    <div className="info-chip">
                      <span>Cupom aplicado</span>
                      <strong>{registration.couponCode || 'Nenhum'}</strong>
                    </div>
                    <div className="info-chip">
                      <span>Kit</span>
                      <strong>
                        {registration.kitStatus === 'delivered'
                          ? 'Entregue'
                          : registration.kitStatus === 'separated'
                            ? 'Separado'
                            : 'Pendente'}
                      </strong>
                    </div>
                    <div className="info-chip">
                      <span>Check-in</span>
                      <strong>
                        {registration.checkInStatus === 'checked_in'
                          ? 'Realizado'
                          : 'Pendente'}
                      </strong>
                    </div>
                    <div className="info-chip">
                      <span>Check-in em</span>
                      <strong>{registration.checkInAt ? formatDate(registration.checkInAt) : 'Ainda nao realizado'}</strong>
                    </div>
                  </div>
                </article>

                <article className="panel panel--wide">
                  <h2>Proximos passos recomendados</h2>
                  <ul className="bullet-list">
                    {productRoadmap.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              </div>

              <div className="confirmation-actions">
                <Link className="button button--secondary" to="/races">
                  Explorar mais corridas
                </Link>
                {registration.paymentMethod === 'boleto' || registration.paymentDigitableLine ? (
                  <Link className="button button--secondary" to={`/payment-slip/${registration.id}`}>
                    Segunda via do boleto
                  </Link>
                ) : null}
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => window.print()}
                >
                  Baixar recibo
                </button>
                <Link className="button button--primary" to="/my-registrations">
                  Ver minhas inscricoes
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  )
}
