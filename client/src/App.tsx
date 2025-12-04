import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import IdeasPage from './pages/IdeasPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import TermsPage from './pages/TermsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatListPage from './pages/ChatListPage';
import HomePage from './pages/HomePage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
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
