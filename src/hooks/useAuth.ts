// Archivo: src/hooks/useAuth.ts

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  role: 'doctor' | 'assistant'
  specialty?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      checkAuth()
    }
  }, [mounted])

  const checkAuth = async () => {
    try {
      // Solo hacer la llamada si estamos en el cliente
      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else if (response.status === 401) {
        setUser(null)
        router.push('/login')
      } else {
        console.error('Auth check failed:', response.status)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      })
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Error during logout:', error)
      setUser(null)
      router.push('/login')
    }
  }

  return {
    user,
    loading: loading || !mounted,
    logout,
    isAuthenticated: !!user,
    isDoctor: user?.role === 'doctor',
    isAssistant: user?.role === 'assistant'
  }
}