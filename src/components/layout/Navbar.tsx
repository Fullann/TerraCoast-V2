import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Trophy, User, LogOut, Home, BookOpen, Users, Shield, Swords, MessageCircle, Menu, X, Settings } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Navbar({ currentView, onNavigate }: NavbarProps) {
  const { profile, signOut } = useAuth();
  const { unreadMessages, pendingDuels } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                  currentView === 'duels'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Swords className="w-5 h-5 inline mr-2" />
                Duels
                {pendingDuels > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {pendingDuels}
                  </span>
                )}
              </button>

              <button
                onClick={() => onNavigate('chat')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                  currentView === 'chat'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageCircle className="w-5 h-5 inline mr-2" />
                Chat
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {unreadMessages}
                  </span>
                )}
              </button>

              <button
                onClick={() => onNavigate('settings')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'settings'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-5 h-5 inline mr-2" />
                Paramètres
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
            <button
              onClick={() => onNavigate('profile')}
              className="hidden md:block text-right hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
              <p className="text-sm font-medium text-gray-800">{profile?.pseudo}</p>
              <p className="text-xs text-gray-500">Niveau {profile?.level}</p>
            </button>

            <button
              onClick={() => onNavigate('profile')}
              className={`hidden md:block p-2 rounded-lg transition-colors ${
                currentView === 'profile'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <User className="w-6 h-6" />
            </button>

            <button
              onClick={handleSignOut}
              className="hidden md:block p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-6 h-6" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-2 space-y-1">
            <div className="py-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-800">{profile?.pseudo}</p>
              <p className="text-xs text-gray-500">Niveau {profile?.level}</p>
            </div>

            <button
              onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                currentView === 'home'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className="w-5 h-5 inline mr-2" />
              Accueil
            </button>

            <button
              onClick={() => { onNavigate('quizzes'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                currentView === 'quizzes'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="w-5 h-5 inline mr-2" />
              Quiz
            </button>

            <button
              onClick={() => { onNavigate('leaderboard'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                currentView === 'leaderboard'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Trophy className="w-5 h-5 inline mr-2" />
              Classement
            </button>

            <button
              onClick={() => { onNavigate('friends'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                currentView === 'friends'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              Amis
            </button>

            <button
              onClick={() => { onNavigate('duels'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                currentView === 'duels'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Swords className="w-5 h-5 inline mr-2" />
              Duels
            </button>

            <button
              onClick={() => { onNavigate('chat'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
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
                onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentView === 'admin'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Shield className="w-5 h-5 inline mr-2" />
                Admin
              </button>
            )}

            <button
              onClick={() => { onNavigate('profile'); setMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                currentView === 'profile'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <User className="w-5 h-5 inline mr-2" />
              Profil
            </button>

            <button
              onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
              className="w-full text-left px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 inline mr-2" />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
