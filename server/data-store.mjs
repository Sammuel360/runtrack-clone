import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')
const databasePath = path.join(dataDir, 'database.json')

const seedRaces = [
  {
    id: '2txtk71oi4aobtg',
    name: 'Maratona da Cidade',
    date: '2026-04-15',
    description:
      'Uma maratona completa de 42.2km atraves das ruas vibrantes da cidade. Perfeita para corredores experientes que buscam um desafio epico.',
    distance: 42.2,
    featured: true,
    imageUrl: '',
    location: 'Sao Paulo, SP',
    price: 89.99,
    status: 'published',
    time: '05:30',
  },
  {
    id: 'fy9o0l4sl1bsosx',
    name: 'Corrida Divertida 5K',
    date: '2026-04-22',
    description:
      'Uma corrida casual de 5km ideal para iniciantes e familias. Divirta-se enquanto se exercita em um ambiente acolhedor.',
    distance: 5,
    featured: true,
    imageUrl: '',
    location: 'Rio de Janeiro, RJ',
    price: 29.99,
    status: 'published',
    time: '07:00',
  },
  {
    id: '1ajy4p5g5d92oez',
    name: 'Corrida de Trilha 10K',
    date: '2026-05-10',
    description:
      'Desafio de 10km em trilhas naturais com paisagens deslumbrantes. Recomendado para corredores com experiencia em terrenos variados.',
    distance: 10,
    featured: true,
    imageUrl: '',
    location: 'Belo Horizonte, MG',
    price: 49.99,
    status: 'published',
    time: '06:15',
  },
  {
    id: 'ewr6sosw1f5crue',
    name: 'Meia Maratona',
    date: '2026-05-18',
    description:
      'Uma meia maratona de 21.1km para corredores intermediarios. Teste sua resistencia em um percurso bem organizado.',
    distance: 21.1,
    featured: false,
    imageUrl: '',
    location: 'Brasilia, DF',
    price: 59.99,
    status: 'published',
    time: '05:45',
  },
  {
    id: 'bd38rc5bepi7auy',
    name: 'Corrida Sprint',
    date: '2026-05-30',
    description:
      'Uma corrida rapida de 3km perfeita para quem quer comecar. Otima para melhorar sua velocidade e resistencia.',
    distance: 3,
    featured: false,
    imageUrl: '',
    location: 'Curitiba, PR',
    price: 19.99,
    status: 'published',
    time: '08:00',
  },
  {
    id: 'f8ct8txg6nwc39z',
    name: 'City Marathon',
    date: '2026-06-05',
    description:
      'Percurso urbano com altimetria equilibrada para atletas que querem performance e experiencia internacional.',
    distance: 42.2,
    featured: false,
    imageUrl: '',
    location: 'Downtown',
    price: 89,
    status: 'published',
    time: '06:00',
  },
  {
    id: '9nuur3msbwg4a4s',
    name: 'Spring 5K',
    date: '2026-06-12',
    description:
      'Prova leve e colorida pensada para iniciantes, assessorias e publico corporativo.',
    distance: 5,
    featured: false,
    imageUrl: '',
    location: 'Central Park',
    price: 25,
    status: 'published',
    time: '07:30',
  },
  {
    id: 'af0ojzcz2bu6xwc',
    name: 'Mountain Trail Run',
    date: '2026-06-19',
    description:
      'Trilhas tecnicas e vistas amplas para atletas que buscam aventura e contato com a natureza.',
    distance: 15,
    featured: false,
    imageUrl: '',
    location: 'Mountain Ridge',
    price: 45,
    status: 'published',
    time: '06:40',
  },
  {
    id: '30i6crjv5xoex08',
    name: 'Half Marathon Challenge',
    date: '2026-06-26',
    description:
      'Evento desenhado para quem quer buscar recorde pessoal em um circuito rapido e seguro.',
    distance: 21.1,
    featured: false,
    imageUrl: '',
    location: 'Riverside',
    price: 65,
    status: 'published',
    time: '05:50',
  },
  {
    id: 'f3gxztqb7jsaker',
    name: 'Urban 10K',
    date: '2026-07-03',
    description:
      'Corrida de 10km para atletas que gostam de cidade, ritmo forte e estrutura premium.',
    distance: 10,
    featured: false,
    imageUrl: '',
    location: 'City Streets',
    price: 35,
    status: 'draft',
    time: '07:10',
  },
]

const defaultOrganizers = [
  {
    id: 'organizer-default',
    name: 'Equipe RunTrack',
    email: 'organizer@runtrack.local',
    password: 'runtrack123',
  },
]

