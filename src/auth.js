export async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function getSession() {
  try {
    const s = sessionStorage.getItem('crm_session')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

export function setSession(user) {
  sessionStorage.setItem('crm_session', JSON.stringify(user))
}

export function clearSession() {
  sessionStorage.removeItem('crm_session')
}
