import { Route, Routes } from 'react-router-dom'

import { OrganizerAuthProvider, OrganizerProtectedRoute } from '../components/OrganizerAuth'
import { OrganizerDashboardPage } from '../pages/OrganizerDashboardPage'
import { OrganizerLoginPage } from '../pages/OrganizerLoginPage'

export default function OperatorApp() {
  return (
    <OrganizerAuthProvider>
      <Routes>
        <Route path="login" element={<OrganizerLoginPage />} />
        <Route
          index
          element={
            <OrganizerProtectedRoute>
              <OrganizerDashboardPage />
            </OrganizerProtectedRoute>
          }
        />
      </Routes>
    </OrganizerAuthProvider>
  )
}
