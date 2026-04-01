import type { Race } from '../data/races'
import { requestJson } from './api-client'

export type RegistrationFormValues = {
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  tShirtSize: string
  emergencyContactName: string
  emergencyContactPhone: string
}

export type RegistrationStatus = 'pending_payment' | 'confirmed'
export type PaymentStatus = 'pending' | 'paid'
export type PaymentMethod = 'pix' | 'card' | 'boleto'
export type PaymentProvider = 'simulated' | 'mercadopago'
export type KitStatus = 'pending' | 'separated' | 'delivered'
export type CheckInStatus = 'pending' | 'checked_in'
export type PaymentPayer = {
  documentNumber: string
  address: {
    zipCode: string
    streetName: string
    streetNumber: string
    neighborhood: string
    city: string
    state: string
  }
}

export type RegistrationRecord = RegistrationFormValues & {
  id: string
  created: string
  confirmationNumber: string
  status: RegistrationStatus
  raceId: string
  raceName: string
  racePrice: number
  couponCode: string | null
  couponRedeemedAt: string | null
  discountAmount: number
  finalPrice: number
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod | null
  paymentProvider: PaymentProvider
  paymentCheckoutUrl: string | null
  paymentPreferenceId: string | null
  paymentOrderId: string | null
  paymentExternalReference: string | null
  paymentStatusDetail: string | null
  paymentPayer: PaymentPayer | null
  paymentQrCode: string | null
  paymentQrCodeBase64: string | null
  paymentTicketUrl: string | null
  paymentDigitableLine: string | null
  paymentBarcodeContent: string | null
  paymentExpiresAt: string | null
  paidAt: string | null
  kitStatus: KitStatus
  checkInStatus: CheckInStatus
  checkInAt: string | null
}

export type ContactLeadValues = {
  name: string
  email: string
  phone: string
  audience: 'runner' | 'organizer'
  companyOrTeam: string
  message: string
}

export type ContactLeadRecord = ContactLeadValues & {
  id: string
  created: string
}

export type EmailQueueStatus = 'queued' | 'sent'
export type EmailQueueKind = 'registration_received' | 'payment_approved' | 'lead_received'

export type EmailQueueRecord = {
  id: string
  created: string
  status: EmailQueueStatus
  kind: EmailQueueKind
  to: string
  subject: string
  preview: string
  relatedRegistrationId: string | null
  relatedLeadId: string | null
  sentAt: string | null
  providerMessageId: string | null
}

export type CouponType = 'percent' | 'fixed'

export type CouponRecord = {
  id: string
  code: string
  description: string
  type: CouponType
  value: number
  active: boolean
  raceIds: string[]
  usageLimit: number | null
  usedCount: number
  validFrom: string | null
  validUntil: string | null
  created: string
}

export type CouponMutationValues = {
  code: string
  description: string
  type: CouponType
  value: number
  active: boolean
  raceIds: string[]
  usageLimit: number | null
  validFrom: string | null
  validUntil: string | null
}

export type DashboardSummary = {
  totalRaces: number
  totalRegistrations: number
  paidRegistrations: number
  pendingRegistrations: number
  totalLeads: number
  organizerLeads: number
  queuedEmails: number
  revenue: number
  conversionRate: number
  totalDiscount: number
  checkedInCount: number
  kitsDeliveredCount: number
}

export type DashboardReports = {
  byRace: Array<{
    raceId: string
    raceName: string
    status: Race['status']
    registrations: number
    paidRegistrations: number
    pendingRegistrations: number
    checkedIn: number
    kitsDelivered: number
    revenue: number
  }>
  couponUsage: Array<{
    code: string
    usedCount: number
    active: boolean
    revenueImpact: number
  }>
  totalDiscount: number
  checkedInCount: number
  kitsDeliveredCount: number
}

export type DashboardSnapshot = {
  races: Race[]
  coupons: CouponRecord[]
  registrations: RegistrationRecord[]
  contactLeads: ContactLeadRecord[]
  emailQueue: EmailQueueRecord[]
  reports: DashboardReports
  summary: DashboardSummary
}

export type IntegrationStatus = {
  mercadoPagoConfigured: boolean
  mercadoPagoEnabled: boolean
  mercadoPagoWarnings: string[]
  resendEnabled: boolean
  appUrl: string
  webhookUrl: string
}

