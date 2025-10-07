import { useAuth } from '../../contexts/AuthContext';
import { Trophy, User, LogOut, Home, BookOpen, Users, Shield, Swords, MessageCircle } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Navbar({ currentView, onNavigate }: NavbarProps) {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Trophy className="w-8 h-8 text-emerald-600" />
              <span className="text-xl font-bold text-gray-800">Terracoast</span>
            </div>

            <div className="hidden md:flex space-x-1">
              <button
                onClick={() => onNavigate('home')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'home'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Home className="w-5 h-5 inline mr-2" />
                Accueil
              </button>

              <button
                onClick={() => onNavigate('quizzes')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'quizzes'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BookOpen className="w-5 h-5 inline mr-2" />
                Quiz
              </button>

              <button
                onClick={() => onNavigate('leaderboard')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'leaderboard'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Trophy className="w-5 h-5 inline mr-2" />
                Classement
              </button>

              <button
                onClick={() => onNavigate('friends')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'friends'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="w-5 h-5 inline mr-2" />
                Amis
              </button>

              <button
                onClick={() => onNavigate('duels')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'duels'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Swords className="w-5 h-5 inline mr-2" />
                Duels
              </button>

              <button
                onClick={() => onNavigate('chat')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'chat'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageCircle className="w-5 h-5 inline mr-2" />
                Chat
              </button>

              {profile?.role === 'admin' && (
                <button
                  onClick={() => onNavigate('admin')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'admin'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Shield className="w-5 h-5 inline mr-2" />
                  Admin
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{profile?.pseudo}</p>
              <p className="text-xs text-gray-500">Niveau {profile?.level}</p>
            </div>

            <button
              onClick={() => onNavigate('profile')}
              className={`p-2 rounded-lg transition-colors ${
                currentView === 'profile'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <User className="w-6 h-6" />
            </button>

            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
