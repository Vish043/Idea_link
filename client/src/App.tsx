import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import IdeasPage from './pages/IdeasPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import TermsPage from './pages/TermsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatListPage from './pages/ChatListPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route
            path="/"
            element={
              <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    IdeaConnect
                  </h1>
                  <p className="text-xl text-gray-600 mb-8">
                    Connect, Collaborate, Create
                  </p>
                  <p className="text-gray-500 mb-8">
                    A platform where people with similar ideas can discover each other, 
                    share ideas, form teams, and collaborate in a workspace with basic legal/IP awareness.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Link
                      to="/login"
                      className="px-6 py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 transition-colors"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              </div>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/ideas" element={<IdeasPage />} />
          <Route path="/chats" element={<ChatListPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
