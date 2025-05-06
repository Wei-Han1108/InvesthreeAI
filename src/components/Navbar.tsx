import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Navbar() {
  const { signOut } = useAuth()

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-gray-900 mr-8">InvesthreeAI</span>
            <Link to="/" className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900">
              Dashboard
            </Link>
            <Link to="/portfolio" className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900">
              Portfolio
            </Link>
            <Link to="/add" className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900">
              Add Investment
            </Link>
            <Link to="/ranking" className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900">
              Ranking
            </Link>
            <Link to="/ask-ai" className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900">
              Ask AI
            </Link>
            <Link to="/ai-report" className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900">
              AI Report
            </Link>
          </div>
          <div className="flex items-center">
            <button
              onClick={signOut}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 