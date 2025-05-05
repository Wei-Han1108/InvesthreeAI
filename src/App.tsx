import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Portfolio from './pages/Portfolio'
import AddInvestment from './pages/AddInvestment'
import Ranking from './pages/Ranking'
import Navbar from './components/Navbar'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function AppRoutes() {
  const { user } = useAuth()
  const isAuthenticated = !!user

  return (
    <div className="min-h-screen bg-gray-100">
      {isAuthenticated && <Navbar />}
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" /> : <Login />}
          />
          <Route
            path="/"
            element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/add"
            element={
              isAuthenticated ? <AddInvestment /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/portfolio"
            element={
              isAuthenticated ? <Portfolio /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/ranking"
            element={
              isAuthenticated ? <Ranking /> : <Navigate to="/login" />
            }
          />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App 