const emptyDatabase = {
  races: seedRaces,
  organizers: defaultOrganizers,
  organizerSessions: [],
  athletes: [],
  athleteSessions: [],
  coupons: [],
  registrations: [],
  contactLeads: [],
  emailQueue: [],
}

let writeQueue = Promise.resolve()

async function ensureDatabase() {
  await mkdir(dataDir, { recursive: true })

  if (!existsSync(databasePath)) {
    await writeFile(databasePath, JSON.stringify(emptyDatabase, null, 2), 'utf8')
  }
}

function normalizeRace(race) {
  return {
    id: race.id ?? crypto.randomUUID(),
    name: race.name ?? 'Evento sem nome',
    date: race.date ?? '',
    description: race.description ?? '',
    distance: Number(race.distance ?? 5),
    featured: Boolean(race.featured),
    imageUrl: race.imageUrl ?? '',
    location: race.location ?? '',
    organizerId: race.organizerId ?? 'organizer-default',
    price: Number(race.price ?? 0),
    status: race.status === 'draft' ? 'draft' : 'published',
    time: race.time ?? '',
    created: race.created ?? null,
    updated: race.updated ?? null,
  }
}

function normalizeCoupon(coupon) {
  return {
    id: coupon.id ?? crypto.randomUUID(),
    code: String(coupon.code ?? '').trim().toUpperCase(),
    description: coupon.description ?? '',
    type: coupon.type === 'fixed' ? 'fixed' : 'percent',
    value: Number(coupon.value ?? 0),
    active: coupon.active !== false,
    raceIds: Array.isArray(coupon.raceIds) ? coupon.raceIds : [],
    usageLimit:
      typeof coupon.usageLimit === 'number' && !Number.isNaN(coupon.usageLimit)
        ? coupon.usageLimit
        : null,
    usedCount: Number(coupon.usedCount ?? 0),
    validFrom: coupon.validFrom ?? null,
    validUntil: coupon.validUntil ?? null,
    created: coupon.created ?? new Date().toISOString(),
  }
}

function normalizeRegistration(registration) {
  const racePrice = Number(registration.racePrice ?? 0)
  const finalPrice =
    typeof registration.finalPrice === 'number' && !Number.isNaN(registration.finalPrice)
      ? registration.finalPrice
      : racePrice

  return {
    fullName: registration.fullName ?? '',
    email: registration.email ?? '',
    phone: registration.phone ?? '',
    dateOfBirth: registration.dateOfBirth ?? '',
    tShirtSize: registration.tShirtSize ?? '',
    emergencyContactName: registration.emergencyContactName ?? '',
    emergencyContactPhone: registration.emergencyContactPhone ?? '',
    id: registration.id ?? crypto.randomUUID(),
    created: registration.created ?? new Date().toISOString(),
    confirmationNumber:
      registration.confirmationNumber ?? `RUN${Date.now().toString().slice(-8)}`,
    ownerId: registration.ownerId ?? null,
    athleteId: registration.athleteId ?? null,
    status: registration.status === 'confirmed' ? 'confirmed' : 'pending_payment',
    raceId: registration.raceId ?? '',
    raceName: registration.raceName ?? '',
    racePrice,
    couponCode: registration.couponCode ?? null,
    couponRedeemedAt: registration.couponRedeemedAt ?? null,
    discountAmount: Number(registration.discountAmount ?? 0),
    finalPrice,
    paymentStatus: registration.paymentStatus === 'paid' ? 'paid' : 'pending',
    paymentMethod:
      registration.paymentMethod === 'pix' ||
      registration.paymentMethod === 'card' ||
      registration.paymentMethod === 'boleto'
        ? registration.paymentMethod
        : null,
    paymentProvider: registration.paymentProvider ?? 'simulated',
    paymentCheckoutUrl: registration.paymentCheckoutUrl ?? null,
    paymentPreferenceId: registration.paymentPreferenceId ?? null,
    paymentOrderId: registration.paymentOrderId ?? null,
    paymentExternalReference: registration.paymentExternalReference ?? null,
    paymentStatusDetail: registration.paymentStatusDetail ?? null,
    paymentPayer:
      registration.paymentPayer && typeof registration.paymentPayer === 'object'
        ? registration.paymentPayer
        : null,
    paymentQrCode: registration.paymentQrCode ?? null,
    paymentQrCodeBase64: registration.paymentQrCodeBase64 ?? null,
    paymentTicketUrl: registration.paymentTicketUrl ?? null,
    paymentDigitableLine: registration.paymentDigitableLine ?? null,
    paymentBarcodeContent: registration.paymentBarcodeContent ?? null,
    paymentExpiresAt: registration.paymentExpiresAt ?? null,
    paidAt: registration.paidAt ?? null,
    kitStatus:
      registration.kitStatus === 'separated' || registration.kitStatus === 'delivered'
        ? registration.kitStatus
        : 'pending',
    checkInStatus: registration.checkInStatus === 'checked_in' ? 'checked_in' : 'pending',
    checkInAt: registration.checkInAt ?? null,
  }
}

