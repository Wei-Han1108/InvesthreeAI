import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Portfolio from './pages/Portfolio'
import AddInvestment from './pages/AddInvestment'
import Ranking from './pages/Ranking'
import AskAIPage from './pages/AskAI'
import AIReportPage from './pages/AIReportPage'
import ConfirmSignup from './pages/ConfirmSignup'
import Survey from './pages/Survey'
import Navbar from './components/Navbar'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import MyAccount from './pages/MyAccount'
import BreakingNews from './pages/BreakingNews'
import Home from './pages/Home'

function AppRoutes() {
  const { user } = useAuth()
  const isAuthenticated = !!user
  const location = useLocation()
  const isSurveyPage = location.pathname === '/survey'

  return (
    <div className="min-h-screen bg-gray-100">
      {isAuthenticated && !isSurveyPage && <Navbar />}
      <main className={isSurveyPage ? '' : 'container mx-auto px-4 py-8'}>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/home" /> : <Login />}
          />
          <Route
            path="/confirm-signup"
            element={<ConfirmSignup />}
          />
          <Route
            path="/survey"
            element={<Survey />}
          />
          <Route
            path="/home"
            element={
              isAuthenticated ? <Home /> : <Navigate to="/login" />
            }
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
          <Route
            path="/ask-ai"
            element={
              isAuthenticated ? <AskAIPage /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/ai-report"
            element={
              isAuthenticated ? <AIReportPage /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/account"
            element={
              isAuthenticated ? <MyAccount /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/news"
            element={<BreakingNews />}
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