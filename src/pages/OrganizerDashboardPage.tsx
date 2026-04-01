import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  BarChart3,
  Bell,
  CheckCircle2,
  CreditCard,
  Gift,
  Menu,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  TicketPercent,
  Trash2,
  Users,
  X,
} from 'lucide-react'

import { useOrganizerAuth } from '../components/OrganizerAuth'
import { OperatorLayout, usePageMeta } from '../components/Layout'
import type { Race, RaceStatus } from '../data/races'
import {
  createOrganizerRace,
  deleteOrganizerRace,
  updateOrganizerRace,
  type RaceMutationValues,
} from '../lib/races-api'
import {
  formatDate,
  formatDateTime,
  getAudienceLabel,
  getEmailKindLabel,
  getEmailStatusMeta,
  getPaymentMethodLabel,
  getRegistrationStatusMeta,
} from '../lib/registration-utils'
import { formatCurrency } from '../lib/race-utils'
import {
  createOrganizerCoupon,
  deleteOrganizerCoupon,
  getDashboardSnapshot,
  getIntegrationStatus,
  sendQueuedEmails,
  updateOrganizerCoupon,
  updateOrganizerRegistrationOperations,
  type CheckInStatus,
  type ContactLeadRecord,
  type CouponMutationValues,
  type CouponRecord,
  type DashboardReports,
  type DashboardSummary,
  type EmailQueueRecord,
  type IntegrationStatus,
  type KitStatus,
  type RegistrationRecord,
} from '../lib/storage'

type RaceFormState = {
  name: string
  date: string
  description: string
  distance: string
  featured: boolean
  imageUrl: string
  location: string
  price: string
  status: RaceStatus
  time: string
}

type CouponFormState = {
  code: string
  description: string
  type: 'percent' | 'fixed'
  value: string
  active: boolean
  usageLimit: string
  validFrom: string
  validUntil: string
  raceIds: string[]
}

type OrganizerWorkspace = 'dashboard' | 'operations' | 'events' | 'campaigns'
type OperatorTone = 'success' | 'warning' | 'neutral'

const emptySummary: DashboardSummary = {
  totalRaces: 0,
  totalRegistrations: 0,
  paidRegistrations: 0,
  pendingRegistrations: 0,
  totalLeads: 0,
  organizerLeads: 0,
  queuedEmails: 0,
  revenue: 0,
  conversionRate: 0,
  totalDiscount: 0,
  checkedInCount: 0,
  kitsDeliveredCount: 0,
}

const emptyReports: DashboardReports = {
  byRace: [],
  couponUsage: [],
  totalDiscount: 0,
  checkedInCount: 0,
  kitsDeliveredCount: 0,
}

const emptyIntegrations: IntegrationStatus = {
  mercadoPagoConfigured: false,
  mercadoPagoEnabled: false,
  mercadoPagoWarnings: [],
  resendEnabled: false,
  appUrl: '',
  webhookUrl: '',
}

const emptyRaceForm: RaceFormState = {
  name: '',
  date: '',
  description: '',
  distance: '5',
  featured: false,
  imageUrl: '',
  location: '',
  price: '0',
  status: 'draft',
  time: '',
}

const emptyCouponForm: CouponFormState = {
  code: '',
  description: '',
  type: 'percent',
  value: '10',
  active: true,
  usageLimit: '',
  validFrom: '',
  validUntil: '',
  raceIds: [],
}

