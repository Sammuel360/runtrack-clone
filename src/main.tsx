import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { AthleteAuthProvider } from './components/AthleteAuth'
import './style.css'
import './product.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AthleteAuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AthleteAuthProvider>
  </StrictMode>,
)
