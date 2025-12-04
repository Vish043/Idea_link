import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../utils/api';

export default function HomePage() {
  const [stats, setStats] = useState({ ideas: 0, users: 0, collaborations: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch some stats if possible
    const fetchStats = async () => {
      try {
        const ideasRes = await api.get('/ideas');
        setStats({
          ideas: ideasRes.data?.length || 0,
          users: 0, // Would need a users endpoint
          collaborations: 0, // Would need a collaborations endpoint
        });
      } catch (err) {
        // Ignore errors for stats
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const features = [
    {
      icon: '💡',
      title: 'Share Ideas',
      description: 'Post your innovative ideas and connect with like-minded individuals who share your vision.',
    },
    {
      icon: '🔍',
      title: 'Discover Talent',
      description: 'Find collaborators with the skills you need to bring your ideas to life.',
    },
    {
      icon: '🤝',
      title: 'Collaborate Safely',
      description: 'Work together with built-in legal/IP awareness and secure collaboration tools.',
    },
    {
      icon: '💬',
      title: 'Real-time Chat',
      description: 'Communicate instantly with your team members through integrated chat functionality.',
    },
    {
      icon: '📋',
      title: 'Task Management',
      description: 'Organize and track your project tasks all in one place.',
    },
    {
      icon: '🔒',
      title: 'IP Protection',
      description: 'Protect your ideas with NDA agreements and IP awareness features.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-gray-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-4">
            <span className="text-6xl sm:text-7xl">🚀</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Connect, Collaborate,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Create
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
            A platform where people with similar ideas can discover each other, share ideas, form teams, and collaborate in a workspace with basic legal/IP awareness.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link
              to="/register"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl text-center"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-all transform hover:scale-105 text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {!loading && stats.ideas > 0 && (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 text-center transform hover:scale-105 transition-transform">
                <div className="text-3xl font-bold text-indigo-600 mb-2">{stats.ideas}+</div>
                <div className="text-gray-600">Active Ideas</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 text-center transform hover:scale-105 transition-transform">
                <div className="text-3xl font-bold text-indigo-600 mb-2">100+</div>
                <div className="text-gray-600">Users</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 text-center transform hover:scale-105 transition-transform">
                <div className="text-3xl font-bold text-indigo-600 mb-2">50+</div>
                <div className="text-gray-600">Collaborations</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Powerful features designed to help you find collaborators and bring your ideas to life.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg sm:text-xl mb-8 text-indigo-100">
            Join IdeaConnect today and start turning your ideas into reality.
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-all transform hover:scale-105 shadow-lg"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    </div>
  );
}

