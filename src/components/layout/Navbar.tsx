import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  Trophy,
  User,
  LogOut,
  Home,
  BookOpen,
  Users,
  Shield,
  Swords,
  MessageCircle,
  Menu,
  X,
} from "lucide-react";

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Navbar({ currentView, onNavigate }: NavbarProps) {
  const { profile, signOut } = useAuth();
  const {
    unreadMessages,
    pendingDuels,
    pendingFriendRequests,
    duelNotification,
    clearDuelNotification,
  } = useNotifications();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ Auto-fermeture du toast après 5 secondes
  useEffect(() => {
    if (duelNotification) {
      const timer = setTimeout(() => {
        clearDuelNotification();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [duelNotification, clearDuelNotification]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      {/* ✅ Toast de notification de duel */}
      {duelNotification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div className="bg-white shadow-2xl rounded-xl border-2 border-emerald-500 p-4 max-w-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Swords className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">
                  Nouveau duel !
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">{duelNotification.from}</span>{" "}
                  t'a défié sur{" "}
                  <span className="font-medium">
                    {duelNotification.quizTitle}
                  </span>
                </p>
                <button
                  onClick={() => {
                    onNavigate("duels");
                    clearDuelNotification();
                  }}
                  className="mt-3 w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                  Voir les duels
                </button>
              </div>
              <button
                onClick={clearDuelNotification}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <img
                  src="/logo.png"
                  alt="TerraCoast Logo"
                  className="h-12 w-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="ml-3 text-2xl font-bold text-emerald-600">
                  TerraCoast
                </span>
              </div>

              <div className="hidden md:flex space-x-1">
                <button
                  onClick={() => onNavigate("home")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === "home"
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Home className="w-5 h-5 inline mr-2" />
                  {t("nav.home")}
                </button>

                <button
                  onClick={() => onNavigate("quizzes")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === "quizzes"
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <BookOpen className="w-5 h-5 inline mr-2" />
                  {t("nav.quizzes")}
                </button>

                <button
                  onClick={() => onNavigate("leaderboard")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === "leaderboard"
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Trophy className="w-5 h-5 inline mr-2" />
                  {t("nav.leaderboard")}
                </button>

                <button
                  onClick={() => onNavigate("friends")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                    currentView === "friends"
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Users className="w-5 h-5 inline mr-2" />
                  {t("nav.friends")}
                  {pendingFriendRequests > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {pendingFriendRequests}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onNavigate("duels")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                    currentView === "duels"
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Swords className="w-5 h-5 inline mr-2" />
                  {t("nav.duels")}
                  {pendingDuels > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {pendingDuels}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onNavigate("chat")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                    currentView === "chat"
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <MessageCircle className="w-5 h-5 inline mr-2" />
                  {t("nav.chat")}
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {unreadMessages}
                    </span>
                  )}
                </button>

                {profile?.role === "admin" && (
                  <button
                    onClick={() => onNavigate("admin")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentView === "admin"
                        ? "bg-emerald-100 text-emerald-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Shield className="w-5 h-5 inline mr-2" />
                    {t("nav.admin")}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate("profile")}
                className="hidden md:block text-right hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <p className="text-sm font-medium text-gray-800">
                  {profile?.pseudo}
                </p>
                <p className="text-xs text-gray-500">
                  {t("profile.level")} {profile?.level}
                </p>
              </button>

              <button
                onClick={() => onNavigate("profile")}
                className={`hidden md:block p-2 rounded-lg transition-colors ${
                  currentView === "profile"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <User className="w-6 h-6" />
              </button>

              <button
                onClick={handleSignOut}
                className="hidden md:block p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                title={t("nav.logout")}
              >
                <LogOut className="w-6 h-6" />
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              <div className="py-3 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-800">
                  {profile?.pseudo}
                </p>
                <p className="text-xs text-gray-500">
                  {t("profile.level")} {profile?.level}
                </p>
              </div>

              <button
                onClick={() => {
                  onNavigate("home");
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentView === "home"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Home className="w-5 h-5 inline mr-2" />
                {t("nav.home")}
              </button>

              <button
                onClick={() => {
                  onNavigate("quizzes");
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentView === "quizzes"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <BookOpen className="w-5 h-5 inline mr-2" />
                {t("nav.quizzes")}
              </button>

              <button
                onClick={() => {
                  onNavigate("leaderboard");
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentView === "leaderboard"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Trophy className="w-5 h-5 inline mr-2" />
                {t("nav.leaderboard")}
              </button>

              <button
                onClick={() => {
                  onNavigate("friends");
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors relative ${
                  currentView === "friends"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Users className="w-5 h-5 inline mr-2" />
                {t("nav.friends")}
                {pendingFriendRequests > 0 && (
                  <span className="absolute top-2 left-8 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {pendingFriendRequests}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  onNavigate("duels");
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors relative ${
                  currentView === "duels"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Swords className="w-5 h-5 inline mr-2" />
                {t("nav.duels")}
                {pendingDuels > 0 && (
                  <span className="absolute top-2 left-8 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {pendingDuels}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  onNavigate("chat");
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors relative ${
                  currentView === "chat"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <MessageCircle className="w-5 h-5 inline mr-2" />
                {t("nav.chat")}
                {unreadMessages > 0 && (
                  <span className="absolute top-2 left-8 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadMessages}
                  </span>
                )}
              </button>

              {profile?.role === "admin" && (
                <button
                  onClick={() => {
                    onNavigate("admin");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    currentView === "admin"
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Shield className="w-5 h-5 inline mr-2" />
                  {t("nav.admin")}
                </button>
              )}

              <button
                onClick={() => {
                  onNavigate("profile");
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                  currentView === "profile"
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <User className="w-5 h-5 inline mr-2" />
                {t("nav.profile")}
              </button>

              <button
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5 inline mr-2" />
                {t("nav.logout")}
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
