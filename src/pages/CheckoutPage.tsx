import { useEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from 'react'
import {
  ArrowLeft,
  Copy,
  CreditCard,
  QrCode,
  RefreshCw,
  ReceiptText,
  ShieldCheck,
  TicketPercent,
} from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { SiteLayout, usePageMeta } from '../components/Layout'
import {
  applyCouponToRegistration,
  completeRegistrationPayment,
  getIntegrationStatus,
  getRegistrationById,
  refreshRegistrationPaymentStatus,
  removeCouponFromRegistration,
  type IntegrationStatus,
  type PaymentMethod,
  type PaymentPayer,
  type RegistrationRecord,
} from '../lib/storage'
import {
  formatDate,
  formatDateTime,
  getPaymentMethodLabel,
  getRegistrationStatusMeta,
} from '../lib/registration-utils'
import { formatCurrency } from '../lib/race-utils'

type CardFormState = {
  cardholderName: string
  cardNumber: string
  expiryDate: string
  cvv: string
  installments: string
  countryOrRegion: string
}

function ModernPaymentMethodScreen({
  boletoBillingForm,
  boletoDueDate,
  boletoLine,
  cardForm,
  errorMessage,
  feedbackMessage,
  integrationStatus,
  isProcessing,
  onMountRef,
  paymentMethod,
  paymentOptions,
  pixBillingForm,
  pixCode,
  pixExpiration,
  registration,
  registrationStatus,
  onBoletoBillingFormChange,
  onCardFormChange,
  onCopyValue,
  onPixBillingFormChange,
  onRefreshPaymentStatus,
  onSelectPaymentMethod,
  onSubmitPayment,
}: {
  boletoBillingForm: BillingFormState
  boletoDueDate: string
  boletoLine: string
  cardForm: CardFormState
  errorMessage: string
  feedbackMessage: string
  integrationStatus: IntegrationStatus
  isProcessing: boolean
  onMountRef: RefObject<HTMLDivElement | null>
  paymentMethod: PaymentMethod
  paymentOptions: PaymentOption[]
  pixBillingForm: BillingFormState
  pixCode: string
  pixExpiration: string
  registration: RegistrationRecord
  registrationStatus: string
  onBoletoBillingFormChange: (value: BillingFormState) => void
  onCardFormChange: (value: CardFormState) => void
  onCopyValue: (label: string, value: string) => Promise<void>
  onPixBillingFormChange: (value: BillingFormState) => void
  onRefreshPaymentStatus: () => Promise<void>
  onSelectPaymentMethod: (paymentMethod: PaymentMethod) => void
  onSubmitPayment: (paymentMethod: PaymentMethod) => Promise<void>
}) {
  const pixPayload = registration.paymentQrCode ?? pixCode
  const pixExpiresAt = registration.paymentExpiresAt ?? pixExpiration
  const boletoPayload = registration.paymentDigitableLine ?? boletoLine
  const boletoExpiresAt = registration.paymentExpiresAt ?? boletoDueDate
  const boletoGatewayUrl = registration.paymentTicketUrl ?? null
  const selectedOption = paymentOptions.find((option) => option.value === paymentMethod)
  const paymentLabel = selectedOption?.label ?? getPaymentMethodLabel(paymentMethod)
  const cardBrand = detectCardBrand(cardForm.cardNumber)

  return (
    <article className="panel payment-shell">
      <div className="payment-shell__summary">
        <div className="payment-shell__summary-top">
          <span className="payment-shell__badge">Area protegida RunTrack</span>
          <span className="payment-shell__gateway">
            {integrationStatus.mercadoPagoEnabled
              ? 'Gateway real conectado'
              : integrationStatus.mercadoPagoConfigured
                ? 'Gateway com configuracao pendente'
              : 'Ambiente de homologacao'}
          </span>
        </div>

        <div className="payment-shell__summary-main">
          <span className="payment-shell__label">Inscricao: {registration.raceName}</span>
          <strong>{formatCurrency(registration.finalPrice)}</strong>
          <p>
            Reserva criada para {registration.fullName}. Agora falta apenas concluir o pagamento
            em {paymentLabel.toLowerCase()}.
          </p>
        </div>

        <div className="payment-shell__summary-list">
          <div className="payment-shell__summary-item">
            <span>Numero da reserva</span>
            <strong>{registration.confirmationNumber}</strong>
          </div>
          <div className="payment-shell__summary-item">
            <span>Status atual</span>
            <strong>{registrationStatus}</strong>
          </div>
          <div className="payment-shell__summary-item">
            <span>Data da reserva</span>
            <strong>{formatDate(registration.created)}</strong>
          </div>
          <div className="payment-shell__summary-item">
            <span>Email do atleta</span>
            <strong>{registration.email}</strong>
          </div>
        </div>

        {registration.discountAmount > 0 ? (
          <div className="payment-shell__summary-note">
            <span>Cupom ativo</span>
            <strong>
              {registration.couponCode} aplicado com desconto de{' '}
              {formatCurrency(registration.discountAmount)}
            </strong>
          </div>
        ) : null}
      </div>

      <div className="payment-shell__pane">
        <div className="payment-shell__pane-header">
          <div>
            <span className="payment-standard-section__label">Dados para contato</span>
            <h2>Finalize seu pagamento</h2>
            <p>Layout ajustado para ficar mais proximo do padrao visual atual do checkout.</p>
          </div>
          <div className="payment-shell__trust">
            <ShieldCheck size={16} />
            <span>
              {integrationStatus.mercadoPagoEnabled
                ? 'Mercado Pago'
                : integrationStatus.mercadoPagoConfigured
                  ? 'Gateway pendente'
                  : 'Fluxo protegido'}
            </span>
          </div>
        </div>

        {feedbackMessage ? <div className="success-note">{feedbackMessage}</div> : null}
        {errorMessage ? <div className="success-note success-note--error">{errorMessage}</div> : null}
        {integrationStatus.mercadoPagoConfigured &&
        !integrationStatus.mercadoPagoEnabled &&
        integrationStatus.mercadoPagoWarnings.length > 0 ? (
          <div className="success-note success-note--error">
            Mercado Pago configurado com pendencias: {integrationStatus.mercadoPagoWarnings[0]}
          </div>
        ) : null}

        <section className="payment-standard-section">
          <label className="field field--full">
            <span>E-mail</span>
            <input className="input payment-standard-input" readOnly value={registration.email} />
          </label>
        </section>

        <section className="payment-standard-section">
          <div className="payment-standard-section__header">
            <div>
              <span className="payment-standard-section__label">Forma de pagamento</span>
              <h3>{paymentLabel}</h3>
            </div>
          </div>

          <div className="payment-method-switcher">
            {paymentOptions.map((option) => {
              const Icon = option.icon
              const isActive = option.value === paymentMethod

              return (
                <button
                  key={option.value}
                  className={`payment-method-switcher__item${
                    isActive ? ' payment-method-switcher__item--active' : ''
                  }`}
                  type="button"
                  onClick={() => onSelectPaymentMethod(option.value)}
                >
                  <span className="payment-method-switcher__icon">
                    <Icon size={18} />
                  </span>
                  <span className="payment-method-switcher__content">
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <div ref={onMountRef} className="payment-method-stage payment-scroll-target">
            {paymentMethod === 'card' ? (
            integrationStatus.mercadoPagoEnabled ? (
              <div className="payment-standard-card">
                <div className="payment-standard-card__header">
                  <div>
                    <span className="payment-standard-card__eyebrow">Cartao</span>
                    <strong>Continue na pagina segura do gateway</strong>
                  </div>
                  <span className="payment-method-chip">Gateway</span>
                </div>

                <div className="payment-trust-box">
                  <ShieldCheck size={18} />
                  <p>
                    Numero, validade e CVC sao informados diretamente na tela protegida do gateway.
                  </p>
                </div>

                <button
                  className="button button--primary payment-primary-button"
                  disabled={isProcessing}
                  type="button"
                  onClick={() => void onSubmitPayment('card')}
                >
                  {isProcessing ? 'Abrindo gateway...' : 'Ir para pagina segura do cartao'}
                </button>
              </div>
            ) : (
              <form
                className="payment-standard-card"
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault()
                  void onSubmitPayment('card')
                }}
              >
                <div className="payment-standard-card__header">
                  <div>
                    <span className="payment-standard-card__eyebrow">Dados do cartao</span>
                    <strong>Preencha os dados abaixo para concluir</strong>
                  </div>
                  <span className="payment-method-chip">{cardBrand}</span>
                </div>

                <div className="payment-card-composite">
                  <span className="payment-card-composite__label">Dados do cartao</span>
                  <div className="payment-card-composite__surface">
                    <div className="payment-card-composite__top">
                      <input
                        className="payment-card-composite__input"
                        inputMode="numeric"
                        placeholder="1234 1234 1234 1234"
                        value={cardForm.cardNumber}
                        onChange={(event) =>
                          onCardFormChange({
                            ...cardForm,
                            cardNumber: formatCardNumber(event.target.value),
                          })
                        }
                      />
                      <div className="payment-card-badges" aria-hidden="true">
                        <span>Visa</span>
                        <span>Mastercard</span>
                      </div>
                    </div>
                    <div className="payment-card-composite__row">
                      <input
                        className="payment-card-composite__input"
                        inputMode="numeric"
                        placeholder="MM / AA"
                        value={cardForm.expiryDate}
                        onChange={(event) =>
                          onCardFormChange({
                            ...cardForm,
                            expiryDate: formatExpiryDate(event.target.value),
                          })
                        }
                      />
                      <input
                        className="payment-card-composite__input"
                        inputMode="numeric"
                        placeholder="CVC"
                        value={cardForm.cvv}
                        onChange={(event) =>
                          onCardFormChange({
                            ...cardForm,
                            cvv: onlyDigits(event.target.value).slice(0, 4),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <label className="field field--full">
                  <span>Nome do titular do cartao</span>
                  <input
                    className="input payment-standard-input"
                    placeholder="Nome completo"
                    value={cardForm.cardholderName}
                    onChange={(event) =>
                      onCardFormChange({ ...cardForm, cardholderName: event.target.value })
                    }
                  />
                </label>

                <div className="payment-inline-grid">
                  <label className="field">
                    <span>Pais ou regiao</span>
                    <select
                      className="input input--select payment-standard-input"
                      value={cardForm.countryOrRegion}
                      onChange={(event) =>
                        onCardFormChange({ ...cardForm, countryOrRegion: event.target.value })
                      }
                    >
                      <option value="Brasil">Brasil</option>
                      <option value="Portugal">Portugal</option>
                      <option value="Argentina">Argentina</option>
                      <option value="Estados Unidos">Estados Unidos</option>
                    </select>
                  </label>

                  <label className="field">
                    <span>Parcelamento</span>
                    <select
                      className="input input--select payment-standard-input"
                      value={cardForm.installments}
                      onChange={(event) =>
                        onCardFormChange({ ...cardForm, installments: event.target.value })
                      }
                    >
                      <option value="1">1x de {formatCurrency(registration.finalPrice)}</option>
                      <option value="2">
                        2x de {formatCurrency(Number((registration.finalPrice / 2).toFixed(2)))}
                      </option>
                      <option value="3">
                        3x de {formatCurrency(Number((registration.finalPrice / 3).toFixed(2)))}
                      </option>
                    </select>
                  </label>
                </div>

                <div className="payment-trust-box">
                  <ShieldCheck size={18} />
                  <p>Seus dados ficam protegidos neste fluxo antes da confirmacao da inscricao.</p>
                </div>

                <button className="button button--primary payment-primary-button" disabled={isProcessing} type="submit">
                  {isProcessing ? 'Processando cartao...' : 'Pagar'}
                </button>
              </form>
            )
          ) : null}

            {paymentMethod === 'pix' ? (
            <div className="payment-standard-card payment-standard-card--split">
              <div className="payment-standard-card__header">
                <div>
                  <span className="payment-standard-card__eyebrow">Pix</span>
                  <strong>Escaneie o QR Code ou copie o codigo</strong>
                </div>
                <span className="payment-method-chip">Instantaneo</span>
              </div>

              <div className="payment-standard-split">
                <div className="payment-qr-panel">
                  {registration.paymentQrCodeBase64 ? (
                    <img
                      alt="QR Code Pix"
                      className="pix-qr-image"
                      src={`data:image/png;base64,${registration.paymentQrCodeBase64}`}
                    />
                  ) : (
                    <div className="pix-qr-placeholder" aria-hidden="true">
                      <div />
                    </div>
                  )}
                  <div className="payment-qr-panel__meta">
                    <strong>{formatCurrency(registration.finalPrice)}</strong>
                    <span>Expira em {formatDateTime(pixExpiresAt)}</span>
                    <span>
                      Status: {registration.paymentStatusDetail || 'aguardando geracao do pagamento'}
                    </span>
                  </div>
                </div>

                <div className="payment-standard-stack">
                  <label className="field field--full">
                    <span>CPF do pagador</span>
                    <input
                      className="input payment-standard-input"
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      value={pixBillingForm.documentNumber}
                      onChange={(event) =>
                        onPixBillingFormChange({
                          ...pixBillingForm,
                          documentNumber: formatCpf(event.target.value),
                        })
                      }
                    />
                  </label>

                  <div className="payment-code-box payment-code-box--solid">
                    <span>Pix copia e cola</span>
                    <strong>{pixPayload}</strong>
                  </div>

                  <div className="payment-trust-box">
                    <ShieldCheck size={18} />
                    <p>Quando ativo, o gateway emite QR e codigo reais a partir desta etapa.</p>
                  </div>
                </div>
              </div>

              <div className="payment-action-row">
                <button
                  className="button button--secondary payment-secondary-button"
                  type="button"
                  onClick={() => void onCopyValue('Codigo Pix', pixPayload)}
                >
                  <Copy size={16} />
                  <span>Copiar codigo Pix</span>
                </button>
                {integrationStatus.mercadoPagoEnabled && registration.paymentOrderId ? (
                  <button
                    className="button button--ghost payment-ghost-button"
                    disabled={isProcessing}
                    type="button"
                    onClick={() => void onRefreshPaymentStatus()}
                  >
                    <RefreshCw size={16} />
                    <span>Atualizar status</span>
                  </button>
                ) : null}
              </div>

              <button
                className="button button--primary payment-primary-button"
                disabled={isProcessing}
                type="button"
                onClick={() => void onSubmitPayment('pix')}
              >
                {isProcessing
                  ? 'Processando Pix...'
                  : integrationStatus.mercadoPagoEnabled
                    ? registration.paymentQrCode
                      ? 'Gerar novo Pix'
                      : 'Gerar QR Pix real'
                    : 'Pagar com Pix'}
              </button>
            </div>
          ) : null}

            {paymentMethod === 'boleto' ? (
            <div className="payment-standard-card">
              <div className="payment-standard-card__header">
                <div>
                  <span className="payment-standard-card__eyebrow">Boleto</span>
                  <strong>Preencha os dados para emitir o boleto</strong>
                </div>
                <span className="payment-method-chip">Compensacao bancaria</span>
              </div>

              <div className="payment-inline-grid payment-inline-grid--dense">
                <label className="field field--full">
                  <span>CPF do pagador</span>
                  <input
                    className="input payment-standard-input"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={boletoBillingForm.documentNumber}
                    onChange={(event) =>
                      onBoletoBillingFormChange({
                        ...boletoBillingForm,
                        documentNumber: formatCpf(event.target.value),
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>CEP</span>
                  <input
                    className="input payment-standard-input"
                    inputMode="numeric"
                    placeholder="00000-000"
                    value={boletoBillingForm.zipCode}
                    onChange={(event) =>
                      onBoletoBillingFormChange({
                        ...boletoBillingForm,
                        zipCode: formatZipCode(event.target.value),
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>Numero</span>
                  <input
                    className="input payment-standard-input"
                    placeholder="123"
                    value={boletoBillingForm.streetNumber}
                    onChange={(event) =>
                      onBoletoBillingFormChange({
                        ...boletoBillingForm,
                        streetNumber: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field field--full">
                  <span>Rua</span>
                  <input
                    className="input payment-standard-input"
                    placeholder="Rua do Atleta"
                    value={boletoBillingForm.streetName}
                    onChange={(event) =>
                      onBoletoBillingFormChange({
                        ...boletoBillingForm,
                        streetName: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>Bairro</span>
                  <input
                    className="input payment-standard-input"
                    placeholder="Centro"
                    value={boletoBillingForm.neighborhood}
                    onChange={(event) =>
                      onBoletoBillingFormChange({
                        ...boletoBillingForm,
                        neighborhood: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>Cidade</span>
                  <input
                    className="input payment-standard-input"
                    placeholder="Sao Paulo"
                    value={boletoBillingForm.city}
                    onChange={(event) =>
                      onBoletoBillingFormChange({
                        ...boletoBillingForm,
                        city: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>UF</span>
                  <input
                    className="input payment-standard-input"
                    maxLength={2}
                    placeholder="SP"
                    value={boletoBillingForm.state}
                    onChange={(event) =>
                      onBoletoBillingFormChange({
                        ...boletoBillingForm,
                        state: event.target.value.toUpperCase(),
                      })
                    }
                  />
                </label>
              </div>

              <div className="payment-code-box payment-code-box--solid">
                <span>Linha digitavel</span>
                <strong>{boletoPayload}</strong>
              </div>

              <div className="payment-boleto-meta">
                <div className="payment-boleto-meta__item">
                  <span>Vencimento</span>
                  <strong>{formatDate(boletoExpiresAt)}</strong>
                </div>
                <div className="payment-boleto-meta__item">
                  <span>Total</span>
                  <strong>{formatCurrency(registration.finalPrice)}</strong>
                </div>
                <div className="payment-boleto-meta__item">
                  <span>Status</span>
                  <strong>{registration.paymentStatusDetail || 'aguardando emissao do boleto'}</strong>
                </div>
              </div>

              <div className="payment-action-row">
                <button
                  className="button button--secondary payment-secondary-button"
                  type="button"
                  onClick={() => void onCopyValue('Linha digitavel', boletoPayload)}
                >
                  <Copy size={16} />
                  <span>Copiar linha digitavel</span>
                </button>
                {boletoGatewayUrl ? (
                  <a
                    className="button button--secondary payment-secondary-button"
                    href={boletoGatewayUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Abrir boleto
                  </a>
                ) : null}
                <Link className="button button--ghost payment-ghost-button" to={`/payment-slip/${registration.id}`}>
                  Segunda via / PDF
                </Link>
                {integrationStatus.mercadoPagoEnabled && registration.paymentOrderId ? (
                  <button
                    className="button button--ghost payment-ghost-button"
                    disabled={isProcessing}
                    type="button"
                    onClick={() => void onRefreshPaymentStatus()}
                  >
                    <RefreshCw size={16} />
                    <span>Atualizar status</span>
                  </button>
                ) : null}
              </div>

              <button
                className="button button--primary payment-primary-button"
                disabled={isProcessing}
                type="button"
                onClick={() => void onSubmitPayment('boleto')}
              >
                {isProcessing
                  ? 'Processando boleto...'
                  : integrationStatus.mercadoPagoEnabled
                    ? registration.paymentTicketUrl || registration.paymentDigitableLine
                      ? 'Gerar novo boleto'
                      : 'Gerar boleto real'
                    : 'Emitir boleto'}
              </button>
            </div>
            ) : null}
          </div>
        </section>

        <div className="payment-footer">
          <span>
            {integrationStatus.mercadoPagoEnabled
              ? 'Conectado ao Mercado Pago'
              : integrationStatus.mercadoPagoConfigured
                ? 'Mercado Pago configurado com pendencias'
              : 'Checkout validado em ambiente interno'}
          </span>
          <div className="payment-footer__links">
            <Link to="/terms">Termos</Link>
            <Link to="/privacy">Privacidade</Link>
          </div>
        </div>
      </div>
    </article>
  )
}

type BillingFormState = {
  documentNumber: string
  zipCode: string
  streetName: string
  streetNumber: string
  neighborhood: string
  city: string
  state: string
}

type PaymentOption = {
  value: PaymentMethod
  label: string
  description: string
  icon: typeof QrCode
}

const paymentOptions: PaymentOption[] = [
  {
    value: 'pix',
    label: 'Pix',
    description: 'Vai para a tela de QR Code e codigo copia e cola para concluir o pagamento.',
    icon: QrCode,
  },
  {
    value: 'card',
    label: 'Cartao',
    description: 'Abre uma tela especifica para os dados do cartao antes de confirmar a compra.',
    icon: CreditCard,
  },
  {
    value: 'boleto',
    label: 'Boleto',
    description: 'Gera a tela com linha digitavel, vencimento e instrucoes do boleto.',
    icon: ReceiptText,
  },
]

const fallbackIntegrationStatus: IntegrationStatus = {
  mercadoPagoConfigured: false,
  mercadoPagoEnabled: false,
  mercadoPagoWarnings: [],
  resendEnabled: false,
  appUrl: '',
  webhookUrl: '',
}

const emptyCardForm: CardFormState = {
  cardholderName: '',
  cardNumber: '',
  expiryDate: '',
  cvv: '',
  installments: '1',
  countryOrRegion: 'Brasil',
}

const emptyBillingForm: BillingFormState = {
  documentNumber: '',
  zipCode: '',
  streetName: '',
  streetNumber: '',
  neighborhood: '',
  city: '',
  state: '',
}

function resolvePaymentMethod(value: string | undefined): PaymentMethod | null {
  if (value === 'pix' || value === 'card' || value === 'boleto') {
    return value
  }

  return null
}

function buildCheckoutPath(registrationId: string, paymentMethod?: PaymentMethod | null) {
  return paymentMethod ? `/checkout/${registrationId}/${paymentMethod}` : `/checkout/${registrationId}`
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function formatCardNumber(value: string) {
  return onlyDigits(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiryDate(value: string) {
  const digits = onlyDigits(value).slice(0, 4)

  if (digits.length <= 2) {
    return digits
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11)

  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

function formatZipCode(value: string) {
  const digits = onlyDigits(value).slice(0, 8)

  if (digits.length <= 5) {
    return digits
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function detectCardBrand(value: string) {
  const digits = onlyDigits(value)

  if (digits.startsWith('4')) {
    return 'Visa'
  }

  if (/^(5[1-5]|2[2-7])/.test(digits)) {
    return 'Mastercard'
  }

  if (/^3[47]/.test(digits)) {
    return 'Amex'
  }

  return 'Cartao'
}

function createPixCode(registration: RegistrationRecord) {
  const amount = Math.round(registration.finalPrice * 100)
    .toString()
    .padStart(8, '0')
  const reference = registration.confirmationNumber.replace(/\D/g, '').padStart(10, '0').slice(-10)

  return `00020126580014BR.GOV.BCB.PIX0136runtrack-${registration.id.slice(0, 10)}52040000530398654${amount}5802BR5913RUNTRACK6009SAOPAULO62070503***6304${reference}`
}

function createBoletoLine(registration: RegistrationRecord) {
  const reference = registration.confirmationNumber.replace(/\D/g, '').padStart(15, '0').slice(-15)
  const amount = Math.round(registration.finalPrice * 100)
    .toString()
    .padStart(10, '0')

  return `34191.${reference.slice(0, 5)} ${reference.slice(5, 10)}.${reference.slice(10, 15)} ${amount.slice(0, 5)}.${amount.slice(5)} 7 000000${amount}`
}

function buildPaymentPayer(form: BillingFormState): PaymentPayer {
  return {
    documentNumber: onlyDigits(form.documentNumber),
    address: {
      zipCode: onlyDigits(form.zipCode),
      streetName: form.streetName.trim(),
      streetNumber: form.streetNumber.trim(),
      neighborhood: form.neighborhood.trim(),
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
    },
  }
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const params = useParams<{ registrationId: string; paymentMethod?: string }>()
  const [searchParams] = useSearchParams()
  const [registration, setRegistration] = useState<RegistrationRecord | null>(null)
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>(
    fallbackIntegrationStatus,
  )
  const [couponCode, setCouponCode] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [cardForm, setCardForm] = useState<CardFormState>(emptyCardForm)
  const [pixBillingForm, setPixBillingForm] = useState<BillingFormState>(emptyBillingForm)
  const [boletoBillingForm, setBoletoBillingForm] = useState<BillingFormState>(emptyBillingForm)
  const paymentScreenRef = useRef<HTMLDivElement | null>(null)

  const selectedPaymentMethod = resolvePaymentMethod(params.paymentMethod)

  usePageMeta(
    selectedPaymentMethod
      ? `RunTrack | Pagamento via ${getPaymentMethodLabel(selectedPaymentMethod)}`
      : 'RunTrack | Checkout da inscricao',
    'Conclua o pagamento da inscricao, aplique cupons e siga por uma tela especifica para cartao, Pix ou boleto.',
  )

  useEffect(() => {
    let active = true

    setIsLoading(true)

    void (async () => {
      try {
        const [nextRegistration, nextIntegrations] = await Promise.all([
          getRegistrationById(params.registrationId ?? null),
          getIntegrationStatus(),
        ])

        if (!active) {
          return
        }

        setRegistration(nextRegistration)
        setCouponCode(nextRegistration?.couponCode ?? '')
        setIntegrationStatus(nextIntegrations)
        setCardForm((current) => ({
          ...current,
          cardholderName: current.cardholderName || nextRegistration?.fullName || '',
        }))
        if (nextRegistration?.paymentPayer) {
          const nextBilling = {
            documentNumber: nextRegistration.paymentPayer.documentNumber,
            zipCode: nextRegistration.paymentPayer.address.zipCode,
            streetName: nextRegistration.paymentPayer.address.streetName,
            streetNumber: nextRegistration.paymentPayer.address.streetNumber,
            neighborhood: nextRegistration.paymentPayer.address.neighborhood,
            city: nextRegistration.paymentPayer.address.city,
            state: nextRegistration.paymentPayer.address.state,
          }
          setPixBillingForm(nextBilling)
          setBoletoBillingForm(nextBilling)
        }

        if (searchParams.get('payment') === 'failure') {
          setErrorMessage('O gateway informou falha no pagamento. Revise e tente novamente.')
        }
      } catch (error) {
        if (!active) {
          return
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Nao foi possivel carregar o checkout.',
        )
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      active = false
    }
  }, [params.registrationId, searchParams])

  function scrollToPaymentScreen() {
    window.requestAnimationFrame(() => {
      paymentScreenRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  useEffect(() => {
    if (!selectedPaymentMethod || isLoading) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      scrollToPaymentScreen()
    }, 90)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isLoading, selectedPaymentMethod])

  const pixCode = useMemo(() => (registration ? createPixCode(registration) : ''), [registration])
  const boletoLine = useMemo(
    () => (registration ? createBoletoLine(registration) : ''),
    [registration],
  )
  const boletoDueDate = useMemo(() => {
    if (!registration) {
      return ''
    }

    const dueDate = new Date(registration.created)
    dueDate.setDate(dueDate.getDate() + 2)
    return dueDate.toISOString()
  }, [registration])
  const pixExpiration = useMemo(() => {
    if (!registration) {
      return ''
    }

    const expiresAt = new Date(registration.created)
    expiresAt.setMinutes(expiresAt.getMinutes() + 30)
    return expiresAt.toISOString()
  }, [registration])

  async function handleApplyCoupon() {
    if (!registration || !couponCode.trim()) {
      return
    }

    setIsApplyingCoupon(true)
    setFeedbackMessage('')
    setErrorMessage('')

    try {
      const result = await applyCouponToRegistration(registration.id, couponCode)
      setRegistration(result.registration)
      setCouponCode(result.coupon.code)
      setFeedbackMessage(`Cupom ${result.coupon.code} aplicado com sucesso.`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel aplicar o cupom.')
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  async function handleRemoveCoupon() {
    if (!registration?.couponCode) {
      return
    }

    setIsApplyingCoupon(true)
    setFeedbackMessage('')
    setErrorMessage('')

    try {
      const nextRegistration = await removeCouponFromRegistration(registration.id)
      setRegistration(nextRegistration)
      setCouponCode('')
      setFeedbackMessage('Cupom removido da inscricao.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel remover o cupom.')
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  async function handleCopyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setFeedbackMessage(`${label} copiado com sucesso.`)
      setErrorMessage('')
    } catch {
      setErrorMessage(`Nao foi possivel copiar ${label.toLowerCase()} automaticamente.`)
    }
  }

  function validateSelectedPaymentMethod(paymentMethod: PaymentMethod) {
    if (paymentMethod === 'card' && integrationStatus.mercadoPagoEnabled) {
      return null
    }

    if (paymentMethod === 'card') {
      if (!cardForm.cardholderName.trim()) {
        return 'Informe o nome impresso no cartao.'
      }

      if (onlyDigits(cardForm.cardNumber).length < 16) {
        return 'Informe um numero de cartao valido.'
      }

      if (!/^\d{2}\/\d{2}$/.test(cardForm.expiryDate)) {
        return 'Informe a validade no formato MM/AA.'
      }

      if (onlyDigits(cardForm.cvv).length < 3) {
        return 'Informe um codigo de seguranca valido.'
      }
    }

    if (paymentMethod === 'pix') {
      if (onlyDigits(pixBillingForm.documentNumber).length !== 11) {
        return 'Informe um CPF valido para gerar o Pix.'
      }
    }

    if (paymentMethod === 'boleto') {
      if (onlyDigits(boletoBillingForm.documentNumber).length !== 11) {
        return 'Informe um CPF valido para gerar o boleto.'
      }

      const boletoPayer = buildPaymentPayer(boletoBillingForm)

      if (
        !boletoPayer.address.zipCode ||
        !boletoPayer.address.streetName ||
        !boletoPayer.address.streetNumber ||
        !boletoPayer.address.neighborhood ||
        !boletoPayer.address.city ||
        !boletoPayer.address.state
      ) {
        return 'Preencha o endereco completo para emitir o boleto.'
      }
    }

    return null
  }

  async function handleSubmitPayment(paymentMethod: PaymentMethod) {
    if (!registration) {
      return
    }

    const validationError = validateSelectedPaymentMethod(paymentMethod)

    if (validationError) {
      setErrorMessage(validationError)
      setFeedbackMessage('')
      return
    }

    setIsProcessing(true)
    setFeedbackMessage('')
    setErrorMessage('')

    try {
      const payer =
        paymentMethod === 'card'
          ? undefined
          : buildPaymentPayer(paymentMethod === 'pix' ? pixBillingForm : boletoBillingForm)

      const result = await completeRegistrationPayment(registration.id, paymentMethod, payer)

      if (result.registration) {
        setRegistration(result.registration)
      }

      if (result.mode === 'redirect' && result.checkoutUrl) {
        window.location.href = result.checkoutUrl
        return
      }

      if (result.mode === 'pending_artifact' && result.registration) {
        setFeedbackMessage(
          paymentMethod === 'pix'
            ? 'QR Pix gerado com sucesso. Use o codigo ou o QR para concluir o pagamento.'
            : 'Boleto gerado com sucesso. Voce ja pode copiar a linha digitavel ou abrir a segunda via.',
        )
        return
      }

      if (result.registration) {
        navigate(`/confirmation?registration=${result.registration.id}`)
        return
      }

      setErrorMessage('Nao foi possivel concluir o pagamento desta inscricao.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel iniciar o pagamento.',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleRefreshPaymentStatus() {
    if (!registration) {
      return
    }

    setIsProcessing(true)
    setFeedbackMessage('')
    setErrorMessage('')

    try {
      const nextRegistration = await refreshRegistrationPaymentStatus(registration.id)
      setRegistration(nextRegistration)

      if (nextRegistration.paymentStatus === 'paid') {
        navigate(`/confirmation?registration=${nextRegistration.id}`)
        return
      }

      setFeedbackMessage('Status do pagamento atualizado com o gateway.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel atualizar o status do pagamento.',
      )
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <SiteLayout>
        <section className="section section--compact">
          <div className="container">
            <article className="panel confirmation-empty">
              <h1>Carregando checkout</h1>
              <p>Buscando os dados da inscricao e o status das integracoes.</p>
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
              <h1>Checkout nao encontrado</h1>
              <p>Esta reserva nao foi encontrada no sistema.</p>
              <Link className="button button--primary" to="/races">
                Voltar para corridas
              </Link>
            </article>
          </div>
        </section>
      </SiteLayout>
    )
  }

  const registrationStatus = getRegistrationStatusMeta(registration)

  if (registration.paymentStatus === 'paid') {
    return (
      <SiteLayout>
        <section className="section section--compact">
          <div className="container">
            <article className="panel confirmation-empty">
              <span className="section-eyebrow">Pagamento confirmado</span>
              <h1>Esta inscricao ja esta completa</h1>
              <p>
                O meio de pagamento registrado foi {getPaymentMethodLabel(registration.paymentMethod)}
                {' '}via {registration.paymentProvider === 'mercadopago' ? 'Mercado Pago' : 'fluxo interno'}.
              </p>
              <div className="checkout-actions">
                <Link className="button button--secondary" to="/my-registrations">
                  Ver inscricoes
                </Link>
                <Link
                  className="button button--primary"
                  to={`/confirmation?registration=${registration.id}`}
                >
                  Abrir comprovante
                </Link>
              </div>
            </article>
          </div>
        </section>
      </SiteLayout>
    )
  }

  return (
    <SiteLayout>
      <section className="section section--compact">
        <div
          className={`container checkout-layout${
            selectedPaymentMethod ? ' checkout-layout--focused' : ''
          }`}
        >
          <div className="checkout-main">
            <Link
              className="back-link"
              to={
                selectedPaymentMethod
                  ? buildCheckoutPath(registration.id)
                  : `/register/${registration.raceId}`
              }
            >
              <ArrowLeft size={16} />
              <span>
                {selectedPaymentMethod
                  ? 'Voltar para a escolha do pagamento'
                  : 'Voltar para os dados do atleta'}
              </span>
            </Link>

            {selectedPaymentMethod ? null : (
              <CheckoutSummary
                registration={registration}
                registrationStatus={registrationStatus.label}
              />
            )}

            <article
              className={`panel form-panel${
                selectedPaymentMethod ? ' checkout-coupon-panel' : ''
              }`}
            >
              <h2>Aplicar cupom</h2>
              <p className="panel-intro">
                Cupons sao validados no backend e refletidos no painel operacional do evento.
              </p>

              {!selectedPaymentMethod && feedbackMessage ? (
                <div className="success-note">{feedbackMessage}</div>
              ) : null}
              {!selectedPaymentMethod && errorMessage ? (
                <div className="success-note success-note--error">{errorMessage}</div>
              ) : null}

              <div className="coupon-row">
                <label className="field field--full">
                  <span>Codigo promocional</span>
                  <input
                    className="input"
                    placeholder="Ex.: RUN10"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                  />
                </label>
                <div className="coupon-row__actions">
                  <button
                    className="button button--secondary"
                    disabled={isApplyingCoupon || !couponCode.trim()}
                    type="button"
                    onClick={handleApplyCoupon}
                  >
                    {isApplyingCoupon ? 'Aplicando...' : 'Aplicar cupom'}
                  </button>
                  {registration.couponCode ? (
                    <button
                      className="button button--ghost"
                      disabled={isApplyingCoupon}
                      type="button"
                      onClick={handleRemoveCoupon}
                    >
                      Remover
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="checkout-notice">
                <TicketPercent size={18} />
                <p>
                  {registration.couponCode
                    ? `Cupom ${registration.couponCode} ativo com desconto de ${formatCurrency(
                        registration.discountAmount,
                      )}.`
                    : 'Nenhum cupom aplicado nesta reserva.'}
                </p>
              </div>
            </article>

            {selectedPaymentMethod ? (
              <ModernPaymentMethodScreen
                boletoBillingForm={boletoBillingForm}
                boletoDueDate={boletoDueDate}
                boletoLine={boletoLine}
                cardForm={cardForm}
                errorMessage={errorMessage}
                feedbackMessage={feedbackMessage}
                integrationStatus={integrationStatus}
                isProcessing={isProcessing}
                onMountRef={paymentScreenRef}
                paymentMethod={selectedPaymentMethod}
                paymentOptions={paymentOptions}
                pixBillingForm={pixBillingForm}
                pixCode={pixCode}
                pixExpiration={pixExpiration}
                registration={registration}
                registrationStatus={registrationStatus.label}
                onBoletoBillingFormChange={setBoletoBillingForm}
                onCardFormChange={setCardForm}
                onCopyValue={handleCopyValue}
                onPixBillingFormChange={setPixBillingForm}
                onRefreshPaymentStatus={handleRefreshPaymentStatus}
                onSelectPaymentMethod={(nextMethod) => {
                  if (selectedPaymentMethod === nextMethod) {
                    scrollToPaymentScreen()
                    return
                  }

                  navigate(buildCheckoutPath(registration.id, nextMethod))
                }}
                onSubmitPayment={handleSubmitPayment}
              />
            ) : (
              <article className="panel form-panel">
                <div className="payment-screen__header">
                  <div>
                    <h2>Escolha como pagar</h2>
                    <p className="panel-intro">
                      Selecione uma modalidade para abrir a tela correspondente do pagamento.
                    </p>
                  </div>
                </div>

                <div className="payment-method-grid">
                  {paymentOptions.map((option) => {
                    const Icon = option.icon
                    const targetPath = buildCheckoutPath(registration.id, option.value)

                    return (
                      <button
                        key={option.value}
                        className="payment-method-card"
                        type="button"
                        onClick={() => navigate(targetPath)}
                      >
                        <span className="payment-method-card__icon">
                          <Icon size={22} />
                        </span>
                        <strong>{option.label}</strong>
                        <span>{option.description}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="checkout-notice">
                  <ShieldCheck size={18} />
                  <p>
                    Cada modalidade abre uma tela propria. Cartao vai para os campos do cartao,
                    Pix para QR Code e copia e cola, e boleto para a linha digitavel e vencimento.
                  </p>
                </div>
              </article>
            )}
          </div>

          {selectedPaymentMethod ? null : (
            <aside className="checkout-aside">
              <article className="panel side-panel">
                <h2>Status das integracoes</h2>
                <ul className="bullet-list">
                  <li>
                    Gateway de pagamento:{' '}
                    {integrationStatus.mercadoPagoEnabled
                      ? 'Mercado Pago ativo'
                      : integrationStatus.mercadoPagoConfigured
                        ? 'configurado com pendencias'
                        : 'nao configurado'}
                  </li>
                  <li>
                    Email transacional:{' '}
                    {integrationStatus.resendEnabled ? 'Resend ativo' : 'fila local operacional'}
                  </li>
                  <li>App URL atual: {integrationStatus.appUrl || 'nao definido'}</li>
                  {integrationStatus.mercadoPagoConfigured &&
                  !integrationStatus.mercadoPagoEnabled &&
                  integrationStatus.mercadoPagoWarnings.length > 0 ? (
                    <li>Pendencia do gateway: {integrationStatus.mercadoPagoWarnings[0]}</li>
                  ) : null}
                </ul>
              </article>

              <article className="panel side-panel side-panel--soft">
                <h2>Resumo operacional</h2>
                <div className="checkout-steps">
                  <div className="checkout-step">
                    <span>1</span>
                    <p>Reserva criada com dados completos do atleta.</p>
                  </div>
                  <div className="checkout-step">
                    <span>2</span>
                    <p>O atleta entra na tela especifica de cartao, Pix ou boleto.</p>
                  </div>
                  <div className="checkout-step">
                    <span>3</span>
                    <p>Pagamento atualiza comprovante, painel e comunicacao operacional.</p>
                  </div>
                </div>
              </article>
            </aside>
          )}
        </div>
      </section>
    </SiteLayout>
  )
}

function CheckoutSummary({
  registration,
  registrationStatus,
}: {
  registration: RegistrationRecord
  registrationStatus: string
}) {
  return (
    <article className="panel summary-panel">
      <div className="summary-panel__header">
        <div>
          <span className="section-eyebrow">Checkout da inscricao</span>
          <h1>{registration.raceName}</h1>
        </div>
        <span className="price-badge">{formatCurrency(registration.finalPrice)}</span>
      </div>

      <p className="panel-intro">
        Sua reserva ja foi criada. Agora voce pode aplicar cupom e seguir para a tela de pagamento.
      </p>

      <div className="checkout-summary">
        <div className="checkout-row">
          <span>Numero da reserva</span>
          <strong>{registration.confirmationNumber}</strong>
        </div>
        <div className="checkout-row">
          <span>Status atual</span>
          <strong>{registrationStatus}</strong>
        </div>
        <div className="checkout-row">
          <span>Data da reserva</span>
          <strong>{formatDate(registration.created)}</strong>
        </div>
        <div className="checkout-row">
          <span>Valor da corrida</span>
          <strong>{formatCurrency(registration.racePrice)}</strong>
        </div>
        <div className="checkout-row">
          <span>Desconto</span>
          <strong>-{formatCurrency(registration.discountAmount)}</strong>
        </div>
        <div className="checkout-row">
          <span>Total</span>
          <strong>{formatCurrency(registration.finalPrice)}</strong>
        </div>
      </div>
    </article>
  )
}

export function PaymentMethodScreen({
  boletoBillingForm,
  boletoDueDate,
  boletoLine,
  cardForm,
  integrationStatus,
  isProcessing,
  onMountRef,
  paymentMethod,
  pixBillingForm,
  pixCode,
  pixExpiration,
  registration,
  onBoletoBillingFormChange,
  onCardFormChange,
  onCopyValue,
  onPixBillingFormChange,
  onRefreshPaymentStatus,
  onSubmitPayment,
}: {
  boletoBillingForm: BillingFormState
  boletoDueDate: string
  boletoLine: string
  cardForm: CardFormState
  integrationStatus: IntegrationStatus
  isProcessing: boolean
  onMountRef: RefObject<HTMLDivElement | null>
  paymentMethod: PaymentMethod
  pixBillingForm: BillingFormState
  pixCode: string
  pixExpiration: string
  registration: RegistrationRecord
  onBoletoBillingFormChange: (value: BillingFormState) => void
  onCardFormChange: (value: CardFormState) => void
  onCopyValue: (label: string, value: string) => Promise<void>
  onPixBillingFormChange: (value: BillingFormState) => void
  onRefreshPaymentStatus: () => Promise<void>
  onSubmitPayment: (paymentMethod: PaymentMethod) => Promise<void>
}) {
  const pixPayload = registration.paymentQrCode ?? pixCode
  const pixExpiresAt = registration.paymentExpiresAt ?? pixExpiration
  const boletoPayload = registration.paymentDigitableLine ?? boletoLine
  const boletoExpiresAt = registration.paymentExpiresAt ?? boletoDueDate
  const boletoGatewayUrl = registration.paymentTicketUrl ?? null

  if (paymentMethod === 'card') {
    return (
      <div ref={onMountRef} className="payment-screen payment-scroll-target">
        <div className="payment-screen__intro">
          <span className="section-eyebrow">Tela do cartao</span>
          <h3>Cadastro dos dados do cartao</h3>
          <p>
            {integrationStatus.mercadoPagoEnabled
              ? 'Para manter seguranca e conformidade, os dados finais do cartao serao preenchidos na pagina segura do gateway.'
              : integrationStatus.mercadoPagoConfigured
                ? 'O gateway esta configurado, mas ainda com pendencias. Corrija a integracao antes de cobrar com cartao real.'
              : 'Nesta versao, o atleta preenche os dados do cartao e conclui a simulacao do pagamento nesta tela.'}
          </p>
        </div>

        {integrationStatus.mercadoPagoEnabled ? (
          <div className="checkout-notice">
            <ShieldCheck size={18} />
            <p>
              O proximo passo leva para o checkout seguro do gateway. Esta tela serve como etapa
              de preparo antes do redirecionamento.
            </p>
          </div>
        ) : (
          <form
            className="payment-form-grid"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault()
              void onSubmitPayment('card')
            }}
          >
            <label className="field field--full">
              <span>Nome impresso no cartao</span>
              <input
                className="input"
                placeholder="Como aparece no cartao"
                value={cardForm.cardholderName}
                onChange={(event) =>
                  onCardFormChange({ ...cardForm, cardholderName: event.target.value })
                }
              />
            </label>
            <label className="field field--full">
              <span>Numero do cartao</span>
              <input
                className="input"
                inputMode="numeric"
                placeholder="0000 0000 0000 0000"
                value={cardForm.cardNumber}
                onChange={(event) =>
                  onCardFormChange({ ...cardForm, cardNumber: formatCardNumber(event.target.value) })
                }
              />
            </label>
            <label className="field">
              <span>Validade</span>
              <input
                className="input"
                inputMode="numeric"
                placeholder="MM/AA"
                value={cardForm.expiryDate}
                onChange={(event) =>
                  onCardFormChange({ ...cardForm, expiryDate: formatExpiryDate(event.target.value) })
                }
              />
            </label>
            <label className="field">
              <span>CVV</span>
              <input
                className="input"
                inputMode="numeric"
                placeholder="123"
                value={cardForm.cvv}
                onChange={(event) =>
                  onCardFormChange({ ...cardForm, cvv: onlyDigits(event.target.value).slice(0, 4) })
                }
              />
            </label>
            <label className="field field--full">
              <span>Parcelamento</span>
              <select
                className="input input--select"
                value={cardForm.installments}
                onChange={(event) =>
                  onCardFormChange({ ...cardForm, installments: event.target.value })
                }
              >
                <option value="1">1x de {formatCurrency(registration.finalPrice)}</option>
                <option value="2">
                  2x de {formatCurrency(Number((registration.finalPrice / 2).toFixed(2)))}
                </option>
                <option value="3">
                  3x de {formatCurrency(Number((registration.finalPrice / 3).toFixed(2)))}
                </option>
              </select>
            </label>
            <div className="checkout-actions">
              <button className="button button--primary" disabled={isProcessing} type="submit">
                {isProcessing ? 'Processando cartao...' : 'Pagar com cartao'}
              </button>
            </div>
          </form>
        )}

        {integrationStatus.mercadoPagoEnabled ? (
          <div className="checkout-actions">
            <button
              className="button button--primary"
              disabled={isProcessing}
              type="button"
              onClick={() => void onSubmitPayment('card')}
            >
              {isProcessing ? 'Abrindo gateway...' : 'Ir para pagina segura do cartao'}
            </button>
          </div>
        ) : null}
      </div>
    )
  }

  if (paymentMethod === 'pix') {
    return (
      <div ref={onMountRef} className="payment-screen payment-scroll-target">
        <div className="payment-screen__intro">
          <span className="section-eyebrow">Tela do Pix</span>
          <h3>QR Code e copia e cola do Pix</h3>
          <p>
            O atleta entra na tela do Pix, copia o codigo ou aponta a camera e confirma o
            pagamento desta reserva.
          </p>
        </div>

        <div className="payment-visual-grid">
          <div className="payment-visual-card payment-visual-card--qr">
            {registration.paymentQrCodeBase64 ? (
              <img
                alt="QR Code Pix"
                className="pix-qr-image"
                src={`data:image/png;base64,${registration.paymentQrCodeBase64}`}
              />
            ) : (
              <div className="pix-qr-placeholder" aria-hidden="true">
                <div />
              </div>
            )}
            <strong>Total: {formatCurrency(registration.finalPrice)}</strong>
            <span>Expira em {formatDateTime(pixExpiresAt)}</span>
            <span>
              Status atual: {registration.paymentStatusDetail || 'aguardando geracao do pagamento'}
            </span>
          </div>

          <div className="payment-visual-card">
            <label className="field field--full">
              <span>CPF do pagador</span>
              <input
                className="input"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={pixBillingForm.documentNumber}
                onChange={(event) =>
                  onPixBillingFormChange({
                    ...pixBillingForm,
                    documentNumber: formatCpf(event.target.value),
                  })
                }
              />
            </label>
            <div className="payment-code-box">
              <span>Pix copia e cola</span>
              <strong>{pixPayload}</strong>
            </div>
            <div className="checkout-actions">
              <button
                className="button button--secondary"
                type="button"
                onClick={() => void onCopyValue('Codigo Pix', pixPayload)}
              >
                <Copy size={16} />
                <span>Copiar codigo Pix</span>
              </button>
              <button
                className="button button--primary"
                disabled={isProcessing}
                type="button"
                onClick={() => void onSubmitPayment('pix')}
              >
                {isProcessing
                  ? 'Processando Pix...'
                  : integrationStatus.mercadoPagoEnabled
                    ? registration.paymentQrCode
                      ? 'Gerar novo Pix'
                      : 'Gerar QR Pix real'
                    : 'Confirmar pagamento via Pix'}
              </button>
              {integrationStatus.mercadoPagoEnabled && registration.paymentOrderId ? (
                <button
                  className="button button--ghost"
                  disabled={isProcessing}
                  type="button"
                  onClick={() => void onRefreshPaymentStatus()}
                >
                  <RefreshCw size={16} />
                  <span>Atualizar status</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={onMountRef} className="payment-screen payment-scroll-target">
      <div className="payment-screen__intro">
        <span className="section-eyebrow">Tela do boleto</span>
        <h3>Boleto com linha digitavel e vencimento</h3>
        <p>
          Esta tela mostra o boleto da inscricao, com CPF do pagador, vencimento e linha digitavel
          para concluir o pagamento.
        </p>
      </div>

      <div className="payment-visual-grid">
        <div className="payment-visual-card">
          <div className="payment-form-grid">
            <label className="field field--full">
              <span>CPF do pagador</span>
              <input
                className="input"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={boletoBillingForm.documentNumber}
                onChange={(event) =>
                  onBoletoBillingFormChange({
                    ...boletoBillingForm,
                    documentNumber: formatCpf(event.target.value),
                  })
                }
              />
            </label>
            <label className="field">
              <span>CEP</span>
              <input
                className="input"
                inputMode="numeric"
                placeholder="00000-000"
                value={boletoBillingForm.zipCode}
                onChange={(event) =>
                  onBoletoBillingFormChange({
                    ...boletoBillingForm,
                    zipCode: formatZipCode(event.target.value),
                  })
                }
              />
            </label>
            <label className="field">
              <span>Numero</span>
              <input
                className="input"
                placeholder="123"
                value={boletoBillingForm.streetNumber}
                onChange={(event) =>
                  onBoletoBillingFormChange({
                    ...boletoBillingForm,
                    streetNumber: event.target.value,
                  })
                }
              />
            </label>
            <label className="field field--full">
              <span>Rua</span>
              <input
                className="input"
                placeholder="Rua do Atleta"
                value={boletoBillingForm.streetName}
                onChange={(event) =>
                  onBoletoBillingFormChange({
                    ...boletoBillingForm,
                    streetName: event.target.value,
                  })
                }
              />
            </label>
            <label className="field">
              <span>Bairro</span>
              <input
                className="input"
                placeholder="Centro"
                value={boletoBillingForm.neighborhood}
                onChange={(event) =>
                  onBoletoBillingFormChange({
                    ...boletoBillingForm,
                    neighborhood: event.target.value,
                  })
                }
              />
            </label>
            <label className="field">
              <span>Cidade</span>
              <input
                className="input"
                placeholder="Sao Paulo"
                value={boletoBillingForm.city}
                onChange={(event) =>
                  onBoletoBillingFormChange({
                    ...boletoBillingForm,
                    city: event.target.value,
                  })
                }
              />
            </label>
            <label className="field">
              <span>UF</span>
              <input
                className="input"
                maxLength={2}
                placeholder="SP"
                value={boletoBillingForm.state}
                onChange={(event) =>
                  onBoletoBillingFormChange({
                    ...boletoBillingForm,
                    state: event.target.value.toUpperCase(),
                  })
                }
              />
            </label>
          </div>

          <div className="payment-code-box">
            <span>Linha digitavel</span>
            <strong>{boletoPayload}</strong>
          </div>

          <div className="info-chip info-chip--report">
            <span>Vencimento</span>
            <strong>{formatDate(boletoExpiresAt)}</strong>
            <small>
              Status atual: {registration.paymentStatusDetail || 'aguardando emissao do boleto'}
            </small>
          </div>
        </div>

        <div className="payment-visual-card payment-visual-card--receipt">
          <ReceiptText size={34} />
          <strong>{registration.raceName}</strong>
          <span>Total do boleto: {formatCurrency(registration.finalPrice)}</span>
          <span>Pagador: {registration.fullName}</span>

          <div className="checkout-actions">
            <button
              className="button button--secondary"
              type="button"
              onClick={() => void onCopyValue('Linha digitavel', boletoPayload)}
            >
              <Copy size={16} />
              <span>Copiar linha digitavel</span>
            </button>
            {boletoGatewayUrl ? (
              <a
                className="button button--secondary"
                href={boletoGatewayUrl}
                rel="noreferrer"
                target="_blank"
              >
                Abrir boleto do gateway
              </a>
            ) : null}
            <Link
              className="button button--ghost"
              to={`/payment-slip/${registration.id}`}
            >
              Segunda via / PDF
            </Link>
            <button
              className="button button--primary"
              disabled={isProcessing}
              type="button"
              onClick={() => void onSubmitPayment('boleto')}
            >
              {isProcessing
                ? 'Processando boleto...'
                : integrationStatus.mercadoPagoEnabled
                  ? registration.paymentTicketUrl || registration.paymentDigitableLine
                    ? 'Gerar novo boleto'
                    : 'Gerar boleto real'
                  : 'Confirmar pagamento por boleto'}
            </button>
            {integrationStatus.mercadoPagoEnabled && registration.paymentOrderId ? (
              <button
                className="button button--ghost"
                disabled={isProcessing}
                type="button"
                onClick={() => void onRefreshPaymentStatus()}
              >
                <RefreshCw size={16} />
                <span>Atualizar status</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
