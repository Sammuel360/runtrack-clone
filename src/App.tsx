import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'

import { OperatorLayout, ScrollToTop } from './components/Layout'
import { AthleteLoginPage } from './pages/AthleteLoginPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { ConfirmationPage } from './pages/ConfirmationPage'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { PrivacyPage, TermsPage } from './pages/LegalPages'
import { MyRegistrationsPage } from './pages/MyRegistrationsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PaymentSlipPage } from './pages/PaymentSlipPage'
import { RacesPage } from './pages/RacesPage'
import { RegisterPage } from './pages/RegisterPage'

const OperatorApp = lazy(() => import('./operator/OperatorApp'))

function OperatorAppFallback() {
  return (
    <OperatorLayout>
      <section className="section section--compact">
        <div className="container">
          <article className="panel confirmation-empty">
            <h1>Carregando area do operador</h1>
            <p>Preparando o ambiente administrativo com seguranca.</p>
          </article>
        </div>
      </section>
    </OperatorLayout>
  )
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/races" element={<RacesPage />} />
        <Route path="/athlete/login" element={<AthleteLoginPage />} />
        <Route path="/register/:raceId" element={<RegisterPage />} />
        <Route path="/checkout/:registrationId" element={<CheckoutPage />} />
        <Route path="/checkout/:registrationId/:paymentMethod" element={<CheckoutPage />} />
        <Route path="/payment-slip/:registrationId" element={<PaymentSlipPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/my-registrations" element={<MyRegistrationsPage />} />
        <Route
          path="/organizer/*"
          element={
            <Suspense fallback={<OperatorAppFallback />}>
              <OperatorApp />
            </Suspense>
          }
        />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
