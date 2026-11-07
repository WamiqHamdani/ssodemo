import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { EventType, type AuthenticationResult } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance } from './authConfig'
import App from './App'
import './index.css'

await msalInstance.initialize()

// Pick up an existing session (SSO) and track the signed-in account
const accounts = msalInstance.getAllAccounts()
if (accounts.length > 0) msalInstance.setActiveAccount(accounts[0])
msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
    msalInstance.setActiveAccount((event.payload as AuthenticationResult).account)
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </StrictMode>,
)
