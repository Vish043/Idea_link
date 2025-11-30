import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import IdeasPage from './pages/IdeasPage';

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
                <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
                  IdeaConnect
                </h1>
                <p className="text-center text-gray-600">
                  Connect, Collaborate, Create
                </p>
              </div>
            }
          />
          <Route path="/dashboard" element={<div className="container mx-auto px-4 py-8"><h1 className="text-3xl font-bold">Dashboard</h1></div>} />
          <Route path="/ideas" element={<IdeasPage />} />
          <Route path="/profile" element={<div className="container mx-auto px-4 py-8"><h1 className="text-3xl font-bold">Profile</h1></div>} />
          <Route path="/terms" element={<div className="container mx-auto px-4 py-8"><h1 className="text-3xl font-bold">Terms & Conditions</h1></div>} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
