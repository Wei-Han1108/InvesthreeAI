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
import CryptoSpotlight from './pages/CryptoSpotlight'
import Forex from './pages/Forex'
import ETFHoldings from './pages/ETFHoldings'
import Commodities from './pages/Commodities'
import MarketPerformance from './pages/MarketPerformance'
import InsiderTrading from './pages/InsiderTrading'
import CompanyInfo from './pages/CompanyInfo'
import TradingCenter from './pages/TradingCenter'
import AIStockPickerPage from './pages/AIStockPickerPage'
import NextWinningTradesPage from './pages/NextWinningTradesPage'

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
          <Route
            path="/crypto-spotlight"
            element={isAuthenticated ? <CryptoSpotlight /> : <Navigate to="/login" />}
          />
          <Route
            path="/forex"
            element={isAuthenticated ? <Forex /> : <Navigate to="/login" />}
          />
          <Route
            path="/etf-holdings"
            element={isAuthenticated ? <ETFHoldings /> : <Navigate to="/login" />}
          />
          <Route
            path="/commodities"
            element={isAuthenticated ? <Commodities /> : <Navigate to="/login" />}
          />
          <Route
            path="/market-performance"
            element={isAuthenticated ? <MarketPerformance /> : <Navigate to="/login" />}
          />
          <Route
            path="/insider-trading"
            element={isAuthenticated ? <InsiderTrading /> : <Navigate to="/login" />}
          />
          <Route
            path="/company-info"
            element={isAuthenticated ? <CompanyInfo /> : <Navigate to="/login" />}
          />
          <Route
            path="/trading-center"
            element={
              isAuthenticated ? <TradingCenter /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/ai-stock-picker"
            element={
              isAuthenticated ? <AIStockPickerPage /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/next-winning-trades"
            element={
              isAuthenticated ? <NextWinningTradesPage /> : <Navigate to="/login" />
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