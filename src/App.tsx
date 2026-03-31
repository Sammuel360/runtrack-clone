import { Route, Routes } from 'react-router-dom'

import { OrganizerProtectedRoute } from './components/OrganizerAuth'
import { ScrollToTop } from './components/Layout'
import { AthleteLoginPage } from './pages/AthleteLoginPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { ConfirmationPage } from './pages/ConfirmationPage'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { PrivacyPage, TermsPage } from './pages/LegalPages'
import { MyRegistrationsPage } from './pages/MyRegistrationsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage'
import { OrganizerLoginPage } from './pages/OrganizerLoginPage'
import { PaymentSlipPage } from './pages/PaymentSlipPage'
import { RacesPage } from './pages/RacesPage'
import { RegisterPage } from './pages/RegisterPage'

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
        <Route path="/organizer/login" element={<OrganizerLoginPage />} />
        <Route
          path="/organizer"
          element={
            <OrganizerProtectedRoute>
              <OrganizerDashboardPage />
            </OrganizerProtectedRoute>
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
