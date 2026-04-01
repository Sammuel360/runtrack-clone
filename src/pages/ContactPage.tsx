import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { SiteLayout, usePageMeta } from '../components/Layout'
import { createContactLead, type ContactLeadValues } from '../lib/storage'

type ContactErrors = Partial<Record<keyof ContactLeadValues, string>>

export function ContactPage() {
  const [searchParams] = useSearchParams()
  const initialAudience = searchParams.get('audience') === 'organizer' ? 'organizer' : 'runner'
  const [formValues, setFormValues] = useState<ContactLeadValues>({
    name: '',
    email: '',
    phone: '',
    audience: initialAudience,
    companyOrTeam: '',
    message: '',
  })
  const [errors, setErrors] = useState<ContactErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  usePageMeta(
    'RunTrack | Contato e captacao de oportunidades',
    'Receba contatos de atletas, organizadores, patrocinadores e parceiros em uma pagina preparada para conversao e operacao.',
  )

  function updateField(field: keyof ContactLeadValues, value: string) {
    setFormValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function validate() {
    const nextErrors: ContactErrors = {}

    if (!formValues.name.trim()) {
      nextErrors.name = 'Nome e obrigatorio.'
    }

    if (!formValues.email.trim()) {
      nextErrors.email = 'Email e obrigatorio.'
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formValues.email)) {
      nextErrors.email = 'Informe um email valido.'
    }

    if (!formValues.message.trim()) {
      nextErrors.message = 'Descreva sua necessidade.'
    }

    return nextErrors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      await createContactLead(formValues)
      setSubmitted(true)
      setFormValues({
        name: '',
        email: '',
        phone: '',
        audience: formValues.audience,
        companyOrTeam: '',
        message: '',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const organizerMode = formValues.audience === 'organizer'

  return (
    <SiteLayout>
      <section className="page-hero">
        <div className="container page-hero__content">
          <span className="section-eyebrow">Canal comercial</span>
          <h1>Contato funcional para atleta, organizador e parceiro</h1>
          <p>
            Esta pagina deixa o site util como canal de captacao. Toda mensagem entra no
            backend e gera um email operacional para validacao do fluxo do produto.
          </p>
        </div>
      </section>

      <section className="section section--compact">
        <div className="container contact-layout">
          <article className="panel contact-panel">
            <h2>Envie sua mensagem</h2>
            <p className="panel-intro">
              Use este formulario para demonstrar interesse, pedir suporte ou publicar um
              novo evento.
            </p>

            {submitted ? (
              <div className="success-note">
                Mensagem registrada com sucesso. O lead entrou no painel e um email foi
                preparado para o time comercial.
              </div>
            ) : null}

            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <ContactField
                  error={errors.name}
                  label="Nome *"
                  name="name"
                  placeholder="Seu nome"
                  value={formValues.name}
                  onChange={updateField}
                />
                <ContactField
                  error={errors.email}
                  label="Email *"
                  name="email"
                  placeholder="voce@empresa.com"
                  value={formValues.email}
                  onChange={updateField}
                />
                <ContactField
                  error={errors.phone}
                  label="Telefone"
                  name="phone"
                  placeholder="(11) 99999-9999"
                  value={formValues.phone}
                  onChange={updateField}
                />
                <label className="field">
                  <span>Perfil</span>
                  <select
                    className="input input--select"
                    value={formValues.audience}
                    onChange={(event) =>
                      updateField('audience', event.target.value as ContactLeadValues['audience'])
                    }
                  >
                    <option value="runner">Sou atleta</option>
                    <option value="organizer">Sou organizador</option>
                  </select>
                </label>
                <ContactField
                  className="field--full"
                  error={errors.companyOrTeam}
                  label={organizerMode ? 'Empresa ou evento' : 'Equipe ou assessoria'}
                  name="companyOrTeam"
                  placeholder={organizerMode ? 'Nome do evento ou empresa' : 'Nome da equipe'}
                  value={formValues.companyOrTeam}
                  onChange={updateField}
                />
              </div>

              <label className="field">
                <span>Mensagem *</span>
                <textarea
                  className="input textarea"
                  placeholder={
                    organizerMode
                      ? 'Descreva o evento, cidade, publico e o que voce quer publicar.'
                      : 'Conte o que voce procura: prova, parceria, suporte ou assessoria.'
                  }
                  value={formValues.message}
                  onChange={(event) => updateField('message', event.target.value)}
                />
                {errors.message ? <p className="field-error">{errors.message}</p> : null}
              </label>

              <button className="button button--primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar mensagem'}
              </button>
            </form>
          </article>

          <aside className="contact-aside">
            <article className="panel side-panel">
              <h2>O que este canal resolve</h2>
              <ul className="bullet-list">
                <li>Capta leads de atletas e organizadores no mesmo produto.</li>
                <li>Valida demanda antes de investir em integracoes pesadas.</li>
                <li>Abre caminho para comercial, parcerias e expansao do catalogo.</li>
              </ul>
            </article>

            <article className="panel side-panel side-panel--soft">
              <h2>Depois deste MVP</h2>
              <p>
                O passo natural agora e trocar os disparos simulados por CRM, email
                transacional e onboarding real de novos eventos.
              </p>
              <Link className="button button--secondary" to="/contact?audience=organizer">
                Falar sobre onboarding
              </Link>
            </article>
          </aside>
        </div>
      </section>
    </SiteLayout>
  )
}

function ContactField({
  className,
  error,
  label,
  name,
  onChange,
  placeholder,
  value,
}: {
  className?: string
  error?: string
  label: string
  name: keyof ContactLeadValues
  onChange: (field: keyof ContactLeadValues, value: string) => void
  placeholder: string
  value: string
}) {
  return (
    <label className={`field${className ? ` ${className}` : ''}`}>
      <span>{label}</span>
      <input
        className="input"
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      />
      {error ? <p className="field-error">{error}</p> : null}
    </label>
  )
}
