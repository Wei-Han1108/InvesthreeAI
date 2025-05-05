import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface User {
  email: string
}

interface AuthContextType {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => void
  loading: boolean
  user: User | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check for existing user session on mount
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      // TODO: Implement actual authentication logic here
      // For now, we'll simulate a successful login
      const user = { email }
      setUser(user)
      localStorage.setItem('user', JSON.stringify(user))
      navigate('/')
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    try {
      // TODO: Implement actual sign up logic here
      // For now, we'll simulate a successful registration
      const user = { email }
      setUser(user)
      localStorage.setItem('user', JSON.stringify(user))
      navigate('/')
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ signIn, signUp, signOut, loading, user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 