import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'

interface User {
  email: string
  username: string
}

interface AuthContextType {
  signIn: (username: string, password: string) => Promise<void>
  signUp: (username: string, email: string, password: string) => Promise<void>
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
    const checkSession = async () => {
      try {
        const cognitoUser = await authService.getCurrentUser()
        if (cognitoUser) {
          const attributes = await new Promise((resolve, reject) => {
            cognitoUser.getUserAttributes((err, result) => {
              if (err) {
                reject(err)
                return
              }
              resolve(result)
            })
          })
          
          const email = attributes?.find(attr => attr.getName() === 'email')?.getValue()
          if (email) {
            setUser({ email, username: cognitoUser.getUsername() })
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
        localStorage.removeItem('idToken')
        localStorage.removeItem('user')
      }
    }

    checkSession()
  }, [])

  const signIn = async (username: string, password: string) => {
    setLoading(true)
    try {
      const result = await authService.signIn(username, password)
      const cognitoUser = await authService.getCurrentUser()
      if (cognitoUser) {
        const attributes = await new Promise((resolve, reject) => {
          cognitoUser.getUserAttributes((err, result) => {
            if (err) {
              reject(err)
              return
            }
            resolve(result)
          })
        })
        
        const email = attributes?.find(attr => attr.getName() === 'email')?.getValue()
        if (email) {
          const user = { email, username: cognitoUser.getUsername() }
          setUser(user)
          localStorage.setItem('user', JSON.stringify(user))
          navigate('/')
        }
      }
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (username: string, email: string, password: string) => {
    setLoading(true)
    try {
      await authService.signUp(username, email, password)
      navigate('/confirm-signup', { state: { username } })
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await authService.signOut()
      setUser(null)
      localStorage.removeItem('user')
      localStorage.removeItem('idToken')
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
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