function sanitizeOrganizer(organizer) {
  return {
    id: organizer.id,
    name: organizer.name,
    email: organizer.email,
  }
}

function sanitizeAthlete(athlete) {
  return {
    id: athlete.id,
    name: athlete.name,
    email: athlete.email,
  }
}

async function readDatabase() {
  await ensureDatabase()

  try {
    const raw = await readFile(databasePath, 'utf8')
    const parsed = JSON.parse(raw)

    return {
      races:
        Array.isArray(parsed.races) && parsed.races.length > 0
          ? parsed.races.map(normalizeRace)
          : seedRaces.map(normalizeRace),
      organizers:
        Array.isArray(parsed.organizers) && parsed.organizers.length > 0
          ? parsed.organizers
          : defaultOrganizers,
      organizerSessions: Array.isArray(parsed.organizerSessions)
        ? parsed.organizerSessions
        : Array.isArray(parsed.sessions)
          ? parsed.sessions
          : [],
      athletes: Array.isArray(parsed.athletes) ? parsed.athletes : [],
      athleteSessions: Array.isArray(parsed.athleteSessions) ? parsed.athleteSessions : [],
      coupons: Array.isArray(parsed.coupons) ? parsed.coupons.map(normalizeCoupon) : [],
      registrations: Array.isArray(parsed.registrations)
        ? parsed.registrations.map(normalizeRegistration)
        : [],
      contactLeads: Array.isArray(parsed.contactLeads) ? parsed.contactLeads : [],
      emailQueue: Array.isArray(parsed.emailQueue) ? parsed.emailQueue : [],
    }
  } catch {
    await writeDatabase(emptyDatabase)
    return structuredClone(emptyDatabase)
  }
}

async function writeDatabase(database) {
  await ensureDatabase()
  await writeFile(databasePath, JSON.stringify(database, null, 2), 'utf8')
}

async function updateDatabase(mutator) {
  const run = async () => {
    const database = await readDatabase()
    const result = await mutator(database)
    await writeDatabase(database)
    return result
  }

  const currentTask = writeQueue.then(run)
  writeQueue = currentTask.catch(() => undefined)
  return currentTask
}

function queueEmail(
  database,
  {
    kind,
    preview,
    relatedLeadId = null,
    relatedRegistrationId = null,
    subject,
    to,
  },
) {
  const email = {
    id: crypto.randomUUID(),
    created: new Date().toISOString(),
    status: 'queued',
    kind,
    to,
    subject,
    preview,
    relatedRegistrationId,
    relatedLeadId,
    sentAt: null,
    providerMessageId: null,
  }

  database.emailQueue = [email, ...database.emailQueue]
  return email
}

function getRaceByIdUnsafe(database, raceId) {
  return database.races.find((race) => race.id === raceId) ?? null
}

function getCouponByCodeUnsafe(database, couponCode) {
  return (
    database.coupons.find((coupon) => coupon.code === String(couponCode).trim().toUpperCase()) ??
    null
  )
}

function getRegistrationAccessMatch(registration, access) {
  if (access?.athleteId) {
    return registration.athleteId === access.athleteId
  }

  if (access?.ownerId) {
    return registration.ownerId === access.ownerId && registration.athleteId === null
  }

  return false
}

function migrateAnonymousRegistrations(database, ownerId, athleteId) {
  if (!ownerId || !athleteId) {
    return
  }

  database.registrations = database.registrations.map((registration) =>
    registration.ownerId === ownerId
      ? {
          ...registration,
          athleteId,
          ownerId: null,
        }
      : registration,
  )
}

function isCouponValidForRegistration(coupon, registration, database) {
  if (!coupon || !coupon.active) {
    return false
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return false
  }

  const now = new Date()

  if (coupon.validFrom && new Date(coupon.validFrom) > now) {
    return false
  }

  if (coupon.validUntil && new Date(coupon.validUntil) < now) {
    return false
  }

  if (coupon.raceIds.length > 0 && !coupon.raceIds.includes(registration.raceId)) {
    return false
  }

  const existingPaidUsage = database.registrations.some(
    (currentRegistration) =>
      currentRegistration.id !== registration.id &&
      currentRegistration.couponCode === coupon.code &&
      currentRegistration.couponRedeemedAt,
  )

  if (coupon.usageLimit === 1 && existingPaidUsage) {
    return false
  }

  return true
}

