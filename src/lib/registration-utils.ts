import type {
  ContactLeadRecord,
  EmailQueueKind,
  EmailQueueStatus,
  PaymentMethod,
  RegistrationRecord,
} from './storage'

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getPaymentMethodLabel(paymentMethod: PaymentMethod | null) {
  switch (paymentMethod) {
    case 'pix':
      return 'Pix'
    case 'card':
      return 'Cartao'
    case 'boleto':
      return 'Boleto'
    default:
      return 'Nao definido'
  }
}

export function getRegistrationStatusMeta(registration: RegistrationRecord) {
  if (registration.paymentStatus === 'paid') {
    return {
      label: 'Inscricao confirmada',
      tone: 'success',
    } as const
  }

  return {
    label: 'Pagamento pendente',
    tone: 'warning',
  } as const
}

export function getEmailStatusMeta(status: EmailQueueStatus) {
  if (status === 'sent') {
    return {
      label: 'Enviado',
      tone: 'success',
    } as const
  }

  return {
    label: 'Na fila',
    tone: 'warning',
  } as const
}

export function getEmailKindLabel(kind: EmailQueueKind) {
  switch (kind) {
    case 'registration_received':
      return 'Reserva recebida'
    case 'payment_approved':
      return 'Pagamento aprovado'
    case 'lead_received':
      return 'Lead recebido'
    default:
      return 'Email operacional'
  }
}

export function getAudienceLabel(audience: ContactLeadRecord['audience']) {
  return audience === 'organizer' ? 'Organizador' : 'Atleta'
}
