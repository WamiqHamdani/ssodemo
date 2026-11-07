import { useEffect, useState } from 'react'
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react'
import { apiScopes } from './authConfig'
import { callApi, getMe, type Me } from './api'

export default function App() {
  const { instance, accounts } = useMsal()
  const account = accounts[0]

  return (
    <main>
      <header>
        <h1>SSO Demo</h1>
        <AuthenticatedTemplate>
          <span>{account?.name}</span>
          <button onClick={() => instance.logoutRedirect()}>Sign out</button>
        </AuthenticatedTemplate>
      </header>

      <UnauthenticatedTemplate>
        <p>Sign in with your Microsoft account.</p>
        <button onClick={() => instance.loginRedirect({ scopes: apiScopes })}>Sign in with Microsoft</button>
      </UnauthenticatedTemplate>

      <AuthenticatedTemplate>
        <Profile />
      </AuthenticatedTemplate>
    </main>
  )
}

// Calls the API with the user's token and shows what the API sees
function Profile() {
  const [me, setMe] = useState<Me | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = (forceRefresh = false) =>
    getMe(forceRefresh).then(setMe).catch((e: Error) => setError(e.message))

  useEffect(() => {
    load()
  }, [])

  if (error) return <p className="error">API call failed: {error}</p>
  if (!me) return <p>Calling API…</p>

  return (
    <section>
      <h2>Response from /api/me</h2>
      <table>
        <tbody>
          <tr><th>Name</th><td>{me.name}</td></tr>
          <tr><th>Username</th><td>{me.username}</td></tr>
          <tr><th>Object ID</th><td>{me.objectId}</td></tr>
          <tr><th>Tenant ID</th><td>{me.tenantId}</td></tr>
          <tr><th>Roles</th><td>{me.roles.length ? me.roles.join(', ') : 'None assigned'}</td></tr>
        </tbody>
      </table>
      <button onClick={() => load(true)}>Refresh roles</button>

      <h2>Role-protected endpoints</h2>
      <RoleCheck label="User area" path="/user-area" />
      <RoleCheck label="Admin area" path="/admin-area" />
    </section>
  )
}

// Calls an endpoint that requires a role and shows the result (200 or 403)
function RoleCheck({ label, path }: { label: string; path: string }) {
  const [result, setResult] = useState<string | null>(null)

  return (
    <p>
      <button onClick={() => callApi<{ message: string }>(path).then((r) => setResult(r.message)).catch((e: Error) => setResult(e.message))}>
        Call {label}
      </button>{' '}
      {result && <span>{result}</span>}
    </p>
  )
}
