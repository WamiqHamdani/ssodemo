import { InteractionRequiredAuthError } from '@azure/msal-browser'
import { apiScopes, msalInstance } from './authConfig'

export interface Me {
  name: string | null
  username: string | null
  objectId: string | null
  tenantId: string | null
  roles: string[]
}

// forceRefresh skips the cached token, e.g. to pick up newly assigned roles
async function getToken(forceRefresh = false): Promise<string> {
  // Right after the login redirect the active account may not be set yet
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0]
  if (!account) throw new Error('Not signed in')
  try {
    const result = await msalInstance.acquireTokenSilent({ scopes: apiScopes, account, forceRefresh })
    return result.accessToken
  } catch (e) {
    // Consent or session expired: send the user to sign in again
    if (e instanceof InteractionRequiredAuthError) await msalInstance.acquireTokenRedirect({ scopes: apiScopes })
    throw e
  }
}

export async function callApi<T>(path: string, forceRefresh = false): Promise<T> {
  const token = await getToken(forceRefresh)
  // Local dev: empty (Vite proxies /api). Azure: APIM gateway URL from .env.production
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}/api${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(res.status === 403 ? '403 Forbidden - your role is not allowed' : `${res.status} ${res.statusText}`)
  return res.json()
}

export const getMe = (forceRefresh = false) => callApi<Me>('/me', forceRefresh)
