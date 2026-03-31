import { useEffect, useState, type FormEvent } from 'react'
import { Calendar, ChevronLeft, MapPin, Ruler } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useAthleteAuth } from '../components/AthleteAuth'
import { SiteLayout, usePageMeta } from '../components/Layout'
import type { Race } from '../data/races'
import { getPublicRaceById } from '../lib/races-api'
import { createRegistration, type RegistrationFormValues } from '../lib/storage'
import { formatCurrency, formatLongDate } from '../lib/race-utils'
import { NotFoundPage } from './NotFoundPage'

const defaultRegistrationValues: RegistrationFormValues = {
  fullName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  tShirtSize: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
}

type RegistrationErrors = Partial<Record<keyof RegistrationFormValues | 'terms', string>>

export function RegisterPage() {
  const navigate = useNavigate()
  const params = useParams<{ raceId: string }>()
  const { session } = useAthleteAuth()
  const [race, setRace] = useState<Race | null>(null)
  const [formValues, setFormValues] = useState(defaultRegistrationValues)
  const [errors, setErrors] = useState<RegistrationErrors>({})
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [submissionError, setSubmissionError] = useState('')

  useEffect(() => {
    let active = true

    setIsLoading(true)

    void (async () => {
      const nextRace = await getPublicRaceById(params.raceId ?? '')

      if (!active) {
        return
      }

      setRace(nextRace)
      setIsLoading(false)
    })()

    return () => {
      active = false
    }
  }, [params.raceId])

  useEffect(() => {
    if (!session) {
      return
    }

    setFormValues((current) => ({
      ...current,
      email: current.email || session.athlete.email,
      fullName: current.fullName || session.athlete.name,
    }))
  }, [session])

  usePageMeta(
    race ? `RunTrack | Inscricao para ${race.name}` : 'RunTrack | Inscricao',
    race
      ? `Registre a inscricao para ${race.name} e siga para a etapa de pagamento.`
      : 'Registre a inscricao para uma corrida.',
  )

  if (isLoading) {
    return (
      <SiteLayout>
        <section className="section section--compact">
          <div className="container">
            <article className="panel confirmation-empty">
              <h1>Carregando evento</h1>
              <p>Buscando os dados mais recentes da corrida.</p>
            </article>
          </div>
        </section>
      </SiteLayout>
    )
  }

  if (!race) {
    return <NotFoundPage />
  }

  const selectedRace = race

  function updateField(field: keyof RegistrationFormValues, value: string) {
    setFormValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function validate() {
    const nextErrors: RegistrationErrors = {}

    if (!formValues.fullName.trim()) {
      nextErrors.fullName = 'Nome completo e obrigatorio.'
    }
    if (!formValues.email.trim()) {
      nextErrors.email = 'Email e obrigatorio.'
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formValues.email)) {
      nextErrors.email = 'Informe um email valido.'
    }
    if (!formValues.phone.trim()) {
      nextErrors.phone = 'Telefone e obrigatorio.'
    }
    if (!formValues.dateOfBirth.trim()) {
      nextErrors.dateOfBirth = 'Data de nascimento e obrigatoria.'
    }
    if (!formValues.tShirtSize.trim()) {
      nextErrors.tShirtSize = 'Selecione o tamanho da camiseta.'
    }
    if (!formValues.emergencyContactName.trim()) {
      nextErrors.emergencyContactName = 'Informe um contato de emergencia.'
    }
    if (!formValues.emergencyContactPhone.trim()) {
      nextErrors.emergencyContactPhone = 'Informe o telefone do contato de emergencia.'
    }
    if (!acceptedTerms) {
      nextErrors.terms = 'Voce precisa aceitar os termos para continuar.'
    }

    return nextErrors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validate()
    setErrors(nextErrors)
    setSubmissionError('')

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const registration = await createRegistration(formValues, selectedRace)
      navigate(`/checkout/${registration.id}`)
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : 'Nao foi possivel criar a reserva.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SiteLayout>
      <section className="section section--compact">
        <div className="container registration-layout">
          <div className="registration-main">
            <Link className="back-link" to="/races">
              <ChevronLeft size={16} />
              <span>Voltar para corridas</span>
            </Link>

            <article className="panel summary-panel">
              <div className="summary-panel__header">
                <div>
                  <span className="section-eyebrow">Reserva da vaga</span>
                  <h1>{selectedRace.name}</h1>
                </div>
                <span className="price-badge">{formatCurrency(selectedRace.price)}</span>
              </div>

              <div className="summary-panel__meta">
                <span>
                  <Calendar size={15} />
                  <span>{formatLongDate(selectedRace.date)}</span>
                </span>
                <span>
                  <MapPin size={15} />
                  <span>{selectedRace.location}</span>
                </span>
                <span>
                  <Ruler size={15} />
                  <span>{selectedRace.distance} km</span>
                </span>
              </div>

              {selectedRace.description ? (
                <p className="summary-panel__description">{selectedRace.description}</p>
              ) : null}
            </article>

            <article className="panel form-panel">
              <h2>Dados do atleta</h2>
              <p className="panel-intro">
                Esta etapa cria a reserva da vaga e prepara a inscricao para a confirmacao
                do pagamento logo em seguida.
              </p>

              {session ? (
                <div className="success-note">
                  Conta conectada: esta reserva sera sincronizada com {session.athlete.email}.
                </div>
              ) : (
                <div className="checkout-notice">
                  <p>
                    Se voce entrar na conta do atleta, esta inscricao podera ser sincronizada na
                    nuvem e acessada em outros dispositivos.
                  </p>
                </div>
              )}

              {submissionError ? (
                <div className="success-note success-note--error">{submissionError}</div>
              ) : null}

              <form className="registration-form" onSubmit={handleSubmit} noValidate>
                <div className="form-grid">
                  <RegistrationField
                    error={errors.fullName}
                    label="Nome completo *"
                    name="fullName"
                    placeholder="Joao da Silva"
                    value={formValues.fullName}
                    onChange={updateField}
                  />
                  <RegistrationField
                    error={errors.email}
                    label="Email *"
                    name="email"
                    placeholder="joao@exemplo.com"
                    type="email"
                    value={formValues.email}
                    onChange={updateField}
                  />
                  <RegistrationField
                    error={errors.phone}
                    label="Telefone *"
                    name="phone"
                    placeholder="(11) 91234-5678"
                    type="tel"
                    value={formValues.phone}
                    onChange={updateField}
                  />
                  <RegistrationField
                    error={errors.dateOfBirth}
                    label="Data de nascimento *"
                    name="dateOfBirth"
                    type="date"
                    value={formValues.dateOfBirth}
                    onChange={updateField}
                  />
                  <label className="field">
                    <span>Tamanho da camiseta *</span>
                    <select
                      className="input input--select"
                      value={formValues.tShirtSize}
                      onChange={(event) => updateField('tShirtSize', event.target.value)}
                    >
                      <option value="">Selecione um tamanho</option>
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    {errors.tShirtSize ? <p className="field-error">{errors.tShirtSize}</p> : null}
                  </label>
                  <RegistrationField
                    error={errors.emergencyContactName}
                    label="Contato de emergencia *"
                    name="emergencyContactName"
                    placeholder="Maria da Silva"
                    value={formValues.emergencyContactName}
                    onChange={updateField}
                  />
                  <RegistrationField
                    className="field--full"
                    error={errors.emergencyContactPhone}
                    label="Telefone do contato de emergencia *"
                    name="emergencyContactPhone"
                    placeholder="(11) 98765-4321"
                    type="tel"
                    value={formValues.emergencyContactPhone}
                    onChange={updateField}
                  />
                </div>

                <label className="terms-box">
                  <input
                    checked={acceptedTerms}
                    type="checkbox"
                    onChange={(event) => {
                      setAcceptedTerms(event.target.checked)
                      setErrors((current) => ({ ...current, terms: undefined }))
                    }}
                  />
                  <span>
                    Aceito os termos, autorizo o uso dos meus dados para a operacao do
                    evento e entendo que a vaga sera confirmada apos o pagamento.
                  </span>
                </label>

                {errors.terms ? <p className="field-error">{errors.terms}</p> : null}

                <button
                  className="button button--primary form-submit"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Criando reserva...' : 'Continuar para pagamento'}
                </button>
              </form>
            </article>
          </div>

          <aside className="registration-aside">
            <article className="panel side-panel">
              <h2>O que este fluxo resolve</h2>
              <ul className="bullet-list">
                <li>Capta o atleta com os dados completos da inscricao.</li>
                <li>Reserva a vaga antes de abrir a etapa de pagamento.</li>
                <li>Dispara a base para recibo, painel e operacao do evento.</li>
              </ul>
            </article>

            <article className="panel side-panel side-panel--soft">
              <h2>Depois desta etapa</h2>
              <p>
                Na proxima tela o atleta escolhe o meio de pagamento e a inscricao passa a
                ser acompanhada no painel do organizador.
              </p>
            </article>
          </aside>
        </div>
      </section>
    </SiteLayout>
  )
}

function RegistrationField({
  className,
  error,
  label,
  name,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  className?: string
  error?: string
  label: string
  name: keyof RegistrationFormValues
  onChange: (field: keyof RegistrationFormValues, value: string) => void
  placeholder?: string
  type?: string
  value: string
}) {
  return (
    <label className={`field${className ? ` ${className}` : ''}`}>
      <span>{label}</span>
      <input
        className="input"
        name={name}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      />
      {error ? <p className="field-error">{error}</p> : null}
    </label>
  )
}
