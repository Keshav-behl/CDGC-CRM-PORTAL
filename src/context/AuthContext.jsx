import React, { createContext, useContext, useState } from 'react'
import { getSession, setSession as storeSession, clearSession } from '../auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession())

  function login(userData) {
    storeSession(userData)
    setUser(userData)
  }

  function logout() {
    clearSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