function getCouponPricing(coupon, racePrice) {
  const safeRacePrice = Number(racePrice ?? 0)

  if (!coupon) {
    return {
      discountAmount: 0,
      finalPrice: safeRacePrice,
    }
  }

  const rawDiscount =
    coupon.type === 'fixed' ? Number(coupon.value) : (safeRacePrice * Number(coupon.value)) / 100

  const discountAmount = Math.max(0, Math.min(safeRacePrice, Number(rawDiscount.toFixed(2))))

  return {
    discountAmount,
    finalPrice: Number((safeRacePrice - discountAmount).toFixed(2)),
  }
}

function buildReports(database) {
  const paidRegistrations = database.registrations.filter(
    (registration) => registration.paymentStatus === 'paid',
  )

  const byRace = database.races.map((race) => {
    const raceRegistrations = database.registrations.filter(
      (registration) => registration.raceId === race.id,
    )
    const racePaid = raceRegistrations.filter(
      (registration) => registration.paymentStatus === 'paid',
    )

    return {
      raceId: race.id,
      raceName: race.name,
      status: race.status,
      registrations: raceRegistrations.length,
      paidRegistrations: racePaid.length,
      pendingRegistrations: raceRegistrations.length - racePaid.length,
      checkedIn: raceRegistrations.filter(
        (registration) => registration.checkInStatus === 'checked_in',
      ).length,
      kitsDelivered: raceRegistrations.filter(
        (registration) => registration.kitStatus === 'delivered',
      ).length,
      revenue: racePaid.reduce((total, registration) => total + registration.finalPrice, 0),
    }
  })

  const couponUsage = database.coupons.map((coupon) => ({
    code: coupon.code,
    usedCount: coupon.usedCount,
    active: coupon.active,
    revenueImpact: database.registrations
      .filter((registration) => registration.couponCode === coupon.code)
      .reduce((total, registration) => total + registration.discountAmount, 0),
  }))

  return {
    byRace,
    couponUsage,
    totalDiscount: paidRegistrations.reduce(
      (total, registration) => total + registration.discountAmount,
      0,
    ),
    checkedInCount: database.registrations.filter(
      (registration) => registration.checkInStatus === 'checked_in',
    ).length,
    kitsDeliveredCount: database.registrations.filter(
      (registration) => registration.kitStatus === 'delivered',
    ).length,
  }
}

export async function listPublicRaces() {
  const database = await readDatabase()
  return database.races.filter((race) => race.status === 'published')
}

export async function listOrganizerRaces() {
  const database = await readDatabase()
  return database.races
}

export async function getPublicRaceById(raceId) {
  if (!raceId) {
    return null
  }

  const database = await readDatabase()
  const race = getRaceByIdUnsafe(database, raceId)
  return race?.status === 'published' ? race : null
}

export async function createRace(payload, organizerId) {
  return updateDatabase((database) => {
    const race = normalizeRace({
      id: crypto.randomUUID(),
      ...payload,
      organizerId,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    })

    database.races = [race, ...database.races]
    return race
  })
}

export async function updateRace(raceId, payload) {
  return updateDatabase((database) => {
    const existingRace = getRaceByIdUnsafe(database, raceId)

    if (!existingRace) {
      return null
    }

    const nextRace = normalizeRace({
      ...existingRace,
      ...payload,
      updated: new Date().toISOString(),
    })

    database.races = database.races.map((race) => (race.id === raceId ? nextRace : race))
    return nextRace
  })
}

export async function deleteRace(raceId) {
  return updateDatabase((database) => {
    const existingRace = getRaceByIdUnsafe(database, raceId)

    if (!existingRace) {
      return { status: 'not_found' }
    }

    const hasRegistrations = database.registrations.some(
      (registration) => registration.raceId === raceId,
    )

    if (hasRegistrations) {
      return { status: 'in_use' }
    }

    database.races = database.races.filter((race) => race.id !== raceId)
    return { status: 'deleted', races: database.races }
  })
}

export async function listCoupons() {
  const database = await readDatabase()
  return database.coupons
}

export async function createCoupon(payload) {
  return updateDatabase((database) => {
    const existingCoupon = getCouponByCodeUnsafe(database, payload.code)

    if (existingCoupon) {
      return null
    }

    const coupon = normalizeCoupon({
      id: crypto.randomUUID(),
      ...payload,
      created: new Date().toISOString(),
    })

    database.coupons = [coupon, ...database.coupons]
    return coupon
  })
}

