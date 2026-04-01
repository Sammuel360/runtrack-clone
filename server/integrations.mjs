const appUrl = process.env.APP_URL || 'http://127.0.0.1:8787'
const mercadoPagoAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || ''
const resendApiKey = process.env.RESEND_API_KEY || ''
const resendFromEmail = process.env.RESEND_FROM_EMAIL || ''

function safeParseUrl(value) {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

function isLoopbackHost(hostname) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.localhost')
  )
}

function isPrivateIpv4(hostname) {
  return (
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  )
}

function splitFullName(fullName) {
  const parts = String(fullName ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return {
    firstName: parts[0] ?? 'Atleta',
    lastName: parts.slice(1).join(' ') || 'RunTrack',
  }
}

function inferMercadoPagoMethodConfig(paymentMethod) {
  if (paymentMethod === 'pix') {
    return {
      id: 'pix',
      type: 'bank_transfer',
    }
  }

  return {
    id: 'bolbradesco',
    type: 'ticket',
  }
}

function normalizeMercadoPagoPaymentRecord(payment) {
  if (!payment || typeof payment !== 'object') {
    return null
  }

  const paymentMethod = payment.payment_method ?? {}
  const transactionData = paymentMethod.transaction_data ?? payment.transaction_data ?? {}
  const barcode = paymentMethod.barcode ?? payment.barcode ?? {}
  const status = payment.status ?? null
  const statusDetail = payment.status_detail ?? payment.statusDetail ?? null

  return {
    paymentOrderId: payment.id ?? null,
    paymentExternalReference: payment.reference_id ?? payment.referenceId ?? null,
    paymentStatusDetail: statusDetail,
    paymentMethod:
      paymentMethod.type === 'bank_transfer'
        ? 'pix'
        : paymentMethod.type === 'ticket'
          ? 'boleto'
          : null,
    paymentQrCode: transactionData.qr_code ?? paymentMethod.qr_code ?? null,
    paymentQrCodeBase64: transactionData.qr_code_base64 ?? paymentMethod.qr_code_base64 ?? null,
    paymentTicketUrl:
      paymentMethod.ticket_url ??
      payment.ticket_url ??
      payment.transaction_details?.external_resource_url ??
      null,
    paymentDigitableLine:
      paymentMethod.payment_digitable_line ??
      payment.payment_digitable_line ??
      payment.digitable_line ??
      null,
    paymentBarcodeContent:
      barcode.content ?? payment.barcode_content ?? payment.payment_barcode_content ?? null,
    paymentExpiresAt: payment.date_of_expiration ?? payment.expires_at ?? null,
    status,
  }
}

function inferMercadoPagoPaymentMethod(paymentTypeId) {
  if (paymentTypeId === 'pix') {
    return 'pix'
  }

  if (paymentTypeId === 'ticket') {
    return 'boleto'
  }

  return 'card'
}

export function getIntegrationStatus() {
  const mercadoPagoWarnings = !mercadoPagoAccessToken
    ? ['Defina MERCADO_PAGO_ACCESS_TOKEN para ativar pagamentos reais.']
    : (() => {
        const parsedAppUrl = safeParseUrl(appUrl)

        if (!parsedAppUrl) {
          return ['APP_URL precisa ser uma URL absoluta valida para o retorno do checkout e webhook.']
        }

        if (isLoopbackHost(parsedAppUrl.hostname) || isPrivateIpv4(parsedAppUrl.hostname)) {
          return ['APP_URL precisa ser publica para o Mercado Pago conseguir redirecionar e enviar webhooks.']
        }

        if (parsedAppUrl.protocol !== 'https:') {
          return ['APP_URL precisa usar HTTPS para pagamentos reais do Mercado Pago.']
        }

        return []
      })()

  return {
    mercadoPagoConfigured: Boolean(mercadoPagoAccessToken),
    mercadoPagoEnabled: Boolean(mercadoPagoAccessToken) && mercadoPagoWarnings.length === 0,
    mercadoPagoWarnings,
    resendEnabled: Boolean(resendApiKey && resendFromEmail),
    appUrl,
    webhookUrl: `${appUrl}/api/payments/webhooks/mercadopago`,
  }
}

export async function createMercadoPagoCheckout(registration) {
  if (!mercadoPagoAccessToken) {
    return null
  }

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mercadoPagoAccessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': crypto.randomUUID(),
    },
    body: JSON.stringify({
      items: [
        {
          id: registration.id,
          title: registration.raceName,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: registration.finalPrice,
        },
      ],
      payer: {
        name: registration.fullName,
        email: registration.email,
      },
      external_reference: registration.id,
      notification_url: `${appUrl}/api/payments/webhooks/mercadopago`,
      back_urls: {
        success: `${appUrl}/confirmation?registration=${registration.id}&payment=success`,
        pending: `${appUrl}/confirmation?registration=${registration.id}&payment=pending`,
        failure: `${appUrl}/checkout/${registration.id}?payment=failure`,
      },
      auto_return: 'approved',
      metadata: {
        registration_id: registration.id,
        confirmation_number: registration.confirmationNumber,
      },
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Falha ao criar checkout no Mercado Pago: ${message}`)
  }

  const payload = await response.json()

  return {
    checkoutUrl: payload.init_point || payload.sandbox_init_point || null,
    paymentPreferenceId: payload.id ?? null,
    paymentExternalReference: registration.id,
  }
}

export async function createMercadoPagoPaymentSession(registration, paymentMethod, payer) {
  if (!mercadoPagoAccessToken) {
    return null
  }

  const payerDocument = String(payer?.documentNumber ?? '').replace(/\D/g, '')
  const address = payer?.address ?? {}
  const { firstName, lastName } = splitFullName(registration.fullName)
  const methodConfig = inferMercadoPagoMethodConfig(paymentMethod)

  const response = await fetch('https://api.mercadopago.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${mercadoPagoAccessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `${registration.id}-${paymentMethod}`,
    },
    body: JSON.stringify({
      type: 'online',
      processing_mode: 'automatic',
      total_amount: Number(registration.finalPrice).toFixed(2),
      external_reference: registration.id,
      notification_url: `${appUrl}/api/payments/webhooks/mercadopago`,
      payer: {
        email: registration.email,
        first_name: firstName,
        last_name: lastName,
        ...(payerDocument
          ? {
              identification: {
                type: 'CPF',
                number: payerDocument,
              },
            }
          : {}),
        ...(address.zipCode || address.streetName
          ? {
              address: {
                zip_code: address.zipCode ?? '',
                street_name: address.streetName ?? '',
                street_number: address.streetNumber ?? '',
                neighborhood: address.neighborhood ?? '',
                city: address.city ?? '',
                federal_unit: address.state ?? '',
              },
            }
          : {}),
      },
      transactions: {
        payments: [
          {
            amount: Number(registration.finalPrice).toFixed(2),
            payment_method: methodConfig,
          },
        ],
      },
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Falha ao criar pagamento ${paymentMethod} no Mercado Pago: ${message}`)
  }

  const payload = await response.json()
  const payment = payload.transactions?.payments?.[0] ?? null
  const normalizedPayment = normalizeMercadoPagoPaymentRecord(payment)

  return {
    paymentProvider: 'mercadopago',
    paymentOrderId: payload.id ?? normalizedPayment?.paymentOrderId ?? null,
    paymentExternalReference:
      normalizedPayment?.paymentExternalReference ?? payload.external_reference ?? registration.id,
    paymentStatusDetail: normalizedPayment?.paymentStatusDetail ?? payload.status_detail ?? null,
    paymentMethod,
    paymentQrCode: normalizedPayment?.paymentQrCode ?? null,
    paymentQrCodeBase64: normalizedPayment?.paymentQrCodeBase64 ?? null,
    paymentTicketUrl: normalizedPayment?.paymentTicketUrl ?? null,
    paymentDigitableLine: normalizedPayment?.paymentDigitableLine ?? null,
    paymentBarcodeContent: normalizedPayment?.paymentBarcodeContent ?? null,
    paymentExpiresAt: normalizedPayment?.paymentExpiresAt ?? null,
    paymentPayer: payer ?? null,
  }
}

