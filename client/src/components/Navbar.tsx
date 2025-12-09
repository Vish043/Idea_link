import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [platformStats, setPlatformStats] = useState({ ideas: 0, users: 0, collaborations: 0 });

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, [location.pathname]); // Re-check when route changes

  useEffect(() => {
    // Fetch platform stats
    const fetchStats = async () => {
      try {
        const statsRes = await api.get('/stats');
        setPlatformStats({
          ideas: statsRes.data?.ideas || 0,
          users: statsRes.data?.users || 0,
          collaborations: statsRes.data?.collaborations || 0,
        });
      } catch (err) {
        // Ignore errors for stats
      }
    };
    fetchStats();
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Stats */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-bold text-indigo-600">IdeaConnect</span>
            </Link>
            {/* Compact Platform Stats */}
            <div className="hidden lg:flex items-center space-x-3 text-xs">
              <div 
                className="flex items-center space-x-1 text-gray-600 cursor-default" 
                title="Total Ideas"
              >
                <span className="text-sm">💡</span>
                <span className="font-semibold text-gray-700">{platformStats.ideas}</span>
              </div>
              <div 
                className="flex items-center space-x-1 text-gray-600 cursor-default" 
                title="Total Users"
              >
                <span className="text-sm">👥</span>
                <span className="font-semibold text-gray-700">{platformStats.users}</span>
              </div>
              <div 
                className="flex items-center space-x-1 text-gray-600 cursor-default" 
                title="Total Collaborations"
              >
                <span className="text-sm">🤝</span>
                <span className="font-semibold text-gray-700">{platformStats.collaborations}</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/ideas"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/ideas')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Ideas
                </Link>
                <Link
                  to="/chats"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/chats')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Chats
                </Link>
                <Link
                  to="/profile"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/profile')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Profile
                </Link>
                <Link
                  to="/terms"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/terms')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Terms
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/ideas"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/ideas')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Ideas
                </Link>
                <Link
                  to="/terms"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/terms')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Terms
                </Link>
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/login')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/register')
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/dashboard')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/ideas"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/ideas')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Ideas
                  </Link>
                  <Link
                    to="/chats"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/chats')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Chats
                  </Link>
                  <Link
                    to="/profile"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/profile')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/terms"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/terms')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Terms
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/ideas"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/ideas')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Ideas
                  </Link>
                  <Link
                    to="/terms"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/terms')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Terms
                  </Link>
                  <Link
                    to="/login"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/login')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/register')
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