export async function updateCoupon(couponId, payload) {
  return updateDatabase((database) => {
    const existingCoupon = database.coupons.find((coupon) => coupon.id === couponId) ?? null

    if (!existingCoupon) {
      return null
    }

    const conflictingCoupon = database.coupons.find(
      (coupon) =>
        coupon.id !== couponId && coupon.code === String(payload.code).trim().toUpperCase(),
    )

    if (conflictingCoupon) {
      return { status: 'conflict' }
    }

    const nextCoupon = normalizeCoupon({
      ...existingCoupon,
      ...payload,
      id: existingCoupon.id,
    })

    database.coupons = database.coupons.map((coupon) =>
      coupon.id === couponId ? nextCoupon : coupon,
    )

    return { status: 'updated', coupon: nextCoupon }
  })
}

export async function deleteCoupon(couponId) {
  return updateDatabase((database) => {
    const existingCoupon = database.coupons.find((coupon) => coupon.id === couponId) ?? null

    if (!existingCoupon) {
      return { status: 'not_found' }
    }

    const hasPaidUsage = database.registrations.some(
      (registration) =>
        registration.couponCode === existingCoupon.code && registration.couponRedeemedAt,
    )

    if (hasPaidUsage) {
      return { status: 'in_use' }
    }

    database.coupons = database.coupons.filter((coupon) => coupon.id !== couponId)
    return { status: 'deleted', coupons: database.coupons }
  })
}

export async function authenticateOrganizer(email, password) {
  return updateDatabase((database) => {
    const organizer = database.organizers.find(
      (currentOrganizer) =>
        currentOrganizer.email.toLowerCase() === email.toLowerCase() &&
        currentOrganizer.password === password,
    )

    if (!organizer) {
      return null
    }

    const session = {
      token: crypto.randomUUID(),
      organizerId: organizer.id,
      created: new Date().toISOString(),
    }

    database.organizerSessions = [
      session,
      ...database.organizerSessions.filter((item) => item.organizerId !== organizer.id),
    ]

    return {
      token: session.token,
      organizer: sanitizeOrganizer(organizer),
    }
  })
}

export async function getOrganizerSession(token) {
  if (!token) {
    return null
  }

  const database = await readDatabase()
  const session = database.organizerSessions.find(
    (currentSession) => currentSession.token === token,
  )

  if (!session) {
    return null
  }

  const organizer = database.organizers.find(
    (currentOrganizer) => currentOrganizer.id === session.organizerId,
  )

  if (!organizer) {
    return null
  }

  return {
    token: session.token,
    organizer: sanitizeOrganizer(organizer),
  }
}

export async function deleteOrganizerSession(token) {
  return updateDatabase((database) => {
    const nextSessions = database.organizerSessions.filter((session) => session.token !== token)
    const removed = nextSessions.length !== database.organizerSessions.length
    database.organizerSessions = nextSessions
    return removed
  })
}

export async function signupAthlete(payload) {
  return updateDatabase((database) => {
    const existingAthlete = database.athletes.find(
      (athlete) => athlete.email.toLowerCase() === payload.email.toLowerCase(),
    )

    if (existingAthlete) {
      return null
    }

    const athlete = {
      id: crypto.randomUUID(),
      name: payload.name,
      email: payload.email,
      password: payload.password,
      created: new Date().toISOString(),
    }

    database.athletes = [athlete, ...database.athletes]
    migrateAnonymousRegistrations(database, payload.ownerId, athlete.id)

    const session = {
      token: crypto.randomUUID(),
      athleteId: athlete.id,
      created: new Date().toISOString(),
    }

    database.athleteSessions = [
      session,
      ...database.athleteSessions.filter((item) => item.athleteId !== athlete.id),
    ]

    return {
      token: session.token,
      athlete: sanitizeAthlete(athlete),
    }
  })
}

export async function authenticateAthlete(email, password, ownerId) {
  return updateDatabase((database) => {
    const athlete = database.athletes.find(
      (currentAthlete) =>
        currentAthlete.email.toLowerCase() === email.toLowerCase() &&
        currentAthlete.password === password,
    )

    if (!athlete) {
      return null
    }

    migrateAnonymousRegistrations(database, ownerId, athlete.id)

    const session = {
      token: crypto.randomUUID(),
      athleteId: athlete.id,
      created: new Date().toISOString(),
    }

    database.athleteSessions = [
      session,
      ...database.athleteSessions.filter((item) => item.athleteId !== athlete.id),
    ]

    return {
      token: session.token,
      athlete: sanitizeAthlete(athlete),
    }
  })
}

export async function getAthleteSession(token) {
  if (!token) {
    return null
  }

  const database = await readDatabase()
  const session = database.athleteSessions.find(
    (currentSession) => currentSession.token === token,
  )

  if (!session) {
    return null
  }

  const athlete = database.athletes.find(
    (currentAthlete) => currentAthlete.id === session.athleteId,
  )

  if (!athlete) {
    return null
  }

  return {
    token: session.token,
    athlete: sanitizeAthlete(athlete),
  }
}

