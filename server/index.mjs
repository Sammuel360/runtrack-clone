import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import cors from 'cors'
import express from 'express'

import {
  applyCouponToRegistration,
  attachPaymentCheckout,
  authenticateAthlete,
  authenticateOrganizer,
  completeRegistrationPayment,
  createContactLead,
  createCoupon,
  createRace,
  createRegistration,
  deleteAthleteSession,
  deleteCoupon,
  deleteOrganizerSession,
  deleteRace,
  deleteRegistration,
  getAthleteSession,
  getDashboardSnapshot,
  getOrganizerSession,
  getPublicRaceById,
  getRegistrationById,
  listContactLeads,
  listCoupons,
  listEmailQueue,
  listOrganizerRaces,
  listPublicRaces,
  listRegistrations,
  markEmailsAsSent,
  markRegistrationPaidFromGateway,
  removeCouponFromRegistration,
  resolveAthleteAccess,
  signupAthlete,
  updateCoupon,
  updateRace,
  updateRegistrationOperations,
} from './data-store.mjs'
import {
  createMercadoPagoCheckout,
  createMercadoPagoPaymentSession,
  fetchMercadoPagoOrder,
  fetchMercadoPagoPayment,
  getIntegrationStatus,
  sendEmailsWithResend,
} from './integrations.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const distDir = path.join(projectRoot, 'dist')
const distIndexPath = path.join(distDir, 'index.html')
const devAppUrl = process.env.DEV_APP_URL || 'http://localhost:5173'
const port = Number(process.env.PORT || 8787)

const app = express()

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

function sendData(response, data, status = 200) {
  response.status(status).json({ data })
}

function sendError(response, message, status = 400) {
  response.status(status).json({ error: message })
}

function getBearerToken(request) {
  const rawHeader = request.headers.authorization ?? ''

  if (!rawHeader.toLowerCase().startsWith('bearer ')) {
    return null
  }

  return rawHeader.slice(7).trim() || null
}

function readOrganizerToken(request) {
  return getBearerToken(request)
}

function readAthleteHeaders(request) {
  const ownerIdHeader = request.headers['x-runtrack-athlete-id']
  const athleteTokenHeader = request.headers['x-runtrack-athlete-token']

  return {
    ownerId: typeof ownerIdHeader === 'string' ? ownerIdHeader : null,
    athleteToken: typeof athleteTokenHeader === 'string' ? athleteTokenHeader : null,
  }
}

async function getAthleteAccess(request) {
  const { athleteToken, ownerId } = readAthleteHeaders(request)
  return resolveAthleteAccess({ athleteToken, ownerId })
}

function normalizePaymentPayer(payload) {
  const payer = payload?.payer ?? {}
  const address = payer?.address ?? {}

  return {
    documentNumber: String(payer.documentNumber ?? '').replace(/\D/g, ''),
    address: {
      zipCode: String(address.zipCode ?? '').replace(/\D/g, ''),
      streetName: String(address.streetName ?? '').trim(),
      streetNumber: String(address.streetNumber ?? '').trim(),
      neighborhood: String(address.neighborhood ?? '').trim(),
      city: String(address.city ?? '').trim(),
      state: String(address.state ?? '').trim().toUpperCase(),
    },
  }
}

async function requireOrganizer(request, response, next) {
  try {
    const token = readOrganizerToken(request)
    const session = await getOrganizerSession(token)

    if (!session) {
      sendError(response, 'Sessao do organizador invalida ou expirada.', 401)
      return
    }

    request.organizerSession = session
    next()
  } catch (error) {
    next(error)
  }
}

