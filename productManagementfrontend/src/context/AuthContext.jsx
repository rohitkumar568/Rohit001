import { createContext, useState, useEffect } from 'react'
import axios from 'axios'

// Backend API URL
const API_URL = 'http://localhost:8000/api'

// Helper function to get headers with token
function getHeaders() {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in when app starts
  useEffect(() => {
    checkAuth()
  }, [])

  // Check authentication status
  async function checkAuth() {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        // Try to get current user from API
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: getHeaders(),
        })
        
        if (response.data.success) {
          setUser(response.data.data)
          setIsAuthenticated(true)
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('token')
          setUser(null)
          setIsAuthenticated(false)
        }
      }
    } catch (error) {
      // Token is invalid or expired
      localStorage.removeItem('token')
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Login function - call API directly
  async function login(username, password) {
    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        { username, password },
        { headers: { 'Content-Type': 'application/json' } }
      )
      
      if (response.data.success) {
        // Save token and user data
        localStorage.setItem('token', response.data.data.token)
        setUser(response.data.data.user)
        setIsAuthenticated(true)
        return { success: true, message: 'Login successful!' }
      } else {
        return { success: false, message: response.data.message || 'Login failed' }
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed'
      return { success: false, message: message }
    }
  }

  // Logout function
  async function logout() {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { headers: getHeaders() })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear everything
      localStorage.removeItem('token')
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