export async function deleteAthleteSession(token) {
  return updateDatabase((database) => {
    const nextSessions = database.athleteSessions.filter((session) => session.token !== token)
    const removed = nextSessions.length !== database.athleteSessions.length
    database.athleteSessions = nextSessions
    return removed
  })
}

export async function resolveAthleteAccess({ athleteToken, ownerId }) {
  const athleteSession = athleteToken ? await getAthleteSession(athleteToken) : null

  return {
    athleteId: athleteSession?.athlete.id ?? null,
    ownerId: athleteSession ? null : ownerId ?? null,
    athleteSession,
  }
}

export async function listRegistrations(access) {
  const database = await readDatabase()
  return database.registrations.filter((registration) =>
    getRegistrationAccessMatch(registration, access),
  )
}

export async function getRegistrationById(registrationId, access) {
  if (!registrationId) {
    return null
  }

  const database = await readDatabase()
  return (
    database.registrations.find(
      (registration) =>
        registration.id === registrationId && getRegistrationAccessMatch(registration, access),
    ) ?? null
  )
}

export async function createRegistration(payload, access) {
  return updateDatabase((database) => {
    const race = getRaceByIdUnsafe(database, payload.raceId)

    if (!race || race.status !== 'published') {
      return null
    }

    if (!access?.athleteId && !access?.ownerId) {
      return null
    }

    const registration = normalizeRegistration({
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      dateOfBirth: payload.dateOfBirth,
      tShirtSize: payload.tShirtSize,
      emergencyContactName: payload.emergencyContactName,
      emergencyContactPhone: payload.emergencyContactPhone,
      id: crypto.randomUUID(),
      created: new Date().toISOString(),
      confirmationNumber: `RUN${Date.now().toString().slice(-8)}`,
      ownerId: access.athleteId ? null : access.ownerId,
      athleteId: access.athleteId ?? null,
      status: 'pending_payment',
      raceId: race.id,
      raceName: race.name,
      racePrice: race.price,
      finalPrice: race.price,
      paymentStatus: 'pending',
      paymentMethod: null,
      paymentProvider: 'simulated',
      kitStatus: 'pending',
      checkInStatus: 'pending',
    })

    database.registrations = [registration, ...database.registrations]

    queueEmail(database, {
      kind: 'registration_received',
      to: registration.email,
      subject: `Reserva recebida para ${registration.raceName}`,
      preview:
        'Sua reserva foi criada. Finalize o pagamento para confirmar a inscricao no evento.',
      relatedRegistrationId: registration.id,
    })

    return registration
  })
}

export async function deleteRegistration(registrationId, access) {
  return updateDatabase((database) => {
    if (!access?.athleteId && !access?.ownerId) {
      return []
    }

    database.registrations = database.registrations.filter(
      (registration) =>
        registration.id !== registrationId || !getRegistrationAccessMatch(registration, access),
    )
    database.emailQueue = database.emailQueue.filter(
      (email) => email.relatedRegistrationId !== registrationId,
    )

    return database.registrations.filter((registration) =>
      getRegistrationAccessMatch(registration, access),
    )
  })
}

export async function applyCouponToRegistration(registrationId, access, couponCode) {
  return updateDatabase((database) => {
    const registration = database.registrations.find(
      (currentRegistration) =>
        currentRegistration.id === registrationId &&
        getRegistrationAccessMatch(currentRegistration, access),
    )

    if (!registration) {
      return { status: 'not_found' }
    }

    if (registration.paymentStatus === 'paid') {
      return { status: 'locked' }
    }

    const coupon = getCouponByCodeUnsafe(database, couponCode)

    if (!isCouponValidForRegistration(coupon, registration, database)) {
      return { status: 'invalid' }
    }

    const pricing = getCouponPricing(coupon, registration.racePrice)

    const nextRegistration = {
      ...registration,
      couponCode: coupon.code,
      discountAmount: pricing.discountAmount,
      finalPrice: pricing.finalPrice,
    }

    database.registrations = database.registrations.map((currentRegistration) =>
      currentRegistration.id === registrationId ? nextRegistration : currentRegistration,
    )

    return { status: 'applied', registration: nextRegistration, coupon }
  })
}

export async function removeCouponFromRegistration(registrationId, access) {
  return updateDatabase((database) => {
    const registration = database.registrations.find(
      (currentRegistration) =>
        currentRegistration.id === registrationId &&
        getRegistrationAccessMatch(currentRegistration, access),
    )

    if (!registration) {
      return null
    }

    const nextRegistration = {
      ...registration,
      couponCode: null,
      discountAmount: 0,
      finalPrice: registration.racePrice,
    }

    database.registrations = database.registrations.map((currentRegistration) =>
      currentRegistration.id === registrationId ? nextRegistration : currentRegistration,
    )

    return nextRegistration
  })
}