export type PaymentRequestResult = {
  mode: 'redirect' | 'simulated' | 'already_paid' | 'pending_artifact'
  registration: RegistrationRecord | null
  checkoutUrl?: string | null
  paymentMethod?: PaymentMethod
}

export type CouponApplicationResult = {
  status: 'applied'
  registration: RegistrationRecord
  coupon: CouponRecord
}

function athleteOptions() {
  return {
    includeAthleteOwnerId: true,
    includeAthleteAuth: true,
  } as const
}

export async function getIntegrationStatus() {
  return requestJson<IntegrationStatus>('/integrations/status')
}

export async function createRegistration(values: RegistrationFormValues, race: Race) {
  return requestJson<RegistrationRecord>(
    '/registrations',
    {
      method: 'POST',
      body: JSON.stringify({
        ...values,
        raceId: race.id,
      }),
    },
    athleteOptions(),
  )
}

export async function getRegistrationById(registrationId: string | null) {
  if (!registrationId) {
    return null
  }

  return requestJson<RegistrationRecord | null>(`/registrations/${registrationId}`, undefined, athleteOptions())
}

export async function listRegistrations() {
  return requestJson<RegistrationRecord[]>('/registrations', undefined, athleteOptions())
}

export async function deleteRegistration(registrationId: string) {
  return requestJson<RegistrationRecord[]>(
    `/registrations/${registrationId}`,
    {
      method: 'DELETE',
    },
    athleteOptions(),
  )
}

export async function applyCouponToRegistration(registrationId: string, couponCode: string) {
  return requestJson<CouponApplicationResult>(
    `/registrations/${registrationId}/coupon`,
    {
      method: 'POST',
      body: JSON.stringify({ couponCode }),
    },
    athleteOptions(),
  )
}

export async function removeCouponFromRegistration(registrationId: string) {
  return requestJson<RegistrationRecord>(
    `/registrations/${registrationId}/coupon`,
    {
      method: 'DELETE',
    },
    athleteOptions(),
  )
}

export async function completeRegistrationPayment(
  registrationId: string,
  paymentMethod: PaymentMethod,
  payer?: PaymentPayer,
) {
  return requestJson<PaymentRequestResult>(
    `/registrations/${registrationId}/payment`,
    {
      method: 'POST',
      body: JSON.stringify({ payer, paymentMethod }),
    },
    athleteOptions(),
  )
}

export async function refreshRegistrationPaymentStatus(registrationId: string) {
  return requestJson<RegistrationRecord>(
    `/registrations/${registrationId}/payment-status`,
    undefined,
    athleteOptions(),
  )
}

export async function createContactLead(values: ContactLeadValues) {
  return requestJson<ContactLeadRecord>(
    '/contact-leads',
    {
      method: 'POST',
      body: JSON.stringify(values),
    },
  )
}

export async function getDashboardSnapshot() {
  return requestJson<DashboardSnapshot>('/dashboard', undefined, {
    includeOrganizerAuth: true,
  })
}

export async function sendQueuedEmails() {
  return requestJson<EmailQueueRecord[]>(
    '/emails/send',
    {
      method: 'POST',
    },
    {
      includeOrganizerAuth: true,
    },
  )
}

export async function createOrganizerCoupon(values: CouponMutationValues) {
  return requestJson<CouponRecord>(
    '/organizer/coupons',
    {
      method: 'POST',
      body: JSON.stringify(values),
    },
    {
      includeOrganizerAuth: true,
    },
  )
}

export async function updateOrganizerCoupon(couponId: string, values: CouponMutationValues) {
  return requestJson<CouponRecord>(
    `/organizer/coupons/${couponId}`,
    {
      method: 'PUT',
      body: JSON.stringify(values),
    },
    {
      includeOrganizerAuth: true,
    },
  )
}

export async function deleteOrganizerCoupon(couponId: string) {
  return requestJson<CouponRecord[]>(
    `/organizer/coupons/${couponId}`,
    {
      method: 'DELETE',
    },
    {
      includeOrganizerAuth: true,
    },
  )
}

export async function updateOrganizerRegistrationOperations(
  registrationId: string,
  values: {
    checkInStatus?: CheckInStatus
    kitStatus?: KitStatus
  },
) {
  return requestJson<RegistrationRecord>(
    `/organizer/registrations/${registrationId}/operations`,
    {
      method: 'PATCH',
      body: JSON.stringify(values),
    },
    {
      includeOrganizerAuth: true,
    },
  )
}
