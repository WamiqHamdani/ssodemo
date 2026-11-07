import { PublicClientApplication, type Configuration } from '@azure/msal-browser'

const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: { cacheLocation: 'sessionStorage' },
}

// Scope exposed by the API app registration ("Expose an API")
export const apiScopes = [import.meta.env.VITE_API_SCOPE]

export const msalInstance = new PublicClientApplication(msalConfig)