export async function attachPaymentCheckout(
  registrationId,
  access,
  {
    checkoutUrl,
    paymentProvider,
    paymentPreferenceId = null,
    paymentOrderId = null,
    paymentExternalReference = null,
    paymentMethod = null,
    paymentStatusDetail = null,
    paymentPayer = null,
    paymentQrCode = null,
    paymentQrCodeBase64 = null,
    paymentTicketUrl = null,
    paymentDigitableLine = null,
    paymentBarcodeContent = null,
    paymentExpiresAt = null,
  },
) {
  return updateDatabase((database) => {
    const registration = database.registrations.find(
      (currentRegistration) =>
        currentRegistration.id === registrationId &&
        getRegistrationAccessMatch(currentRegistration, access),
    )

    if (!registration) {
      return null
    }

    const nextRegistration = {
      ...registration,
      paymentMethod: paymentMethod ?? registration.paymentMethod,
      paymentProvider,
      paymentCheckoutUrl: checkoutUrl,
      paymentPreferenceId,
      paymentOrderId,
      paymentExternalReference,
      paymentStatusDetail,
      paymentPayer,
      paymentQrCode,
      paymentQrCodeBase64,
      paymentTicketUrl,
      paymentDigitableLine,
      paymentBarcodeContent,
      paymentExpiresAt,
    }

    database.registrations = database.registrations.map((currentRegistration) =>
      currentRegistration.id === registrationId ? nextRegistration : currentRegistration,
    )

    return nextRegistration
  })
}

function redeemCouponIfNeeded(database, registration) {
  if (!registration.couponCode || registration.couponRedeemedAt) {
    return
  }

  database.coupons = database.coupons.map((coupon) =>
    coupon.code === registration.couponCode
      ? {
          ...coupon,
          usedCount: coupon.usedCount + 1,
        }
      : coupon,
  )
}

export async function completeRegistrationPayment(
  registrationId,
  paymentMethod,
  access,
  providerData = null,
) {
  return updateDatabase((database) => {
    const existingRegistration = database.registrations.find(
      (registration) =>
        registration.id === registrationId && getRegistrationAccessMatch(registration, access),
    )

    if (!existingRegistration) {
      return null
    }

    if (existingRegistration.paymentStatus === 'paid') {
      return existingRegistration
    }

    const finalizedRegistration = {
      ...existingRegistration,
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod,
      paymentProvider: providerData?.paymentProvider ?? existingRegistration.paymentProvider,
      paymentStatusDetail: providerData?.paymentStatusDetail ?? 'approved',
      paymentExternalReference:
        providerData?.paymentExternalReference ?? existingRegistration.paymentExternalReference,
      paidAt: new Date().toISOString(),
      couponRedeemedAt: existingRegistration.couponCode ? new Date().toISOString() : null,
    }

    database.registrations = database.registrations.map((registration) =>
      registration.id === registrationId ? finalizedRegistration : registration,
    )

    redeemCouponIfNeeded(database, finalizedRegistration)

    queueEmail(database, {
      kind: 'payment_approved',
      to: finalizedRegistration.email,
      subject: `Pagamento aprovado para ${finalizedRegistration.raceName}`,
      preview:
        'Pagamento confirmado. Sua inscricao esta completa e pronta para acompanhamento.',
      relatedRegistrationId: finalizedRegistration.id,
    })

    return finalizedRegistration
  })
}

export async function markRegistrationPaidFromGateway(paymentExternalReference, paymentInfo) {
  return updateDatabase((database) => {
    const existingRegistration = database.registrations.find(
      (registration) =>
        registration.id === paymentExternalReference ||
        registration.paymentExternalReference === paymentExternalReference ||
        registration.paymentPreferenceId === paymentExternalReference,
    )

    if (!existingRegistration) {
      return null
    }

    if (existingRegistration.paymentStatus === 'paid') {
      return existingRegistration
    }

    const finalizedRegistration = {
      ...existingRegistration,
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: paymentInfo.paymentMethod ?? existingRegistration.paymentMethod,
      paymentProvider: paymentInfo.paymentProvider ?? existingRegistration.paymentProvider,
      paymentStatusDetail: paymentInfo.status ?? 'approved',
      paymentExternalReference:
        paymentInfo.paymentExternalReference ?? existingRegistration.paymentExternalReference,
      paidAt: new Date().toISOString(),
      couponRedeemedAt: existingRegistration.couponCode ? new Date().toISOString() : null,
    }

    database.registrations = database.registrations.map((registration) =>
      registration.id === finalizedRegistration.id ? finalizedRegistration : registration,
    )

    redeemCouponIfNeeded(database, finalizedRegistration)

    queueEmail(database, {
      kind: 'payment_approved',
      to: finalizedRegistration.email,
      subject: `Pagamento aprovado para ${finalizedRegistration.raceName}`,
      preview:
        'Pagamento confirmado. Sua inscricao esta completa e pronta para acompanhamento.',
      relatedRegistrationId: finalizedRegistration.id,
    })

    return finalizedRegistration
  })
}