export function OrganizerDashboardPage() {
  const { session } = useOrganizerAuth()
  const [races, setRaces] = useState<Race[]>([])
  const [coupons, setCoupons] = useState<CouponRecord[]>([])
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([])
  const [contactLeads, setContactLeads] = useState<ContactLeadRecord[]>([])
  const [emailQueue, setEmailQueue] = useState<EmailQueueRecord[]>([])
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary)
  const [reports, setReports] = useState<DashboardReports>(emptyReports)
  const [integrations, setIntegrations] = useState<IntegrationStatus>(emptyIntegrations)
  const [raceForm, setRaceForm] = useState<RaceFormState>(emptyRaceForm)
  const [couponForm, setCouponForm] = useState<CouponFormState>(emptyCouponForm)
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null)
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSendingEmails, setIsSendingEmails] = useState(false)
  const [isSavingRace, setIsSavingRace] = useState(false)
  const [isSavingCoupon, setIsSavingCoupon] = useState(false)
  const [busyRegistrationId, setBusyRegistrationId] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [activeWorkspace, setActiveWorkspace] = useState<OrganizerWorkspace>('dashboard')
  const [isDesktopViewport, setIsDesktopViewport] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  const [isSidebarDrawerOpen, setIsSidebarDrawerOpen] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)

  usePageMeta(
    'RunTrack | Painel do organizador',
    'Gerencie corridas, pagamentos, cupons, operacao de kit, check-in, leads e relatorios em um unico painel.',
  )

  const sortedRegistrations = useMemo(
    () =>
      [...registrations].sort(
        (left, right) => Date.parse(right.created) - Date.parse(left.created),
      ),
    [registrations],
  )

  async function refreshDashboard() {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const [snapshot, nextIntegrations] = await Promise.all([
        getDashboardSnapshot(),
        getIntegrationStatus(),
      ])

      setRaces(snapshot.races)
      setCoupons(snapshot.coupons)
      setRegistrations(snapshot.registrations)
      setContactLeads(snapshot.contactLeads)
      setEmailQueue(snapshot.emailQueue)
      setSummary(snapshot.summary)
      setReports(snapshot.reports)
      setIntegrations(nextIntegrations)
      setLastSyncedAt(new Date().toISOString())
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel carregar o painel.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshDashboard()
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1025px)')
    const handleMediaChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktopViewport(event.matches)

      if (event.matches) {
        setIsSidebarDrawerOpen(false)
      }
    }

    handleMediaChange(mediaQuery)

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleMediaChange)

      return () => mediaQuery.removeEventListener('change', handleMediaChange)
    }

    mediaQuery.addListener(handleMediaChange)

    return () => mediaQuery.removeListener(handleMediaChange)
  }, [])

  useEffect(() => {
    if (!isSidebarDrawerOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isSidebarDrawerOpen])

  useEffect(() => {
    if (!isSidebarDrawerOpen) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarDrawerOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarDrawerOpen])

  function updateRaceFormField<K extends keyof RaceFormState>(field: K, value: RaceFormState[K]) {
    setRaceForm((current) => ({ ...current, [field]: value }))
  }

  function updateCouponFormField<K extends keyof CouponFormState>(
    field: K,
    value: CouponFormState[K],
  ) {
    setCouponForm((current) => ({ ...current, [field]: value }))
  }

  function resetRaceForm() {
    setEditingRaceId(null)
    setRaceForm(emptyRaceForm)
  }

  function resetCouponForm() {
    setEditingCouponId(null)
    setCouponForm(emptyCouponForm)
  }

  function handleWorkspaceChange(workspace: OrganizerWorkspace) {
    setActiveWorkspace(workspace)
    setIsSidebarDrawerOpen(false)
  }

  function toggleSidebarCollapse() {
    setIsSidebarCollapsed((current) => !current)
  }

  function openSidebarDrawer() {
    setIsSidebarDrawerOpen(true)
  }

  function closeSidebarDrawer() {
    setIsSidebarDrawerOpen(false)
  }

  function startEditingRace(race: Race) {
    handleWorkspaceChange('events')
    setEditingRaceId(race.id)
    setRaceForm({
      name: race.name,
      date: race.date,
      description: race.description,
      distance: String(race.distance),
      featured: race.featured,
      imageUrl: race.imageUrl,
      location: race.location,
      price: String(race.price),
      status: race.status,
      time: race.time,
    })
  }

  function startEditingCoupon(coupon: CouponRecord) {
    handleWorkspaceChange('campaigns')
    setEditingCouponId(coupon.id)
    setCouponForm({
      code: coupon.code,
      description: coupon.description,
      type: coupon.type,
      value: String(coupon.value),
      active: coupon.active,
      usageLimit: coupon.usageLimit === null ? '' : String(coupon.usageLimit),
      validFrom: coupon.validFrom ? coupon.validFrom.slice(0, 10) : '',
      validUntil: coupon.validUntil ? coupon.validUntil.slice(0, 10) : '',
      raceIds: coupon.raceIds,
    })
  }

  async function handleSendQueuedEmails() {
    setIsSendingEmails(true)
    setFeedbackMessage('')
    setErrorMessage('')

    try {
      await sendQueuedEmails()
      await refreshDashboard()
      setFeedbackMessage('Fila de emails processada com sucesso.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel enviar emails.')
    } finally {
      setIsSendingEmails(false)
    }
  }

  async function handleRaceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSavingRace(true)
    setFeedbackMessage('')
    setErrorMessage('')

    const payload: RaceMutationValues = {
      name: raceForm.name.trim(),
      date: raceForm.date,
      description: raceForm.description.trim(),
      distance: Number(raceForm.distance),
      featured: raceForm.featured,
      imageUrl: raceForm.imageUrl.trim(),
      location: raceForm.location.trim(),
      price: Number(raceForm.price),
      status: raceForm.status,
      time: raceForm.time.trim(),
    }

    try {
      if (editingRaceId) {
        await updateOrganizerRace(editingRaceId, payload)
        setFeedbackMessage('Evento atualizado com sucesso.')
      } else {
        await createOrganizerRace(payload)
        setFeedbackMessage('Evento criado com sucesso.')
      }

      resetRaceForm()
      await refreshDashboard()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel salvar o evento.')
    } finally {
      setIsSavingRace(false)
    }
  }

  async function handleDeleteRace(race: Race) {
    if (!window.confirm(`Deseja remover o evento "${race.name}"?`)) {
      return
    }

    try {
      await deleteOrganizerRace(race.id)
      if (editingRaceId === race.id) {
        resetRaceForm()
      }
      await refreshDashboard()
      setFeedbackMessage('Evento removido do catalogo.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel remover o evento.')
    }
  }

  async function handleCouponSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSavingCoupon(true)
    setFeedbackMessage('')
    setErrorMessage('')

    const payload: CouponMutationValues = {
      code: couponForm.code.trim().toUpperCase(),
      description: couponForm.description.trim(),
      type: couponForm.type,
      value: Number(couponForm.value),
      active: couponForm.active,
      raceIds: couponForm.raceIds,
      usageLimit: couponForm.usageLimit.trim() ? Number(couponForm.usageLimit) : null,
      validFrom: couponForm.validFrom || null,
      validUntil: couponForm.validUntil || null,
    }

    try {
      if (editingCouponId) {
        await updateOrganizerCoupon(editingCouponId, payload)
        setFeedbackMessage('Cupom atualizado com sucesso.')
      } else {
        await createOrganizerCoupon(payload)
        setFeedbackMessage('Cupom criado com sucesso.')
      }

      resetCouponForm()
      await refreshDashboard()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel salvar o cupom.')
    } finally {
      setIsSavingCoupon(false)
    }
  }

  async function handleDeleteCoupon(coupon: CouponRecord) {
    if (!window.confirm(`Deseja remover o cupom "${coupon.code}"?`)) {
      return
    }

    try {
      await deleteOrganizerCoupon(coupon.id)
      if (editingCouponId === coupon.id) {
        resetCouponForm()
      }
      await refreshDashboard()
      setFeedbackMessage('Cupom removido com sucesso.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel remover o cupom.')
    }
  }

  async function handleOperationUpdate(
    registration: RegistrationRecord,
    payload: {
      checkInStatus?: CheckInStatus
      kitStatus?: KitStatus
    },
    successMessage: string,
  ) {
    setBusyRegistrationId(registration.id)
    setFeedbackMessage('')
    setErrorMessage('')

    try {
      await updateOrganizerRegistrationOperations(registration.id, payload)
      await refreshDashboard()
      setFeedbackMessage(successMessage)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel atualizar a operacao.',
      )
    } finally {
      setBusyRegistrationId(null)
    }
  }

  function toggleCouponRace(raceId: string) {
    updateCouponFormField(
      'raceIds',
      couponForm.raceIds.includes(raceId)
        ? couponForm.raceIds.filter((currentRaceId) => currentRaceId !== raceId)
        : [...couponForm.raceIds, raceId],
    )
  }

  const publishedRaces = races.filter((race) => race.status === 'published').length
  const queuedEmails = emailQueue.filter((email) => email.status === 'queued')
  const draftRaces = Math.max(races.length - publishedRaces, 0)
  const readyKits = registrations.filter((registration) => registration.kitStatus === 'separated').length
  const featuredRaces = races.filter((race) => race.featured).length
  const workspaceItems: Array<{
    key: OrganizerWorkspace
    label: string
    description: string
    count: string
    icon: typeof BarChart3
  }> = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      description: 'Visao executiva e inteligencia',
      count: `${summary.totalRegistrations}`,
      icon: BarChart3,
    },
    {
      key: 'operations',
      label: 'Operacao',
      description: 'Fila, check-in e comunicacao',
      count: `${summary.pendingRegistrations}`,
      icon: PackageCheck,
    },
    {
      key: 'events',
      label: 'Eventos',
      description: 'Cadastro e catalogo de corridas',
      count: `${races.length}`,
      icon: Pencil,
    },
    {
      key: 'campaigns',
      label: 'Campanhas',
      description: 'Cupons e regras comerciais',
      count: `${coupons.length}`,
      icon: Gift,
    },
  ]
  const activeWorkspaceItem =
    workspaceItems.find((item) => item.key === activeWorkspace) ?? workspaceItems[0]
  const showSidebarFooter = !isDesktopViewport || !isSidebarCollapsed
  const lastSyncedLabel = lastSyncedAt ? formatDateTime(lastSyncedAt) : 'Sincronizando dados'
  const workspaceHighlights: Record<
    OrganizerWorkspace,
    Array<{ label: string; value: string; tone: OperatorTone }>
  > = {
    dashboard: [
      { label: 'Conversao', value: `${summary.conversionRate}%`, tone: 'success' },
      { label: 'Receita', value: formatCurrency(summary.revenue), tone: 'neutral' },
      { label: 'Eventos publicados', value: `${publishedRaces}`, tone: 'neutral' },
    ],
    operations: [
      { label: 'Pendencias', value: `${summary.pendingRegistrations}`, tone: 'warning' },
      { label: 'Kits prontos', value: `${readyKits}`, tone: 'success' },
      { label: 'Emails na fila', value: `${queuedEmails.length}`, tone: 'neutral' },
    ],
    events: [
      { label: 'Catalogo total', value: `${races.length}`, tone: 'neutral' },
      { label: 'Em destaque', value: `${featuredRaces}`, tone: 'success' },
      { label: 'Rascunhos', value: `${draftRaces}`, tone: draftRaces > 0 ? 'warning' : 'success' },
    ],
    campaigns: [
      { label: 'Cupons ativos', value: `${coupons.filter((coupon) => coupon.active).length}`, tone: 'success' },
      { label: 'Uso monitorado', value: `${reports.couponUsage.length}`, tone: 'neutral' },
      { label: 'Desconto total', value: formatCurrency(summary.totalDiscount), tone: 'warning' },
    ],
  }
  const organizerInitials =
    session?.organizer.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'OP'
  const operatorAlertCount =
    summary.pendingRegistrations +
    queuedEmails.length +
    (integrations.mercadoPagoEnabled ? 0 : 1) +
    (integrations.resendEnabled ? 0 : 1)
  const operatorInboxCount = contactLeads.length + queuedEmails.length
  const primaryRaceReports = reports.byRace.slice(0, 5)
  const maxPrimaryRaceRegistrations = Math.max(
    1,
    ...primaryRaceReports.map((raceReport) => raceReport.registrations),
  )
  const revenueMix = (() => {
    const palette = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e']
    const ranked = [...reports.byRace]
      .filter((raceReport) => raceReport.revenue > 0)
      .sort((left, right) => right.revenue - left.revenue)
    const totalRevenue = ranked.reduce((sum, raceReport) => sum + raceReport.revenue, 0)

    if (totalRevenue === 0) {
      return {
        chart: 'conic-gradient(#d7dfeb 0deg 360deg)',
        items: [] as Array<{ color: string; label: string; share: number; value: number }>,
      }
    }

    const baseItems = ranked.slice(0, 3).map((raceReport, index) => ({
      color: palette[index] ?? palette[palette.length - 1],
      label: raceReport.raceName,
      value: raceReport.revenue,
    }))
    const otherRevenue = ranked.slice(3).reduce((sum, raceReport) => sum + raceReport.revenue, 0)
    const items =
      otherRevenue > 0
        ? [...baseItems, { color: palette[3], label: 'Outras provas', value: otherRevenue }]
        : baseItems

    let startAngle = 0
    const gradientStops = items.map((item) => {
      const share = totalRevenue === 0 ? 0 : item.value / totalRevenue
      const endAngle = startAngle + share * 360
      const stop = `${item.color} ${startAngle}deg ${endAngle}deg`
      startAngle = endAngle
      return stop
    })

    return {
      chart: `conic-gradient(${gradientStops.join(', ')})`,
      items: items.map((item) => ({
        ...item,
        share: Math.round((item.value / totalRevenue) * 100),
      })),
    }
  })()

  function renderReportsPanel() {
    return (
      <article className="panel dashboard-panel">
        <div className="dashboard-panel__header">
          <div>
            <span className="section-eyebrow">Relatorios</span>
            <h2>Leitura operacional por corrida</h2>
          </div>
          <BarChart3 size={18} />
        </div>

        {primaryRaceReports.length === 0 ? (
          <div className="dashboard-empty">
            <h3>Sem dados operacionais ainda</h3>
            <p>Assim que as corridas receberem inscricoes, a leitura executiva aparece aqui.</p>
          </div>
        ) : (
          <>
            <div className="operator-report-board">
              {primaryRaceReports.map((raceReport) => (
                <div key={raceReport.raceId} className="operator-report-row">
                  <div className="operator-report-row__copy">
                    <strong>{raceReport.raceName}</strong>
                    <span>
                      {raceReport.paidRegistrations} pagas | {formatCurrency(raceReport.revenue)}
                    </span>
                  </div>
                  <div className="operator-report-row__track" aria-hidden="true">
                    <span
                      style={{
                        width: `${Math.max(
                          14,
                          Math.round(
                            (raceReport.registrations / maxPrimaryRaceRegistrations) * 100,
                          ),
                        )}%`,
                      }}
                    />
                  </div>
                  <strong className="operator-report-row__value">
                    {raceReport.registrations}
                  </strong>
                </div>
              ))}
            </div>

            <div className="report-grid">
              {reports.byRace.map((raceReport) => (
                <div key={raceReport.raceId} className="info-chip info-chip--report">
                  <span>{raceReport.raceName}</span>
                  <strong>{raceReport.registrations} inscricoes</strong>
                  <small>
                    {raceReport.paidRegistrations} pagas | {raceReport.checkedIn} check-ins |{' '}
                    {formatCurrency(raceReport.revenue)}
                  </small>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="report-grid">
          {reports.couponUsage.length === 0 ? (
            <div className="dashboard-empty">
              <h3>Nenhum cupom utilizado ainda</h3>
              <p>Crie campanhas promocionais para acompanhar adesao e impacto em receita.</p>
            </div>
          ) : (
            reports.couponUsage.map((couponReport) => (
              <div key={couponReport.code} className="info-chip info-chip--report">
                <span>{couponReport.code}</span>
                <strong>{couponReport.usedCount} uso(s)</strong>
                <small>
                  {couponReport.active ? 'Ativo' : 'Inativo'} | desconto acumulado{' '}
                  {formatCurrency(couponReport.revenueImpact)}
                </small>
              </div>
            ))
          )}
        </div>
      </article>
    )
  }

  function renderIntegrationsPanel() {
    return (
      <article className="panel dashboard-panel">
        <div className="dashboard-panel__header">
          <div>
            <span className="section-eyebrow">Infra</span>
            <h2>Status das integracoes</h2>
          </div>
        </div>
        <div className="dashboard-list dashboard-list--compact">
          <div className="dashboard-list-item">
            <div className="dashboard-list-item__header">
              <h3>Gateway de pagamento</h3>
            </div>
            <p className="dashboard-list-item__message">
              {integrations.mercadoPagoEnabled
                ? 'Mercado Pago configurado e pronto para checkout externo.'
                : integrations.mercadoPagoConfigured
                  ? 'Mercado Pago com pendencias de configuracao. O checkout real fica bloqueado ate corrigir isso.'
                  : 'Mercado Pago ainda nao configurado. O fluxo usa aprovacao operacional.'}
            </p>
          </div>
          {integrations.mercadoPagoConfigured && !integrations.mercadoPagoEnabled ? (
            <div className="dashboard-callout">
              <strong>Pendencia principal</strong>
              <span>{integrations.mercadoPagoWarnings[0] || 'Revise a configuracao do gateway.'}</span>
            </div>
          ) : null}
          <div className="dashboard-list-item">
            <div className="dashboard-list-item__header">
              <h3>Email transacional</h3>
            </div>
            <p className="dashboard-list-item__message">
              {integrations.resendEnabled
                ? 'Resend conectado para disparo real dos emails da fila.'
                : 'Emails ainda em modo fila local. Configure a chave para disparo real.'}
            </p>
          </div>
          <div className="dashboard-callout">
            <strong>App URL</strong>
            <span>{integrations.appUrl || 'Nao definido'}</span>
          </div>
          <div className="dashboard-callout">
            <strong>Webhook</strong>
            <span>{integrations.webhookUrl || 'Nao definido'}</span>
          </div>
        </div>
      </article>
    )
  }

  function renderRevenueMixPanel() {
    return (
      <article className="panel dashboard-panel">
        <div className="dashboard-panel__header">
          <div>
            <span className="section-eyebrow">Receita</span>
            <h2>Distribuicao por prova</h2>
          </div>
          <span>{reports.byRace.length} fonte(s)</span>
        </div>

        {revenueMix.items.length === 0 ? (
          <div className="dashboard-empty">
            <h3>Sem receita consolidada</h3>
            <p>Publique eventos e conclua pagamentos para visualizar a distribuicao aqui.</p>
          </div>
        ) : (
          <div className="operator-donut-panel">
            <div className="operator-donut-chart" style={{ background: revenueMix.chart }}>
              <div className="operator-donut-chart__center">
                <span>Total</span>
                <strong>{formatCurrency(summary.revenue)}</strong>
              </div>
            </div>

            <div className="operator-donut-legend">
              {revenueMix.items.map((item) => (
                <div key={item.label} className="operator-donut-legend__item">
                  <span
                    className="operator-donut-legend__swatch"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <strong>{item.label}</strong>
                    <span>
                      {item.share}% | {formatCurrency(item.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>
    )
  }

  function renderLeadsPanel() {
    return (
      <article className="panel dashboard-panel">
        <div className="dashboard-panel__header">
          <div>
            <span className="section-eyebrow">Leads</span>
            <h2>Contato comercial</h2>
          </div>
          <span>{contactLeads.length}</span>
        </div>
        {contactLeads.length === 0 ? (
          <div className="dashboard-empty">
            <h3>Nenhum lead recebido</h3>
            <p>O formulario comercial vai alimentar esta fila automaticamente.</p>
          </div>
        ) : (
          <div className="dashboard-list dashboard-list--compact">
            {contactLeads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="dashboard-list-item">
                <div className="dashboard-list-item__header">
                  <div>
                    <h3>{lead.name}</h3>
                    <p>{getAudienceLabel(lead.audience)}</p>
                  </div>
                  <span>{formatDateTime(lead.created)}</span>
                </div>
                <p className="dashboard-list-item__message">{lead.message}</p>
              </div>
            ))}
          </div>
        )}
      </article>
    )
  }

  function renderEmailsPanel() {
    return (
      <article className="panel dashboard-panel">
        <div className="dashboard-panel__header">
          <div>
            <span className="section-eyebrow">Emails</span>
            <h2>Fila transacional</h2>
          </div>
          <span>{emailQueue.length}</span>
        </div>
        {emailQueue.length === 0 ? (
          <div className="dashboard-empty">
            <h3>Sem emails operacionais</h3>
            <p>Reservas, pagamentos e leads alimentam essa fila automaticamente.</p>
          </div>
        ) : (
          <div className="dashboard-list dashboard-list--compact">
            {emailQueue.slice(0, 6).map((email) => (
              <div key={email.id} className="dashboard-list-item">
                <div className="dashboard-list-item__header">
                  <div>
                    <h3>{getEmailKindLabel(email.kind)}</h3>
                    <p>{email.to}</p>
                  </div>
                  <span
                    className={`status-badge status-badge--${
                      getEmailStatusMeta(email.status).tone
                    }`}
                  >
                    {getEmailStatusMeta(email.status).label}
                  </span>
                </div>
                <p className="dashboard-list-item__message">{email.subject}</p>
              </div>
            ))}
          </div>
        )}
      </article>
    )
  }

  function renderOperationsPanel() {
    return (
      <article className="panel dashboard-panel">
        <div className="dashboard-panel__header">
          <div>
            <span className="section-eyebrow">Pipeline de inscricoes</span>
            <h2>Fila operacional do evento</h2>
          </div>
          <span>{sortedRegistrations.length} registro(s)</span>
        </div>

        {sortedRegistrations.length === 0 ? (
          <div className="dashboard-empty">
            <h3>Nenhuma inscricao ainda</h3>
            <p>Assim que atletas comecarem a reservar vagas, a operacao aparece aqui.</p>
          </div>
        ) : (
          <div className="dashboard-list">
            {sortedRegistrations.map((registration) => (
              <article key={registration.id} className="dashboard-list-item">
                <div className="dashboard-list-item__header">
                  <div>
                    <h3>{registration.fullName}</h3>
                    <p>
                      {registration.raceName} | #{registration.confirmationNumber}
                    </p>
                  </div>
                  <span
                    className={`status-badge status-badge--${
                      getRegistrationStatusMeta(registration).tone
                    }`}
                  >
                    {getRegistrationStatusMeta(registration).label}
                  </span>
                </div>

                <div className="dashboard-list-item__meta">
                  <span>{registration.email}</span>
                  <span>{getPaymentMethodLabel(registration.paymentMethod)}</span>
                  <span>{formatCurrency(registration.finalPrice)}</span>
                  <span>
                    Kit:{' '}
                    {registration.kitStatus === 'delivered'
                      ? 'entregue'
                      : registration.kitStatus === 'separated'
                        ? 'separado'
                        : 'pendente'}
                  </span>
                  <span>
                    Check-in:{' '}
                    {registration.checkInStatus === 'checked_in' ? 'realizado' : 'pendente'}
                  </span>
                  {registration.couponCode ? <span>Cupom {registration.couponCode}</span> : null}
                </div>

                <div className="dashboard-list-item__actions inline-actions">
                  <button
                    className="button button--secondary button--small"
                    disabled={busyRegistrationId === registration.id}
                    type="button"
                    onClick={() =>
                      handleOperationUpdate(
                        registration,
                        {
                          checkInStatus:
                            registration.checkInStatus === 'checked_in'
                              ? 'pending'
                              : 'checked_in',
                        },
                        registration.checkInStatus === 'checked_in'
                          ? 'Check-in reaberto.'
                          : 'Check-in confirmado.',
                      )
                    }
                  >
                    <CheckCircle2 size={16} />
                    <span>
                      {registration.checkInStatus === 'checked_in'
                        ? 'Reabrir check-in'
                        : 'Marcar check-in'}
                    </span>
                  </button>

                  <button
                    className="button button--secondary button--small"
                    disabled={busyRegistrationId === registration.id}
                    type="button"
                    onClick={() =>
                      handleOperationUpdate(
                        registration,
                        {
                          kitStatus:
                            registration.kitStatus === 'pending'
                              ? 'separated'
                              : registration.kitStatus === 'separated'
                                ? 'delivered'
                                : 'pending',
                        },
                        'Status do kit atualizado.',
                      )
                    }
                  >
                    <PackageCheck size={16} />
                    <span>
                      {registration.kitStatus === 'pending'
                        ? 'Separar kit'
                        : registration.kitStatus === 'separated'
                          ? 'Entregar kit'
                          : 'Reabrir kit'}
                    </span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>
    )
  }

  function renderRaceEditorPanel() {
    return (
      <article className="panel dashboard-panel">
        <div className="dashboard-panel__header">
          <div>
            <span className="section-eyebrow">Catalogo</span>
            <h2>{editingRaceId ? 'Editar corrida' : 'Nova corrida'}</h2>
          </div>
          <button className="button button--ghost button--small" type="button" onClick={resetRaceForm}>
            <Plus size={16} />
            <span>Novo</span>
          </button>
        </div>

        <form className="registration-form operator-form" onSubmit={handleRaceSubmit}>
          <div className="form-grid operator-form-grid">
            <label className="field field--full operator-field operator-field--full">
              <span>Nome</span>
              <input
                required
                className="input"
                value={raceForm.name}
                onChange={(event) => updateRaceFormField('name', event.target.value)}
              />
            </label>
            <label className="field operator-field operator-field--quarter">
              <span>Data</span>
              <input
                required
                className="input"
                type="date"
                value={raceForm.date}
                onChange={(event) => updateRaceFormField('date', event.target.value)}
              />
            </label>
            <label className="field operator-field operator-field--quarter">
              <span>Horario</span>
              <input
                className="input"
                type="time"
                value={raceForm.time}
                onChange={(event) => updateRaceFormField('time', event.target.value)}
              />
            </label>
            <label className="field operator-field operator-field--quarter">
              <span>Distancia</span>
              <input
                className="input"
                type="number"
                min="1"
                step="0.1"
                value={raceForm.distance}
                onChange={(event) => updateRaceFormField('distance', event.target.value)}
              />
            </label>
            <label className="field operator-field operator-field--quarter">
              <span>Preco</span>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={raceForm.price}
                onChange={(event) => updateRaceFormField('price', event.target.value)}
              />
            </label>
            <label className="field field--full operator-field operator-field--full">
              <span>Local</span>
              <input
                className="input"
                value={raceForm.location}
                onChange={(event) => updateRaceFormField('location', event.target.value)}
              />
            </label>
            <label className="field field--full operator-field operator-field--full">
              <span>Descricao</span>
              <textarea
                className="input textarea operator-textarea"
                value={raceForm.description}
                onChange={(event) => updateRaceFormField('description', event.target.value)}
              />
            </label>
            <label className="field field--full operator-field operator-field--full">
              <span>Imagem URL</span>
              <input
                className="input"
                value={raceForm.imageUrl}
                onChange={(event) => updateRaceFormField('imageUrl', event.target.value)}
              />
            </label>
            <label className="field operator-field operator-field--half">
              <span>Status</span>
              <select
                className="input input--select"
                value={raceForm.status}
                onChange={(event) => updateRaceFormField('status', event.target.value as RaceStatus)}
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </label>
            <label className="field operator-toggle-field operator-field operator-field--half">
              <input
                checked={raceForm.featured}
                type="checkbox"
                onChange={(event) => updateRaceFormField('featured', event.target.checked)}
              />
              <span>Destacar na home</span>
            </label>
          </div>
          <div className="checkout-actions operator-form-actions">
            <button className="button button--primary" disabled={isSavingRace} type="submit">
              {isSavingRace ? 'Salvando...' : editingRaceId ? 'Atualizar corrida' : 'Criar corrida'}
            </button>
          </div>
        </form>
      </article>
    )
  }

  function renderRaceCatalogPanel() {
    return (
      <article className="panel dashboard-panel">
        <div className="dashboard-panel__header">
          <div>
            <span className="section-eyebrow">Eventos</span>
            <h2>Catalogo de corridas</h2>
          </div>
          <span>{publishedRaces} publicadas</span>
        </div>
        <div className="dashboard-list">
          {races.map((race) => (
            <div key={race.id} className="dashboard-list-item">
              <div className="dashboard-list-item__header">
                <div>
                  <h3>{race.name}</h3>
                  <p>
                    {formatDate(race.date)} | {race.location}
                  </p>
                </div>
                <span className={`status-badge status-badge--${race.status === 'published' ? 'success' : 'warning'}`}>
                  {race.status === 'published' ? 'Publicado' : 'Rascunho'}
                </span>
              </div>
              <div className="dashboard-list-item__meta">
                <span>{race.distance} km</span>
                <span>{formatCurrency(race.price)}</span>
                {race.featured ? <span>Destaque</span> : null}
              </div>
              <div className="dashboard-list-item__actions inline-actions">
                <button className="button button--secondary button--small" type="button" onClick={() => startEditingRace(race)}>
                  <Pencil size={16} />
                  <span>Editar</span>
                </button>
                <button className="button button--ghost button--small" type="button" onClick={() => handleDeleteRace(race)}>
                  <Trash2 size={16} />
                  <span>Remover</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>
    )
  }

  function renderCouponEditorPanel() {
    return (
      <article className="panel dashboard-panel">
        <div className="dashboard-panel__header">
          <div>
            <span className="section-eyebrow">Campanhas</span>
            <h2>{editingCouponId ? 'Editar cupom' : 'Novo cupom'}</h2>
          </div>
          <button className="button button--ghost button--small" type="button" onClick={resetCouponForm}>
            <Plus size={16} />
            <span>Novo</span>
          </button>
        </div>

        <form className="registration-form operator-form" onSubmit={handleCouponSubmit}>
          <div className="form-grid operator-form-grid">
            <label className="field operator-field operator-field--quarter">
              <span>Codigo</span>
              <input
                required
                className="input"
                value={couponForm.code}
                onChange={(event) => updateCouponFormField('code', event.target.value.toUpperCase())}
              />
            </label>
            <label className="field operator-field operator-field--quarter">
              <span>Tipo</span>
              <select
                className="input input--select"
                value={couponForm.type}
                onChange={(event) =>
                  updateCouponFormField('type', event.target.value as CouponFormState['type'])
                }
              >
                <option value="percent">Percentual</option>
                <option value="fixed">Valor fixo</option>
              </select>
            </label>
            <label className="field operator-field operator-field--quarter">
              <span>Valor</span>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={couponForm.value}
                onChange={(event) => updateCouponFormField('value', event.target.value)}
              />
            </label>
            <label className="field operator-field operator-field--quarter">
              <span>Limite de uso</span>
              <input
                className="input"
                type="number"
                min="1"
                value={couponForm.usageLimit}
                onChange={(event) => updateCouponFormField('usageLimit', event.target.value)}
              />
            </label>
            <label className="field operator-field operator-field--half">
              <span>Inicio</span>
              <input
                className="input"
                type="date"
                value={couponForm.validFrom}
                onChange={(event) => updateCouponFormField('validFrom', event.target.value)}
              />
            </label>
            <label className="field operator-field operator-field--half">
              <span>Fim</span>
              <input
                className="input"
                type="date"
                value={couponForm.validUntil}
                onChange={(event) => updateCouponFormField('validUntil', event.target.value)}
              />
            </label>
            <label className="field field--full operator-field operator-field--full">
              <span>Descricao</span>
              <input
                className="input"
                value={couponForm.description}
                onChange={(event) => updateCouponFormField('description', event.target.value)}
              />
            </label>
          </div>

          <div className="field field--full operator-selection-field">
            <span>Corridas elegiveis</span>
            <div className="race-selector-grid operator-selector-grid">
              {races.map((race) => (
                <label key={race.id} className="selector-chip operator-selector-chip">
                  <input
                    checked={couponForm.raceIds.includes(race.id)}
                    type="checkbox"
                    onChange={() => toggleCouponRace(race.id)}
                  />
                  <span>{race.name}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="field operator-toggle-field operator-field operator-field--full">
            <input
              checked={couponForm.active}
              type="checkbox"
              onChange={(event) => updateCouponFormField('active', event.target.checked)}
            />
            <span>Ativo para uso no checkout</span>
          </label>

          <div className="checkout-actions operator-form-actions">
            <button className="button button--primary" disabled={isSavingCoupon} type="submit">
              {isSavingCoupon ? 'Salvando...' : editingCouponId ? 'Atualizar cupom' : 'Criar cupom'}
            </button>
          </div>
        </form>
      </article>
    )
  }

  function renderCouponListPanel() {
    return (
      <article className="panel dashboard-panel">
        <div className="dashboard-panel__header">
          <div>
            <span className="section-eyebrow">Cupons</span>
            <h2>Promocoes ativas e historico</h2>
          </div>
          <Gift size={18} />
        </div>

        {coupons.length === 0 ? (
          <div className="dashboard-empty">
            <h3>Nenhum cupom cadastrado</h3>
            <p>Crie campanhas promocionais por prova, validade e limite de uso.</p>
          </div>
        ) : (
          <div className="dashboard-list">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="dashboard-list-item">
                <div className="dashboard-list-item__header">
                  <div>
                    <h3>{coupon.code}</h3>
                    <p>{coupon.description || 'Cupom sem descricao'}</p>
                  </div>
                  <span className={`status-badge status-badge--${coupon.active ? 'success' : 'warning'}`}>
                    {coupon.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="dashboard-list-item__meta">
                  <span>
                    {coupon.type === 'percent'
                      ? `${coupon.value}% off`
                      : `${formatCurrency(coupon.value)} off`}
                  </span>
                  <span>{coupon.usedCount} uso(s)</span>
                  <span>
                    {coupon.raceIds.length === 0
                      ? 'Todas as corridas'
                      : `${coupon.raceIds.length} corrida(s)`}
                  </span>
                </div>
                <div className="dashboard-list-item__actions inline-actions">
                  <button className="button button--secondary button--small" type="button" onClick={() => startEditingCoupon(coupon)}>
                    <Pencil size={16} />
                    <span>Editar</span>
                  </button>
                  <button className="button button--ghost button--small" type="button" onClick={() => handleDeleteCoupon(coupon)}>
                    <Trash2 size={16} />
                    <span>Remover</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    )
  }

  function renderStageMeta(workspaceKey: OrganizerWorkspace) {
    return (
      <div className="operator-stage__meta">
        {workspaceHighlights[workspaceKey].map((item) => (
          <div
            key={`${workspaceKey}-${item.label}`}
            className={`operator-stage__pill operator-stage__pill--${item.tone}`}
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    )
  }

  function renderDashboardSummaryPanel() {
    return (
      <article className="panel dashboard-panel operator-summary-panel">
        <div className="operator-summary-panel__header">
          <div>
            <span className="section-eyebrow">Gestao central</span>
            <h2>Dashboard de gestao</h2>
          </div>

          <div className="operator-summary-panel__status" aria-label="Resumo do dashboard">
            <span>{lastSyncedLabel}</span>
            <span>{publishedRaces} evento(s) publicado(s)</span>
            <span>{summary.pendingRegistrations} pendencia(s)</span>
          </div>

          <div className="operator-summary-panel__actions">
            <button className="button button--secondary" type="button" onClick={refreshDashboard}>
              <RefreshCw size={16} />
              <span>Atualizar</span>
            </button>
            <button
              className="button button--primary"
              type="button"
              disabled={queuedEmails.length === 0 || isSendingEmails}
              onClick={handleSendQueuedEmails}
            >
              <Send size={16} />
              <span>
                {isSendingEmails
                  ? 'Enviando...'
                  : queuedEmails.length === 0
                    ? 'Emails em dia'
                    : `Enviar ${queuedEmails.length}`}
              </span>
            </button>
          </div>
        </div>

        <div className="row g-3 dashboard-kpis operator-kpis operator-kpis--embedded">
          <div className="col-12 col-md-6 col-xxl-3">
            <MetricCard
              icon={Users}
              label="Inscricoes"
              tone="primary"
              value={summary.totalRegistrations.toString()}
              supporting={`${summary.paidRegistrations} pagas | ${summary.pendingRegistrations} pendentes`}
            />
          </div>
          <div className="col-12 col-md-6 col-xxl-3">
            <MetricCard
              icon={CreditCard}
              label="Receita"
              tone="success"
              value={formatCurrency(summary.revenue)}
              supporting={`${summary.conversionRate}% de conversao`}
            />
          </div>
          <div className="col-12 col-md-6 col-xxl-3">
            <MetricCard
              icon={TicketPercent}
              label="Desconto"
              tone="info"
              value={formatCurrency(summary.totalDiscount)}
              supporting={`${coupons.length} campanha(s) ativa(s) ou cadastrada(s)`}
            />
          </div>
          <div className="col-12 col-md-6 col-xxl-3">
            <MetricCard
              icon={PackageCheck}
              label="Operacao"
              tone="warning"
              value={`${summary.checkedInCount} check-ins`}
              supporting={`${summary.kitsDeliveredCount} kits entregues | ${readyKits} prontos`}
            />
          </div>
        </div>
      </article>
    )
  }

  function renderActiveWorkspace() {
    if (activeWorkspace === 'dashboard') {
      return (
        <div className="operator-stage">
          <div className="operator-stage__header">
            <div>
              <span className="section-eyebrow">Dashboard</span>
              <h2>Central de gestao</h2>
            </div>
            <p>Entrada principal com sinais de receita, operacao e saude da plataforma. Os outros modulos abrem apenas pelo menu.</p>
          </div>
          {renderStageMeta('dashboard')}
          {renderDashboardSummaryPanel()}
          <div className="dashboard-content operator-dashboard-grid">
            <div className="dashboard-main">{renderReportsPanel()}</div>
            <div className="dashboard-side">
              {renderRevenueMixPanel()}
              {renderIntegrationsPanel()}
            </div>
          </div>
        </div>
      )
    }

    if (activeWorkspace === 'operations') {
      return (
        <div className="operator-stage">
          <div className="operator-stage__header">
            <div>
              <span className="section-eyebrow">Operacao</span>
              <h2>Fila ao vivo e acompanhamento do dia</h2>
            </div>
            <p>Centralize check-in, kit, contatos e emails sem deixar a equipe navegando por uma pagina longa.</p>
          </div>
          {renderStageMeta('operations')}
          <div className="dashboard-content operator-dashboard-grid">
            <div className="dashboard-main">{renderOperationsPanel()}</div>
            <div className="dashboard-side">
              {renderIntegrationsPanel()}
              {renderLeadsPanel()}
              {renderEmailsPanel()}
            </div>
          </div>
        </div>
      )
    }

    if (activeWorkspace === 'events') {
      return (
        <div className="operator-stage">
          <div className="operator-stage__header">
            <div>
              <span className="section-eyebrow">Eventos</span>
              <h2>Cadastro e curadoria do catalogo</h2>
            </div>
            <p>Edite uma corrida na esquerda e acompanhe a listagem operacional na direita.</p>
          </div>
          {renderStageMeta('events')}
          <div className="dashboard-catalog operator-workbench">
            {renderRaceEditorPanel()}
            {renderRaceCatalogPanel()}
          </div>
        </div>
      )
    }

    return (
      <div className="operator-stage">
        <div className="operator-stage__header">
          <div>
            <span className="section-eyebrow">Campanhas</span>
            <h2>Cupons e regras comerciais</h2>
          </div>
          <p>Organize as campanhas em um modulo proprio para reduzir ruido visual e acelerar a operacao.</p>
        </div>
        {renderStageMeta('campaigns')}
        <div className="dashboard-catalog operator-workbench">
          {renderCouponEditorPanel()}
          {renderCouponListPanel()}
        </div>
      </div>
    )
  }

  return (
    <OperatorLayout>
      <section className="operator-console">
        <div className="container container--wide">
          <div className="operator-console__topbar">
            <div className="operator-console__menu-group">
              <button
                className="operator-shell-toggle operator-shell-toggle--desktop-inline"
                type="button"
                aria-controls="operator-sidebar"
                aria-expanded={!isSidebarCollapsed}
                onClick={toggleSidebarCollapse}
              >
                {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                <span>Menu</span>
              </button>
              <button
                className="operator-shell-toggle operator-shell-toggle--mobile-inline"
                type="button"
                aria-controls="operator-sidebar"
                aria-expanded={isSidebarDrawerOpen}
                onClick={openSidebarDrawer}
              >
                <Menu size={16} />
                <span>Menu</span>
              </button>
            </div>

            <label className="operator-console__search">
              <Search size={18} />
              <input
                aria-label="Buscar no painel do operador"
                placeholder="Buscar corrida, inscricao, lead ou cupom"
                type="search"
              />
            </label>

            <div className="operator-console__utility">
              <div
                className="operator-console__icon-button"
                aria-label={`${operatorAlertCount} alerta(s) operacionais`}
                role="status"
              >
                <Bell size={18} />
                {operatorAlertCount > 0 ? <span>{operatorAlertCount}</span> : null}
              </div>
              <div
                className="operator-console__icon-button"
                aria-label={`${operatorInboxCount} contato(s) e mensagem(ns)`}
                role="status"
              >
                <Send size={18} />
                {operatorInboxCount > 0 ? <span>{operatorInboxCount}</span> : null}
              </div>

              {session ? (
                <div className="operator-console__profile">
                  <div className="operator-console__avatar" aria-hidden="true">
                    {organizerInitials}
                  </div>
                  <div className="operator-console__profile-copy">
                    <strong>{session.organizer.name}</strong>
                    <span>{session.organizer.email}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="section section--compact operator-section">
        <div className="container container--wide operator-dashboard">
          {feedbackMessage ? <div className="success-note">{feedbackMessage}</div> : null}
          {errorMessage ? <div className="success-note success-note--error">{errorMessage}</div> : null}

          {isLoading ? (
            <article className="panel empty-panel">
              <h2>Carregando painel</h2>
              <p>Buscando inscricoes, integracoes, relatorios e catalogo no backend.</p>
            </article>
          ) : (
            <>
              <div
                className={`operator-workspace-shell${
                  isSidebarCollapsed ? ' operator-workspace-shell--collapsed' : ''
                }${isSidebarDrawerOpen ? ' operator-workspace-shell--menu-open' : ''}`}
              >
                <button
                  className={`operator-sidebar-backdrop${
                    isSidebarDrawerOpen ? ' operator-sidebar-backdrop--visible' : ''
                  }`}
                  type="button"
                  aria-label="Fechar menu lateral"
                  onClick={closeSidebarDrawer}
                />
                <aside id="operator-sidebar" className="operator-sidebar" aria-label="Menu do operador">
                  <div className="operator-sidebar__header">
                    <div className="operator-sidebar__header-copy">
                      <span className="section-eyebrow">Menu do operador</span>
                      <h2>Gestao</h2>
                    </div>
                    <div className="operator-sidebar__header-actions">
                      <button
                        className="operator-sidebar__toggle operator-sidebar__toggle--mobile"
                        type="button"
                        aria-label="Fechar menu lateral"
                        onClick={closeSidebarDrawer}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="operator-sidebar__nav">
                    {workspaceItems.map((item) => {
                      const Icon = item.icon

                      return (
                        <button
                          key={item.key}
                          className={`operator-sidebar__item${
                            activeWorkspace === item.key ? ' operator-sidebar__item--active' : ''
                          }`}
                          type="button"
                          title={`${item.label} - ${item.description}`}
                          aria-label={`${item.label}. ${item.description}. ${item.count} itens.`}
                          onClick={() => handleWorkspaceChange(item.key)}
                        >
                          <span className="operator-sidebar__icon">
                            <Icon size={18} />
                          </span>
                          <span className="operator-sidebar__copy">
                            <strong>{item.label}</strong>
                            <span>{item.description}</span>
                          </span>
                          <span className="operator-sidebar__count">{item.count}</span>
                        </button>
                      )
                    })}
                  </div>

                  {showSidebarFooter ? (
                    <div className="operator-sidebar__footer">
                      <span className="operator-sidebar__label">Workspace ativo</span>
                      <strong>{activeWorkspaceItem.label}</strong>
                      <p>{activeWorkspaceItem.description}</p>
                      <small>
                        {activeWorkspaceItem.count} item(ns) monitorado(s) | {lastSyncedLabel}
                      </small>
                    </div>
                  ) : null}
                </aside>

                <div className="operator-workspace-content">{renderActiveWorkspace()}</div>
              </div>

              {false ? (
                <>
              <div id="operacao" className="operator-section-block">
                <div className="operator-section-header">
                  <div>
                    <span className="section-eyebrow">Operacao</span>
                    <h2>Fila ao vivo e monitoramento da prova</h2>
                  </div>
                  <p>
                    Controle check-in, kits, pagamentos, integracoes, leads e disparos sem sair do
                    mesmo ambiente operacional.
                  </p>
                </div>

                <div className="dashboard-content operator-dashboard-grid">
                <div className="dashboard-main">
                  <article id="relatorios" className="panel dashboard-panel">
                    <div className="dashboard-panel__header">
                      <div>
                        <span className="section-eyebrow">Pipeline de inscricoes</span>
                        <h2>Fila operacional do evento</h2>
                      </div>
                      <span>{sortedRegistrations.length} registro(s)</span>
                    </div>

                    {sortedRegistrations.length === 0 ? (
                      <div className="dashboard-empty">
                        <h3>Nenhuma inscricao ainda</h3>
                        <p>Assim que atletas comecarem a reservar vagas, a operacao aparece aqui.</p>
                      </div>
                    ) : (
                      <div className="dashboard-list">
                        {sortedRegistrations.map((registration) => (
                          <article key={registration.id} className="dashboard-list-item">
                            <div className="dashboard-list-item__header">
                              <div>
                                <h3>{registration.fullName}</h3>
                                <p>
                                  {registration.raceName} | #{registration.confirmationNumber}
                                </p>
                              </div>
                              <span
                                className={`status-badge status-badge--${
                                  getRegistrationStatusMeta(registration).tone
                                }`}
                              >
                                {getRegistrationStatusMeta(registration).label}
                              </span>
                            </div>

                            <div className="dashboard-list-item__meta">
                              <span>{registration.email}</span>
                              <span>{getPaymentMethodLabel(registration.paymentMethod)}</span>
                              <span>{formatCurrency(registration.finalPrice)}</span>
                              <span>
                                Kit:{' '}
                                {registration.kitStatus === 'delivered'
                                  ? 'entregue'
                                  : registration.kitStatus === 'separated'
                                    ? 'separado'
                                    : 'pendente'}
                              </span>
                              <span>
                                Check-in:{' '}
                                {registration.checkInStatus === 'checked_in'
                                  ? 'realizado'
                                  : 'pendente'}
                              </span>
                              {registration.couponCode ? <span>Cupom {registration.couponCode}</span> : null}
                            </div>

                            <div className="dashboard-list-item__actions inline-actions">
                              <button
                                className="button button--secondary button--small"
                                disabled={busyRegistrationId === registration.id}
                                type="button"
                                onClick={() =>
                                  handleOperationUpdate(
                                    registration,
                                    {
                                      checkInStatus:
                                        registration.checkInStatus === 'checked_in'
                                          ? 'pending'
                                          : 'checked_in',
                                    },
                                    registration.checkInStatus === 'checked_in'
                                      ? 'Check-in reaberto.'
                                      : 'Check-in confirmado.',
                                  )
                                }
                              >
                                <CheckCircle2 size={16} />
                                <span>
                                  {registration.checkInStatus === 'checked_in'
                                    ? 'Reabrir check-in'
                                    : 'Marcar check-in'}
                                </span>
                              </button>

                              <button
                                className="button button--secondary button--small"
                                disabled={busyRegistrationId === registration.id}
                                type="button"
                                onClick={() =>
                                  handleOperationUpdate(
                                    registration,
                                    {
                                      kitStatus:
                                        registration.kitStatus === 'pending'
                                          ? 'separated'
                                          : registration.kitStatus === 'separated'
                                            ? 'delivered'
                                            : 'pending',
                                    },
                                    'Status do kit atualizado.',
                                  )
                                }
                              >
                                <PackageCheck size={16} />
                                <span>
                                  {registration.kitStatus === 'pending'
                                    ? 'Separar kit'
                                    : registration.kitStatus === 'separated'
                                      ? 'Entregar kit'
                                      : 'Reabrir kit'}
                                </span>
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </article>

                  <article className="panel dashboard-panel">
                    <div className="dashboard-panel__header">
                      <div>
                        <span className="section-eyebrow">Relatorios</span>
                        <h2>Leitura operacional por corrida</h2>
                      </div>
                      <BarChart3 size={18} />
                    </div>

                    <div className="report-grid">
                      {reports.byRace.map((raceReport) => (
                        <div key={raceReport.raceId} className="info-chip info-chip--report">
                          <span>{raceReport.raceName}</span>
                          <strong>{raceReport.registrations} inscricoes</strong>
                          <small>
                            {raceReport.paidRegistrations} pagas | {raceReport.checkedIn} check-ins |{' '}
                            {formatCurrency(raceReport.revenue)}
                          </small>
                        </div>
                      ))}
                    </div>

                    <div className="report-grid">
                      {reports.couponUsage.length === 0 ? (
                        <div className="dashboard-empty">
                          <h3>Nenhum cupom utilizado ainda</h3>
                          <p>Crie campanhas promocionais para acompanhar adesao e impacto em receita.</p>
                        </div>
                      ) : (
                        reports.couponUsage.map((couponReport) => (
                          <div key={couponReport.code} className="info-chip info-chip--report">
                            <span>{couponReport.code}</span>
                            <strong>{couponReport.usedCount} uso(s)</strong>
                            <small>
                              {couponReport.active ? 'Ativo' : 'Inativo'} | desconto acumulado{' '}
                              {formatCurrency(couponReport.revenueImpact)}
                            </small>
                          </div>
                        ))
                      )}
                    </div>
                  </article>
                </div>

                <div className="dashboard-side">
                  <article className="panel dashboard-panel">
                    <div className="dashboard-panel__header">
                      <div>
                        <span className="section-eyebrow">Infra</span>
                        <h2>Status das integracoes</h2>
                      </div>
                    </div>
                    <div className="dashboard-list dashboard-list--compact">
                      <div className="dashboard-list-item">
                        <div className="dashboard-list-item__header">
                          <h3>Gateway de pagamento</h3>
                        </div>
                        <p className="dashboard-list-item__message">
                          {integrations.mercadoPagoEnabled
                            ? 'Mercado Pago configurado e pronto para checkout externo.'
                            : integrations.mercadoPagoConfigured
                              ? 'Mercado Pago com pendencias de configuracao. O checkout real fica bloqueado ate corrigir isso.'
                              : 'Mercado Pago ainda nao configurado. O fluxo usa aprovacao operacional.'}
                        </p>
                      </div>
                      {integrations.mercadoPagoConfigured && !integrations.mercadoPagoEnabled ? (
                        <div className="dashboard-callout">
                          <strong>Pendencia principal</strong>
                          <span>{integrations.mercadoPagoWarnings[0] || 'Revise a configuracao do gateway.'}</span>
                        </div>
                      ) : null}
                      <div className="dashboard-list-item">
                        <div className="dashboard-list-item__header">
                          <h3>Email transacional</h3>
                        </div>
                        <p className="dashboard-list-item__message">
                          {integrations.resendEnabled
                            ? 'Resend conectado para disparo real dos emails da fila.'
                            : 'Emails ainda em modo fila local. Configure a chave para disparo real.'}
                        </p>
                      </div>
                      <div className="dashboard-callout">
                        <strong>App URL</strong>
                        <span>{integrations.appUrl || 'Nao definido'}</span>
                      </div>
                    </div>
                  </article>

                  <article className="panel dashboard-panel">
                    <div className="dashboard-panel__header">
                      <div>
                        <span className="section-eyebrow">Leads</span>
                        <h2>Contato comercial</h2>
                      </div>
                      <span>{contactLeads.length}</span>
                    </div>
                    {contactLeads.length === 0 ? (
                      <div className="dashboard-empty">
                        <h3>Nenhum lead recebido</h3>
                        <p>O formulario comercial vai alimentar esta fila automaticamente.</p>
                      </div>
                    ) : (
                      <div className="dashboard-list dashboard-list--compact">
                        {contactLeads.slice(0, 5).map((lead) => (
                          <div key={lead.id} className="dashboard-list-item">
                            <div className="dashboard-list-item__header">
                              <div>
                                <h3>{lead.name}</h3>
                                <p>{getAudienceLabel(lead.audience)}</p>
                              </div>
                              <span>{formatDateTime(lead.created)}</span>
                            </div>
                            <p className="dashboard-list-item__message">{lead.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>

                  <article className="panel dashboard-panel">
                    <div className="dashboard-panel__header">
                      <div>
                        <span className="section-eyebrow">Emails</span>
                        <h2>Fila transacional</h2>
                      </div>
                      <span>{emailQueue.length}</span>
                    </div>
                    {emailQueue.length === 0 ? (
                      <div className="dashboard-empty">
                        <h3>Sem emails operacionais</h3>
                        <p>Reservas, pagamentos e leads alimentam essa fila automaticamente.</p>
                      </div>
                    ) : (
                      <div className="dashboard-list dashboard-list--compact">
                        {emailQueue.slice(0, 6).map((email) => (
                          <div key={email.id} className="dashboard-list-item">
                            <div className="dashboard-list-item__header">
                              <div>
                                <h3>{getEmailKindLabel(email.kind)}</h3>
                                <p>{email.to}</p>
                              </div>
                              <span
                                className={`status-badge status-badge--${
                                  getEmailStatusMeta(email.status).tone
                                }`}
                              >
                                {getEmailStatusMeta(email.status).label}
                              </span>
                            </div>
                            <p className="dashboard-list-item__message">{email.subject}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                </div>
                </div>
              </div>

              <div className="row g-4 operator-admin-grid">
                <div className="col-12 col-xxl-6 operator-admin-column">
                  <div id="catalogo" className="operator-section-block operator-section-block--compact">
                    <div className="operator-section-header operator-section-header--stacked">
                      <div>
                        <span className="section-eyebrow">Catalogo</span>
                        <h2>Gestao das corridas publicadas e em rascunho</h2>
                      </div>
                      <p>
                        Mantenha a vitrine publica atualizada enquanto o backoffice edita detalhes
                        operacionais em um workspace proprio.
                      </p>
                    </div>

                    <article className="panel dashboard-panel">
                  <div className="dashboard-panel__header">
                    <div>
                      <span className="section-eyebrow">Catalogo</span>
                      <h2>{editingRaceId ? 'Editar corrida' : 'Nova corrida'}</h2>
                    </div>
                    <button className="button button--ghost button--small" type="button" onClick={resetRaceForm}>
                      <Plus size={16} />
                      <span>Novo</span>
                    </button>
                  </div>

                  <form className="registration-form operator-form" onSubmit={handleRaceSubmit}>
                    <div className="form-grid operator-form-grid">
                      <label className="field field--full operator-field operator-field--full">
                        <span>Nome</span>
                        <input
                          required
                          className="input"
                          value={raceForm.name}
                          onChange={(event) => updateRaceFormField('name', event.target.value)}
                        />
                      </label>
                      <label className="field operator-field operator-field--quarter">
                        <span>Data</span>
                        <input
                          required
                          className="input"
                          type="date"
                          value={raceForm.date}
                          onChange={(event) => updateRaceFormField('date', event.target.value)}
                        />
                      </label>
                      <label className="field operator-field operator-field--quarter">
                        <span>Horario</span>
                        <input
                          className="input"
                          type="time"
                          value={raceForm.time}
                          onChange={(event) => updateRaceFormField('time', event.target.value)}
                        />
                      </label>
                      <label className="field operator-field operator-field--quarter">
                        <span>Distancia</span>
                        <input
                          className="input"
                          type="number"
                          min="1"
                          step="0.1"
                          value={raceForm.distance}
                          onChange={(event) => updateRaceFormField('distance', event.target.value)}
                        />
                      </label>
                      <label className="field operator-field operator-field--quarter">
                        <span>Preco</span>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={raceForm.price}
                          onChange={(event) => updateRaceFormField('price', event.target.value)}
                        />
                      </label>
                      <label className="field field--full operator-field operator-field--full">
                        <span>Local</span>
                        <input
                          className="input"
                          value={raceForm.location}
                          onChange={(event) => updateRaceFormField('location', event.target.value)}
                        />
                      </label>
                      <label className="field field--full operator-field operator-field--full">
                        <span>Descricao</span>
                        <textarea
                          className="input textarea operator-textarea"
                          value={raceForm.description}
                          onChange={(event) => updateRaceFormField('description', event.target.value)}
                        />
                      </label>
                      <label className="field field--full operator-field operator-field--full">
                        <span>Imagem URL</span>
                        <input
                          className="input"
                          value={raceForm.imageUrl}
                          onChange={(event) => updateRaceFormField('imageUrl', event.target.value)}
                        />
                      </label>
                      <label className="field operator-field operator-field--half">
                        <span>Status</span>
                        <select
                          className="input input--select"
                          value={raceForm.status}
                          onChange={(event) =>
                            updateRaceFormField('status', event.target.value as RaceStatus)
                          }
                        >
                          <option value="draft">Rascunho</option>
                          <option value="published">Publicado</option>
                        </select>
                      </label>
                      <label className="field operator-toggle-field operator-field operator-field--half">
                        <input
                          checked={raceForm.featured}
                          type="checkbox"
                          onChange={(event) => updateRaceFormField('featured', event.target.checked)}
                        />
                        <span>Destacar na home</span>
                      </label>
                    </div>
                    <div className="checkout-actions operator-form-actions">
                      <button className="button button--primary" disabled={isSavingRace} type="submit">
                        {isSavingRace ? 'Salvando...' : editingRaceId ? 'Atualizar corrida' : 'Criar corrida'}
                      </button>
                    </div>
                  </form>
                    </article>
                  </div>

                  <div id="campanhas" className="operator-section-block operator-section-block--compact">
                    <div className="operator-section-header operator-section-header--stacked">
                      <div>
                        <span className="section-eyebrow">Campanhas</span>
                        <h2>Cupons, regras comerciais e acompanhamento de uso</h2>
                      </div>
                      <p>
                        Centralize ofertas promocionais, validade, escopo por prova e impacto sobre a receita.
                      </p>
                    </div>

                    <article className="panel dashboard-panel">
                      <div className="dashboard-panel__header">
                        <div>
                          <span className="section-eyebrow">Campanhas</span>
                          <h2>{editingCouponId ? 'Editar cupom' : 'Novo cupom'}</h2>
                        </div>
                        <button className="button button--ghost button--small" type="button" onClick={resetCouponForm}>
                          <Plus size={16} />
                          <span>Novo</span>
                        </button>
                      </div>

                      <form className="registration-form operator-form" onSubmit={handleCouponSubmit}>
                        <div className="form-grid operator-form-grid">
                          <label className="field operator-field operator-field--quarter">
                            <span>Codigo</span>
                            <input
                              required
                              className="input"
                              value={couponForm.code}
                              onChange={(event) => updateCouponFormField('code', event.target.value.toUpperCase())}
                            />
                          </label>
                          <label className="field operator-field operator-field--quarter">
                            <span>Tipo</span>
                            <select
                              className="input input--select"
                              value={couponForm.type}
                              onChange={(event) =>
                                updateCouponFormField('type', event.target.value as CouponFormState['type'])
                              }
                            >
                              <option value="percent">Percentual</option>
                              <option value="fixed">Valor fixo</option>
                            </select>
                          </label>
                          <label className="field operator-field operator-field--quarter">
                            <span>Valor</span>
                            <input
                              className="input"
                              type="number"
                              min="0"
                              step="0.01"
                              value={couponForm.value}
                              onChange={(event) => updateCouponFormField('value', event.target.value)}
                            />
                          </label>
                          <label className="field operator-field operator-field--quarter">
                            <span>Limite de uso</span>
                            <input
                              className="input"
                              type="number"
                              min="1"
                              value={couponForm.usageLimit}
                              onChange={(event) => updateCouponFormField('usageLimit', event.target.value)}
                            />
                          </label>
                          <label className="field operator-field operator-field--half">
                            <span>Inicio</span>
                            <input
                              className="input"
                              type="date"
                              value={couponForm.validFrom}
                              onChange={(event) => updateCouponFormField('validFrom', event.target.value)}
                            />
                          </label>
                          <label className="field operator-field operator-field--half">
                            <span>Fim</span>
                            <input
                              className="input"
                              type="date"
                              value={couponForm.validUntil}
                              onChange={(event) => updateCouponFormField('validUntil', event.target.value)}
                            />
                          </label>
                          <label className="field field--full operator-field operator-field--full">
                            <span>Descricao</span>
                            <input
                              className="input"
                              value={couponForm.description}
                              onChange={(event) => updateCouponFormField('description', event.target.value)}
                            />
                          </label>
                        </div>

                        <div className="field field--full operator-selection-field">
                          <span>Corridas elegiveis</span>
                          <div className="race-selector-grid operator-selector-grid">
                            {races.map((race) => (
                              <label key={race.id} className="selector-chip operator-selector-chip">
                                <input
                                  checked={couponForm.raceIds.includes(race.id)}
                                  type="checkbox"
                                  onChange={() => toggleCouponRace(race.id)}
                                />
                                <span>{race.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <label className="field operator-toggle-field operator-field operator-field--full">
                          <input
                            checked={couponForm.active}
                            type="checkbox"
                            onChange={(event) => updateCouponFormField('active', event.target.checked)}
                          />
                          <span>Ativo para uso no checkout</span>
                        </label>

                        <div className="checkout-actions operator-form-actions">
                          <button className="button button--primary" disabled={isSavingCoupon} type="submit">
                            {isSavingCoupon ? 'Salvando...' : editingCouponId ? 'Atualizar cupom' : 'Criar cupom'}
                          </button>
                        </div>
                      </form>
                    </article>
                  </div>
                </div>

                <div className="col-12 col-xxl-6 operator-admin-column">
                  <div className="operator-section-block operator-section-block--compact">
                    <div className="operator-section-header operator-section-header--stacked">
                      <div>
                        <span className="section-eyebrow">Eventos</span>
                        <h2>Catalogo de corridas</h2>
                      </div>
                      <p>
                        Acompanhe a vitrine ja publicada e revise rapidamente o status de cada prova.
                      </p>
                    </div>

                    <article className="panel dashboard-panel">
                      <div className="dashboard-panel__header">
                        <div>
                          <span className="section-eyebrow">Eventos</span>
                          <h2>Catalogo de corridas</h2>
                        </div>
                        <span>{publishedRaces} publicadas</span>
                      </div>
                      <div className="dashboard-list">
                        {races.map((race) => (
                          <div key={race.id} className="dashboard-list-item">
                            <div className="dashboard-list-item__header">
                              <div>
                                <h3>{race.name}</h3>
                                <p>
                                  {formatDate(race.date)} | {race.location}
                                </p>
                              </div>
                              <span className={`status-badge status-badge--${race.status === 'published' ? 'success' : 'warning'}`}>
                                {race.status === 'published' ? 'Publicado' : 'Rascunho'}
                              </span>
                            </div>
                            <div className="dashboard-list-item__meta">
                              <span>{race.distance} km</span>
                              <span>{formatCurrency(race.price)}</span>
                              {race.featured ? <span>Destaque</span> : null}
                            </div>
                            <div className="dashboard-list-item__actions inline-actions">
                              <button className="button button--secondary button--small" type="button" onClick={() => startEditingRace(race)}>
                                <Pencil size={16} />
                                <span>Editar</span>
                              </button>
                              <button className="button button--ghost button--small" type="button" onClick={() => handleDeleteRace(race)}>
                                <Trash2 size={16} />
                                <span>Remover</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>

                  <div className="operator-section-block operator-section-block--compact">
                    <div className="operator-section-header operator-section-header--stacked">
                      <div>
                        <span className="section-eyebrow">Cupons</span>
                        <h2>Promocoes ativas e historico</h2>
                      </div>
                      <p>
                        Monitore campanhas em paralelo ao formulario sem deixar espacos mortos no layout.
                      </p>
                    </div>

                    <article className="panel dashboard-panel">
                      <div className="dashboard-panel__header">
                        <div>
                          <span className="section-eyebrow">Cupons</span>
                          <h2>Promocoes ativas e historico</h2>
                        </div>
                        <Gift size={18} />
                      </div>

                      {coupons.length === 0 ? (
                        <div className="dashboard-empty">
                          <h3>Nenhum cupom cadastrado</h3>
                          <p>Crie campanhas promocionais por prova, validade e limite de uso.</p>
                        </div>
                      ) : (
                        <div className="dashboard-list">
                          {coupons.map((coupon) => (
                            <div key={coupon.id} className="dashboard-list-item">
                              <div className="dashboard-list-item__header">
                                <div>
                                  <h3>{coupon.code}</h3>
                                  <p>{coupon.description || 'Cupom sem descricao'}</p>
                                </div>
                                <span className={`status-badge status-badge--${coupon.active ? 'success' : 'warning'}`}>
                                  {coupon.active ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                              <div className="dashboard-list-item__meta">
                                <span>
                                  {coupon.type === 'percent'
                                    ? `${coupon.value}% off`
                                    : `${formatCurrency(coupon.value)} off`}
                                </span>
                                <span>{coupon.usedCount} uso(s)</span>
                                <span>
                                  {coupon.raceIds.length === 0
                                    ? 'Todas as corridas'
                                    : `${coupon.raceIds.length} corrida(s)`}
                                </span>
                              </div>
                              <div className="dashboard-list-item__actions inline-actions">
                                <button className="button button--secondary button--small" type="button" onClick={() => startEditingCoupon(coupon)}>
                                  <Pencil size={16} />
                                  <span>Editar</span>
                                </button>
                                <button className="button button--ghost button--small" type="button" onClick={() => handleDeleteCoupon(coupon)}>
                                  <Trash2 size={16} />
                                  <span>Remover</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  </div>
                </div>
              </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </section>
    </OperatorLayout>
  )
}

function MetricCard({
  icon: Icon,
  label,
  supporting,
  tone,
  value,
}: {
  icon: typeof Users
  label: string
  supporting: string
  tone: 'primary' | 'success' | 'info' | 'warning'
  value: string
}) {
  return (
    <article className={`panel metric-card metric-card--dashboard metric-card--${tone} h-100`}>
      <span className="metric-card__icon">
        <Icon size={20} />
      </span>
      <span className="metric-card__label">{label}</span>
      <strong>{value}</strong>
      <span className="metric-card__supporting">{supporting}</span>
    </article>
  )
}