export async function fetchMercadoPagoOrder(orderId) {
  if (!mercadoPagoAccessToken || !orderId) {
    return null
  }

  const response = await fetch(`https://api.mercadopago.com/v1/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${mercadoPagoAccessToken}`,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Falha ao consultar pedido no Mercado Pago: ${message}`)
  }

  const payload = await response.json()
  const payment = normalizeMercadoPagoPaymentRecord(payload.transactions?.payments?.[0] ?? null)

  if (!payment) {
    return null
  }

  return {
    ...payment,
    paymentProvider: 'mercadopago',
    paymentExternalReference: payment.paymentExternalReference ?? payload.external_reference ?? null,
  }
}

export async function fetchMercadoPagoPayment(paymentId) {
  if (!mercadoPagoAccessToken) {
    return null
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${mercadoPagoAccessToken}`,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Falha ao consultar pagamento no Mercado Pago: ${message}`)
  }

  const payload = await response.json()
  const normalizedPayment = normalizeMercadoPagoPaymentRecord(payload)

  return {
    status: payload.status,
    paymentMethod:
      normalizedPayment?.paymentMethod ??
      inferMercadoPagoPaymentMethod(payload.payment_type_id),
    paymentProvider: 'mercadopago',
    paymentExternalReference: payload.external_reference ?? String(paymentId),
    paymentStatusDetail: payload.status_detail ?? null,
    paymentQrCode: normalizedPayment?.paymentQrCode ?? null,
    paymentQrCodeBase64: normalizedPayment?.paymentQrCodeBase64 ?? null,
    paymentTicketUrl: normalizedPayment?.paymentTicketUrl ?? null,
    paymentDigitableLine: normalizedPayment?.paymentDigitableLine ?? null,
    paymentBarcodeContent: normalizedPayment?.paymentBarcodeContent ?? null,
    paymentExpiresAt: normalizedPayment?.paymentExpiresAt ?? null,
  }
}

function getEmailHtml(email) {
  return `
    <div style="font-family: Arial, sans-serif; color: #10233d; line-height: 1.6;">
      <h1 style="font-size: 22px; margin-bottom: 12px;">${email.subject}</h1>
      <p style="margin: 0 0 12px;">${email.preview}</p>
      <p style="margin: 0;">Mensagem operacional enviada pela plataforma RunTrack.</p>
    </div>
  `
}

export async function sendEmailsWithResend(emails) {
  if (!resendApiKey || !resendFromEmail) {
    return emails.map((email) => ({
      id: email.id,
      providerMessageId: null,
    }))
  }

  const deliveries = []

  for (const email of emails) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [email.to],
        subject: email.subject,
        html: getEmailHtml(email),
      }),
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(`Falha ao enviar email transacional: ${message}`)
    }

    const payload = await response.json()
    deliveries.push({
      id: email.id,
      providerMessageId: payload.id ?? null,
    })
  }

  return deliveries
}