export async function updateRegistrationOperations(
  registrationId,
  { checkInStatus, kitStatus },
) {
  return updateDatabase((database) => {
    const existingRegistration = database.registrations.find(
      (registration) => registration.id === registrationId,
    )

    if (!existingRegistration) {
      return null
    }

    const nextRegistration = {
      ...existingRegistration,
      checkInStatus: checkInStatus ?? existingRegistration.checkInStatus,
      checkInAt:
        checkInStatus === 'checked_in'
          ? new Date().toISOString()
          : checkInStatus === 'pending'
            ? null
            : existingRegistration.checkInAt,
      kitStatus: kitStatus ?? existingRegistration.kitStatus,
    }

    database.registrations = database.registrations.map((registration) =>
      registration.id === registrationId ? nextRegistration : registration,
    )

    return nextRegistration
  })
}

export async function listContactLeads() {
  const database = await readDatabase()
  return database.contactLeads
}

export async function createContactLead(payload) {
  return updateDatabase((database) => {
    const lead = {
      id: crypto.randomUUID(),
      created: new Date().toISOString(),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      audience: payload.audience,
      companyOrTeam: payload.companyOrTeam,
      message: payload.message,
    }

    database.contactLeads = [lead, ...database.contactLeads]

    queueEmail(database, {
      kind: 'lead_received',
      to: 'contato@runtrack.com',
      subject:
        payload.audience === 'organizer'
          ? `Novo lead de organizador: ${payload.name}`
          : `Novo contato de atleta: ${payload.name}`,
      preview:
        payload.audience === 'organizer'
          ? 'Um organizador pediu contato comercial para publicar ou operar um evento.'
          : 'Um atleta deixou uma mensagem no canal comercial do produto.',
      relatedLeadId: lead.id,
    })

    return lead
  })
}

export async function listEmailQueue() {
  const database = await readDatabase()
  return database.emailQueue
}

export async function markEmailsAsSent(sentEmailPayloads) {
  return updateDatabase((database) => {
    const sentEmailIds = new Set(sentEmailPayloads.map((item) => item.id))

    database.emailQueue = database.emailQueue.map((email) => {
      const payload = sentEmailPayloads.find((item) => item.id === email.id)

      if (!payload || !sentEmailIds.has(email.id)) {
        return email
      }

      return {
        ...email,
        status: 'sent',
        sentAt: new Date().toISOString(),
        providerMessageId: payload.providerMessageId ?? null,
      }
    })

    return database.emailQueue
  })
}

export async function getDashboardSnapshot() {
  const database = await readDatabase()
  const paidRegistrations = database.registrations.filter(
    (registration) => registration.paymentStatus === 'paid',
  )
  const pendingRegistrations = database.registrations.filter(
    (registration) => registration.paymentStatus !== 'paid',
  )
  const queuedEmails = database.emailQueue.filter((email) => email.status === 'queued')
  const organizerLeads = database.contactLeads.filter((lead) => lead.audience === 'organizer')
  const revenue = paidRegistrations.reduce(
    (total, registration) => total + Number(registration.finalPrice || 0),
    0,
  )
  const reports = buildReports(database)

  return {
    races: database.races,
    coupons: database.coupons,
    registrations: database.registrations,
    contactLeads: database.contactLeads,
    emailQueue: database.emailQueue,
    reports,
    summary: {
      totalRaces: database.races.length,
      totalRegistrations: database.registrations.length,
      paidRegistrations: paidRegistrations.length,
      pendingRegistrations: pendingRegistrations.length,
      totalLeads: database.contactLeads.length,
      organizerLeads: organizerLeads.length,
      queuedEmails: queuedEmails.length,
      revenue,
      conversionRate:
        database.registrations.length === 0
          ? 0
          : Math.round((paidRegistrations.length / database.registrations.length) * 100),
      totalDiscount: reports.totalDiscount,
      checkedInCount: reports.checkedInCount,
      kitsDeliveredCount: reports.kitsDeliveredCount,
    },
  }
}