app.get('/api/health', (_request, response) => {
  sendData(response, {
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/integrations/status', (_request, response) => {
  sendData(response, getIntegrationStatus())
})

app.get('/api/races', async (_request, response, next) => {
  try {
    sendData(response, await listPublicRaces())
  } catch (error) {
    next(error)
  }
})

app.get('/api/races/:raceId', async (request, response, next) => {
  try {
    const race = await getPublicRaceById(request.params.raceId)

    if (!race) {
      sendData(response, null)
      return
    }

    sendData(response, race)
  } catch (error) {
    next(error)
  }
})

app.post('/api/contact-leads', async (request, response, next) => {
  try {
    const payload = request.body ?? {}

    if (!String(payload.name ?? '').trim() || !String(payload.email ?? '').trim()) {
      sendError(response, 'Nome e email sao obrigatorios.', 422)
      return
    }

    const lead = await createContactLead({
      audience: payload.audience === 'organizer' ? 'organizer' : 'runner',
      companyOrTeam: String(payload.companyOrTeam ?? '').trim(),
      email: String(payload.email ?? '').trim(),
      message: String(payload.message ?? '').trim(),
      name: String(payload.name ?? '').trim(),
      phone: String(payload.phone ?? '').trim(),
    })

    sendData(response, lead, 201)
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/login', async (request, response, next) => {
  try {
    const session = await authenticateOrganizer(
      String(request.body?.email ?? '').trim(),
      String(request.body?.password ?? ''),
    )

    if (!session) {
      sendError(response, 'Credenciais do organizador invalidas.', 401)
      return
    }

    sendData(response, session)
  } catch (error) {
    next(error)
  }
})

app.get('/api/auth/session', async (request, response, next) => {
  try {
    const session = await getOrganizerSession(readOrganizerToken(request))
    sendData(response, session)
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/logout', async (request, response, next) => {
  try {
    await deleteOrganizerSession(readOrganizerToken(request))
    sendData(response, { success: true })
  } catch (error) {
    next(error)
  }
})

app.post('/api/athlete-auth/signup', async (request, response, next) => {
  try {
    const payload = request.body ?? {}

    if (
      !String(payload.name ?? '').trim() ||
      !String(payload.email ?? '').trim() ||
      !String(payload.password ?? '').trim()
    ) {
      sendError(response, 'Nome, email e senha sao obrigatorios para criar a conta.', 422)
      return
    }

    const session = await signupAthlete({
      email: String(payload.email ?? '').trim(),
      name: String(payload.name ?? '').trim(),
      ownerId: String(payload.ownerId ?? '').trim() || null,
      password: String(payload.password ?? ''),
    })

    if (!session) {
      sendError(response, 'Ja existe uma conta de atleta com este email.', 409)
      return
    }

    sendData(response, session, 201)
  } catch (error) {
    next(error)
  }
})

app.post('/api/athlete-auth/login', async (request, response, next) => {
  try {
    const payload = request.body ?? {}
    const session = await authenticateAthlete(
      String(payload.email ?? '').trim(),
      String(payload.password ?? ''),
      String(payload.ownerId ?? '').trim() || null,
    )

    if (!session) {
      sendError(response, 'Credenciais do atleta invalidas.', 401)
      return
    }

    sendData(response, session)
  } catch (error) {
    next(error)
  }
})

app.get('/api/athlete-auth/session', async (request, response, next) => {
  try {
    const { athleteToken } = readAthleteHeaders(request)
    const session = await getAthleteSession(athleteToken)
    sendData(response, session)
  } catch (error) {
    next(error)
  }
})

app.post('/api/athlete-auth/logout', async (request, response, next) => {
  try {
    const { athleteToken } = readAthleteHeaders(request)
    await deleteAthleteSession(athleteToken)
    sendData(response, { success: true })
  } catch (error) {
    next(error)
  }
})

app.get('/api/registrations', async (request, response, next) => {
  try {
    const access = await getAthleteAccess(request)
    sendData(response, await listRegistrations(access))
  } catch (error) {
    next(error)
  }
})

app.get('/api/registrations/:registrationId', async (request, response, next) => {
  try {
    const access = await getAthleteAccess(request)
    const registration = await getRegistrationById(request.params.registrationId, access)
    sendData(response, registration)
  } catch (error) {
    next(error)
  }
})

app.post('/api/registrations', async (request, response, next) => {
  try {
    const access = await getAthleteAccess(request)
    const payload = request.body ?? {}

    const registration = await createRegistration(
      {
        dateOfBirth: String(payload.dateOfBirth ?? '').trim(),
        email: String(payload.email ?? '').trim(),
        emergencyContactName: String(payload.emergencyContactName ?? '').trim(),
        emergencyContactPhone: String(payload.emergencyContactPhone ?? '').trim(),
        fullName: String(payload.fullName ?? '').trim(),
        phone: String(payload.phone ?? '').trim(),
        raceId: String(payload.raceId ?? '').trim(),
        tShirtSize: String(payload.tShirtSize ?? '').trim(),
      },
      access,
    )

    if (!registration) {
      sendError(response, 'Nao foi possivel criar a inscricao para esta corrida.', 422)
      return
    }

    sendData(response, registration, 201)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/registrations/:registrationId', async (request, response, next) => {
  try {
    const access = await getAthleteAccess(request)
    const registrations = await deleteRegistration(request.params.registrationId, access)
    sendData(response, registrations)
  } catch (error) {
    next(error)
  }
})

app.post('/api/registrations/:registrationId/coupon', async (request, response, next) => {
  try {
    const access = await getAthleteAccess(request)
    const result = await applyCouponToRegistration(
      request.params.registrationId,
      access,
      String(request.body?.couponCode ?? '').trim(),
    )

    if (result.status === 'not_found') {
      sendError(response, 'Inscricao nao encontrada.', 404)
      return
    }

    if (result.status === 'locked') {
      sendError(response, 'Nao e possivel alterar cupom depois do pagamento.', 409)
      return
    }

    if (result.status === 'invalid') {
      sendError(response, 'Cupom invalido, expirado ou indisponivel para esta corrida.', 422)
      return
    }

    sendData(response, result)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/registrations/:registrationId/coupon', async (request, response, next) => {
  try {
    const access = await getAthleteAccess(request)
    const registration = await removeCouponFromRegistration(request.params.registrationId, access)

    if (!registration) {
      sendError(response, 'Inscricao nao encontrada.', 404)
      return
    }

    sendData(response, registration)
  } catch (error) {
    next(error)
  }
})

app.post('/api/registrations/:registrationId/payment', async (request, response, next) => {
  try {
    const access = await getAthleteAccess(request)
    const registration = await getRegistrationById(request.params.registrationId, access)

    if (!registration) {
      sendError(response, 'Inscricao nao encontrada.', 404)
      return
    }

    if (registration.paymentStatus === 'paid') {
      sendData(response, {
        mode: 'already_paid',
        registration,
      })
      return
    }

    const requestedMethod =
      request.body?.paymentMethod === 'card' ||
      request.body?.paymentMethod === 'boleto' ||
      request.body?.paymentMethod === 'pix'
        ? request.body.paymentMethod
        : 'pix'
    const paymentPayer = normalizePaymentPayer(request.body)

    const integrations = getIntegrationStatus()

    if (integrations.mercadoPagoEnabled) {
      if (
        (requestedMethod === 'pix' || requestedMethod === 'boleto') &&
        registration.paymentProvider === 'mercadopago' &&
        registration.paymentMethod === requestedMethod &&
        (registration.paymentQrCode || registration.paymentTicketUrl || registration.paymentOrderId)
      ) {
        sendData(response, {
          mode: 'pending_artifact',
          registration,
        })
        return
      }

      if (requestedMethod === 'pix' || requestedMethod === 'boleto') {
        if (paymentPayer.documentNumber.length !== 11) {
          sendError(response, 'Informe um CPF valido para gerar este pagamento.', 422)
          return
        }

        if (
          requestedMethod === 'boleto' &&
          (!paymentPayer.address.zipCode ||
            !paymentPayer.address.streetName ||
            !paymentPayer.address.streetNumber ||
            !paymentPayer.address.neighborhood ||
            !paymentPayer.address.city ||
            !paymentPayer.address.state)
        ) {
          sendError(response, 'Preencha o endereco completo para gerar o boleto.', 422)
          return
        }

        const paymentSession = await createMercadoPagoPaymentSession(
          registration,
          requestedMethod,
          paymentPayer,
        )

        const updatedRegistration = await attachPaymentCheckout(request.params.registrationId, access, {
          checkoutUrl: paymentSession.paymentTicketUrl,
          paymentProvider: paymentSession.paymentProvider,
          paymentPreferenceId: null,
          paymentOrderId: paymentSession.paymentOrderId,
          paymentExternalReference: paymentSession.paymentExternalReference,
          paymentMethod: paymentSession.paymentMethod,
          paymentStatusDetail: paymentSession.paymentStatusDetail,
          paymentPayer: paymentSession.paymentPayer,
          paymentQrCode: paymentSession.paymentQrCode,
          paymentQrCodeBase64: paymentSession.paymentQrCodeBase64,
          paymentTicketUrl: paymentSession.paymentTicketUrl,
          paymentDigitableLine: paymentSession.paymentDigitableLine,
          paymentBarcodeContent: paymentSession.paymentBarcodeContent,
          paymentExpiresAt: paymentSession.paymentExpiresAt,
        })

        sendData(response, {
          mode: 'pending_artifact',
          paymentMethod: requestedMethod,
          registration: updatedRegistration,
        })
        return
      }

      const checkout = await createMercadoPagoCheckout(registration)

      if (!checkout?.checkoutUrl) {
        sendError(response, 'Nao foi possivel criar o checkout do pagamento.', 502)
        return
      }

      const updatedRegistration = await attachPaymentCheckout(request.params.registrationId, access, {
        checkoutUrl: checkout.checkoutUrl,
        paymentExternalReference: checkout.paymentExternalReference,
        paymentPreferenceId: checkout.paymentPreferenceId,
        paymentProvider: 'mercadopago',
      })

      sendData(response, {
        checkoutUrl: checkout.checkoutUrl,
        mode: 'redirect',
        paymentMethod: requestedMethod,
        registration: updatedRegistration,
      })
      return
    }

    const completedRegistration = await completeRegistrationPayment(
      request.params.registrationId,
      requestedMethod,
      access,
      {
        paymentExternalReference: registration.id,
        paymentProvider: 'simulated',
      },
    )

    sendData(response, {
      mode: 'simulated',
      registration: completedRegistration,
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/registrations/:registrationId/payment-status', async (request, response, next) => {
  try {
    const access = await getAthleteAccess(request)
    const registration = await getRegistrationById(request.params.registrationId, access)

    if (!registration) {
      sendError(response, 'Inscricao nao encontrada.', 404)
      return
    }

    if (registration.paymentStatus === 'paid') {
      sendData(response, registration)
      return
    }

    if (registration.paymentProvider !== 'mercadopago' || !registration.paymentOrderId) {
      sendData(response, registration)
      return
    }

    const order = await fetchMercadoPagoOrder(registration.paymentOrderId)

    if (!order) {
      sendData(response, registration)
      return
    }

    if (order.status === 'approved') {
      const paidRegistration = await completeRegistrationPayment(
        registration.id,
        order.paymentMethod ?? registration.paymentMethod ?? 'pix',
        access,
        {
          paymentProvider: 'mercadopago',
          paymentExternalReference: order.paymentExternalReference ?? registration.id,
          paymentStatusDetail: order.paymentStatusDetail ?? order.status,
        },
      )

      sendData(response, paidRegistration)
      return
    }

    const updatedRegistration = await attachPaymentCheckout(request.params.registrationId, access, {
      checkoutUrl: order.paymentTicketUrl ?? registration.paymentCheckoutUrl,
      paymentProvider: 'mercadopago',
      paymentPreferenceId: registration.paymentPreferenceId,
      paymentOrderId: registration.paymentOrderId,
      paymentExternalReference:
        order.paymentExternalReference ?? registration.paymentExternalReference,
      paymentMethod: order.paymentMethod ?? registration.paymentMethod,
      paymentStatusDetail: order.paymentStatusDetail ?? order.status,
      paymentPayer: registration.paymentPayer,
      paymentQrCode: order.paymentQrCode ?? registration.paymentQrCode,
      paymentQrCodeBase64: order.paymentQrCodeBase64 ?? registration.paymentQrCodeBase64,
      paymentTicketUrl: order.paymentTicketUrl ?? registration.paymentTicketUrl,
      paymentDigitableLine: order.paymentDigitableLine ?? registration.paymentDigitableLine,
      paymentBarcodeContent:
        order.paymentBarcodeContent ?? registration.paymentBarcodeContent,
      paymentExpiresAt: order.paymentExpiresAt ?? registration.paymentExpiresAt,
    })

    sendData(response, updatedRegistration)
  } catch (error) {
    next(error)
  }
})

app.post('/api/payments/webhooks/mercadopago', async (request, response) => {
  try {
    const topic =
      request.body?.type ??
      request.body?.topic ??
      request.query.type ??
      request.query.topic ??
      null
    const paymentId =
      request.query['data.id'] ??
      request.query.id ??
      request.body?.data?.id ??
      request.body?.id ??
      null

    if (!paymentId) {
      response.status(200).json({ received: true })
      return
    }

    if (String(topic).toLowerCase() === 'order') {
      const order = await fetchMercadoPagoOrder(paymentId)

      if (order?.status === 'approved' && order.paymentExternalReference) {
        await markRegistrationPaidFromGateway(order.paymentExternalReference, order)
      }

      response.status(200).json({ received: true })
      return
    }

    const payment = await fetchMercadoPagoPayment(paymentId)

    if (payment?.status === 'approved' && payment.paymentExternalReference) {
      await markRegistrationPaidFromGateway(payment.paymentExternalReference, payment)
    }

    response.status(200).json({ received: true })
  } catch (error) {
    console.error('Mercado Pago webhook error:', error)
    response.status(200).json({ received: true })
  }
})

app.use('/api/organizer', requireOrganizer)

app.get('/api/dashboard', requireOrganizer, async (_request, response, next) => {
  try {
    sendData(response, await getDashboardSnapshot())
  } catch (error) {
    next(error)
  }
})

app.get('/api/contact-leads', requireOrganizer, async (_request, response, next) => {
  try {
    sendData(response, await listContactLeads())
  } catch (error) {
    next(error)
  }
})

app.get('/api/emails', requireOrganizer, async (_request, response, next) => {
  try {
    sendData(response, await listEmailQueue())
  } catch (error) {
    next(error)
  }
})

app.post('/api/emails/send', requireOrganizer, async (_request, response, next) => {
  try {
    const queuedEmails = (await listEmailQueue()).filter((email) => email.status === 'queued')

    if (queuedEmails.length === 0) {
      sendData(response, [])
      return
    }

    const sentPayloads = await sendEmailsWithResend(queuedEmails)
    const updatedQueue = await markEmailsAsSent(sentPayloads)
    sendData(response, updatedQueue)
  } catch (error) {
    next(error)
  }
})

app.get('/api/organizer/races', async (_request, response, next) => {
  try {
    sendData(response, await listOrganizerRaces())
  } catch (error) {
    next(error)
  }
})

app.post('/api/organizer/races', async (request, response, next) => {
  try {
    const organizerId = request.organizerSession.organizer.id
    const race = await createRace(request.body ?? {}, organizerId)
    sendData(response, race, 201)
  } catch (error) {
    next(error)
  }
})

app.put('/api/organizer/races/:raceId', async (request, response, next) => {
  try {
    const race = await updateRace(request.params.raceId, request.body ?? {})

    if (!race) {
      sendError(response, 'Evento nao encontrado.', 404)
      return
    }

    sendData(response, race)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/organizer/races/:raceId', async (request, response, next) => {
  try {
    const result = await deleteRace(request.params.raceId)

    if (result.status === 'not_found') {
      sendError(response, 'Evento nao encontrado.', 404)
      return
    }

    if (result.status === 'in_use') {
      sendError(
        response,
        'Nao e possivel remover um evento que ja possui inscricoes vinculadas.',
        409,
      )
      return
    }

    sendData(response, result.races)
  } catch (error) {
    next(error)
  }
})

app.get('/api/organizer/coupons', async (_request, response, next) => {
  try {
    sendData(response, await listCoupons())
  } catch (error) {
    next(error)
  }
})

app.post('/api/organizer/coupons', async (request, response, next) => {
  try {
    const coupon = await createCoupon(request.body ?? {})

    if (!coupon) {
      sendError(response, 'Ja existe um cupom com este codigo.', 409)
      return
    }

    sendData(response, coupon, 201)
  } catch (error) {
    next(error)
  }
})

app.put('/api/organizer/coupons/:couponId', async (request, response, next) => {
  try {
    const result = await updateCoupon(request.params.couponId, request.body ?? {})

    if (!result) {
      sendError(response, 'Cupom nao encontrado.', 404)
      return
    }

    if (result.status === 'conflict') {
      sendError(response, 'Ja existe outro cupom com este codigo.', 409)
      return
    }

    sendData(response, result.coupon)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/organizer/coupons/:couponId', async (request, response, next) => {
  try {
    const result = await deleteCoupon(request.params.couponId)

    if (result.status === 'not_found') {
      sendError(response, 'Cupom nao encontrado.', 404)
      return
    }

    if (result.status === 'in_use') {
      sendError(
        response,
        'Nao e possivel remover um cupom que ja foi usado em inscricoes pagas.',
        409,
      )
      return
    }

    sendData(response, result.coupons)
  } catch (error) {
    next(error)
  }
})

app.patch(
  '/api/organizer/registrations/:registrationId/operations',
  async (request, response, next) => {
    try {
      const registration = await updateRegistrationOperations(request.params.registrationId, {
        checkInStatus:
          request.body?.checkInStatus === 'checked_in' || request.body?.checkInStatus === 'pending'
            ? request.body.checkInStatus
            : undefined,
        kitStatus:
          request.body?.kitStatus === 'pending' ||
          request.body?.kitStatus === 'separated' ||
          request.body?.kitStatus === 'delivered'
            ? request.body.kitStatus
            : undefined,
      })

      if (!registration) {
        sendError(response, 'Inscricao nao encontrada.', 404)
        return
      }

      sendData(response, registration)
    } catch (error) {
      next(error)
    }
  },
)

app.use('/api', (_request, response) => {
  sendError(response, 'Endpoint da API nao encontrado.', 404)
})

app.use(express.static(distDir))

app.get(/^(?!\/api).*/, (request, response, next) => {
  if (request.path.startsWith('/api')) {
    next()
    return
  }

  if (!fs.existsSync(distIndexPath)) {
    if (process.env.NODE_ENV !== 'production') {
      response.redirect(302, `${devAppUrl}${request.originalUrl}`)
      return
    }

    sendError(response, 'Frontend build nao encontrado. Execute "npm run build".', 503)
    return
  }

  response.sendFile(distIndexPath, (error) => {
    if (error) {
      next(error)
    }
  })
})

app.use((error, _request, response, _next) => {
  console.error(error)
  sendError(response, error instanceof Error ? error.message : 'Erro interno do servidor.', 500)
})

app.listen(port, () => {
  console.log(`RunTrack server listening on http://127.0.0.1:${port}`)
})
