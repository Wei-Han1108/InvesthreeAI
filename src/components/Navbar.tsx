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
            <Link to="/home" className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900">
              Home
            </Link>
            <Link to="/ask-ai" className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900">
              AI Chatbot
            </Link>
            <Link to="/news" className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900">
              Breaking News
            </Link>
          </div>
          <div className="flex items-center">
            <Link to="/account" className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900">
              My Account
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 