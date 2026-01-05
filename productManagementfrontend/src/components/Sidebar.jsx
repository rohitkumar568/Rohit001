import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const Sidebar = ({ activeSection, setActiveSection, setSidebarOpen }) => {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout()
      navigate('/login')
    }
  }

  const handleNavClick = (section) => {
    setActiveSection(section)
    // Close sidebar on mobile after navigation
    if (setSidebarOpen) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="w-64 bg-gray-800 text-white shadow-lg flex flex-col h-screen">
      <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <h2 className="text-xl font-bold">Dashboard</h2>
          {/* Close button for mobile */}
          {setSidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-700"
              aria-label="Close menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        <nav className="space-y-2">
          <button
            onClick={() => handleNavClick('products')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'products'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            Product Management
          </button>
          <button
            onClick={() => handleNavClick('categories')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeSection === 'categories'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            Category Management
          </button>
        </nav>
      </div>
      
      {/* User info and logout */}
      <div className="p-4 sm:p-6 border-t border-gray-700 flex-shrink-0">
        <div className="mb-4">
          <p className="text-xs sm:text-sm text-gray-400">Logged in as</p>
          <p className="text-sm sm:text-base font-medium text-white truncate">
            {user?.name || user?.username}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default Sidebar


