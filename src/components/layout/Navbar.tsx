import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  Trophy,
  User,
  Home,
  BookOpen,
  Users,
  Shield,
  Swords,
  MessageCircle,
  X,
  CheckCircle,
  Mail,
  UserPlus,
} from "lucide-react";

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, data?: any) => void;
}

export function Navbar({ currentView, onNavigate }: NavbarProps) {
  const { profile } = useAuth();
  const {
    unreadMessages,
    pendingFriendRequests,
    pendingDuelsToPlay,
    newDuelResults,
    duelNotification,
    messageNotification,
    friendRequestNotification,
    clearDuelNotification,
    clearMessageNotification,
    clearFriendRequestNotification,
  } = useNotifications();
  const { t } = useLanguage();
  const [socialMenuOpen, setSocialMenuOpen] = useState(false);

  const totalSocialNotifications =
    unreadMessages +
    pendingFriendRequests +
    (pendingDuelsToPlay || 0) +
    (newDuelResults || 0);

  // Auto-fermeture des toasts
  useEffect(() => {
    if (duelNotification) {
      const timer = setTimeout(clearDuelNotification, 6000);
      return () => clearTimeout(timer);
    }
  }, [duelNotification, clearDuelNotification]);

  useEffect(() => {
    if (messageNotification) {
      const timer = setTimeout(clearMessageNotification, 6000);
      return () => clearTimeout(timer);
    }
  }, [messageNotification, clearMessageNotification]);

  useEffect(() => {
    if (friendRequestNotification) {
      const timer = setTimeout(clearFriendRequestNotification, 6000);
      return () => clearTimeout(timer);
    }
  }, [friendRequestNotification, clearFriendRequestNotification]);

  return (
    <>
      {/* Toast Message */}
      {messageNotification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div className="bg-white shadow-2xl rounded-xl border-2 border-blue-500 p-4 max-w-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">
                  {t("notifications.newMessage")}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">
                    {messageNotification.from}
                  </span>{" "}
                  : {messageNotification.message.substring(0, 50)}
                  {messageNotification.message.length > 50 && "..."}
                </p>
                <button
                  onClick={() => {
                    onNavigate("chat");
                    clearMessageNotification();
                  }}
                  className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  {t("notifications.viewMessage")}
                </button>
              </div>
              <button
                onClick={clearMessageNotification}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Friend Request */}
      {friendRequestNotification && (
        <div className="fixed top-36 right-4 z-50 animate-slide-in-right">
          <div className="bg-white shadow-2xl rounded-xl border-2 border-purple-500 p-4 max-w-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <UserPlus className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">
                  {t("notifications.newFriendRequest")}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">
                    {friendRequestNotification.from}
                  </span>{" "}
                  {t("notifications.wantsFriend")}
                </p>
                <button
                  onClick={() => {
                    onNavigate("friends");
                    clearFriendRequestNotification();
                  }}
                  className="mt-3 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  {t("notifications.viewRequests")}
                </button>
              </div>
              <button
                onClick={clearFriendRequestNotification}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Duel */}
      {duelNotification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div className="bg-white shadow-2xl rounded-xl border-2 border-emerald-500 p-4 max-w-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {duelNotification.type === "invitation" && (
                  <Swords className="w-6 h-6 text-emerald-600" />
                )}
                {duelNotification.type === "accepted" && (
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                )}
                {duelNotification.type === "completed" && (
                  <Trophy className="w-6 h-6 text-yellow-600" />
                )}
              </div>
              <div className="flex-1">
                {duelNotification.type === "invitation" && (
                  <>
                    <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                    <div
                      className="cursor-pointer flex-1"
                      onClick={() => {
                        if (duelNotification.onNavigate) {
                          duelNotification.onNavigate();
                        }
                        clearDuelNotification();
                      }}
                    >
                      <strong>{duelNotification.from}</strong>{" "}
                      {t("notifications.challengedYou")}{" "}
                      <strong>{duelNotification.quizTitle}</strong>
                    </div>
                  </>
                )}
                {duelNotification.type === "accepted" && (
                  <>
                    <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    <div
                      className="cursor-pointer flex-1"
                      onClick={() => {
                        onNavigate("duels", { tab: "active" });
                        clearDuelNotification();
                      }}
                    >
                      <strong>{duelNotification.from}</strong>{" "}
                      {t("notifications.acceptedDuel")}{" "}
                      <strong>{duelNotification.quizTitle}</strong>
                    </div>
                  </>
                )}
                {duelNotification.type === "completed" && (
                  <>
                    <Trophy className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                    <div
                      className="cursor-pointer flex-1"
                      onClick={() => {
                        if (duelNotification.onNavigate) {
                          duelNotification.onNavigate();
                        }
                        clearDuelNotification();
                      }}
                    >
                      {t("notifications.duelFinished")}{" "}
                      <strong>{duelNotification.from}</strong>{" "}
                      {t("notifications.on")}{" "}
                      <strong>{duelNotification.quizTitle}</strong>
                    </div>
                  </>
                )}
                <button
                  onClick={() => {
                    onNavigate("duels");
                    clearDuelNotification();
                  }}
                  className="mt-3 w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                  {t("notifications.viewDuels")}
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
              <button
                onClick={() => onNavigate("home")}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
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
              </button>

              {/* Desktop menu */}
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
                  {(pendingDuelsToPlay || 0) + (newDuelResults || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {(pendingDuelsToPlay || 0) + (newDuelResults || 0)}
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

            {/* ✅ Bouton profil uniquement (déconnexion supprimée) */}
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
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Nav Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40 safe-area-inset-bottom">
        <div className="grid grid-cols-5 h-16">
          <button
            onClick={() => onNavigate("home")}
            className={`flex flex-col items-center justify-center transition-colors ${
              currentView === "home" ? "text-emerald-600" : "text-gray-600"
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">{t("nav.home")}</span>
          </button>

          <button
            onClick={() => onNavigate("quizzes")}
            className={`flex flex-col items-center justify-center transition-colors ${
              currentView === "quizzes" ? "text-emerald-600" : "text-gray-600"
            }`}
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-xs mt-1">{t("nav.quizzes")}</span>
          </button>

          <button
            onClick={() => setSocialMenuOpen(!socialMenuOpen)}
            className={`flex flex-col items-center justify-center transition-colors relative ${
              ["friends", "duels", "chat"].includes(currentView)
                ? "text-emerald-600"
                : "text-gray-600"
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs mt-1">{t("nav.social")}</span>
            {totalSocialNotifications > 0 && (
              <span className="absolute top-1 right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {totalSocialNotifications}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate("leaderboard")}
            className={`flex flex-col items-center justify-center transition-colors ${
              currentView === "leaderboard"
                ? "text-emerald-600"
                : "text-gray-600"
            }`}
          >
            <Trophy className="w-6 h-6" />
            <span className="text-xs mt-1">{t("nav.leaderboard")}</span>
          </button>

          <button
            onClick={() => onNavigate("profile")}
            className={`flex flex-col items-center justify-center transition-colors ${
              currentView === "profile" ? "text-emerald-600" : "text-gray-600"
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-xs mt-1">{t("nav.profile")}</span>
          </button>
        </div>
      </div>

      {/* Sous-menu Social Mobile */}
      {socialMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setSocialMenuOpen(false)}
        >
          <div
            className="fixed bottom-16 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {t("nav.social")}
              </h3>
              <button
                onClick={() => setSocialMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  onNavigate("friends");
                  setSocialMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                  currentView === "friends"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-3" />
                  <span className="font-medium">{t("nav.friends")}</span>
                </div>
                {pendingFriendRequests > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                    {pendingFriendRequests}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  onNavigate("duels");
                  setSocialMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                  currentView === "duels"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  <Swords className="w-5 h-5 mr-3" />
                  <span className="font-medium">{t("nav.duels")}</span>
                </div>
                {(pendingDuelsToPlay || 0) + (newDuelResults || 0) > 0 && (
                  <div className="flex items-center gap-1">
                    {(pendingDuelsToPlay || 0) > 0 && (
                      <span
                        className="bg-amber-500 text-white text-xs rounded-full px-2 py-1 font-bold"
                        title={t("notifications.toPlay")}
                      >
                        {pendingDuelsToPlay}
                      </span>
                    )}
                    {(newDuelResults || 0) > 0 && (
                      <span
                        className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold"
                        title={t("notifications.newResults")}
                      >
                        {newDuelResults}
                      </span>
                    )}
                  </div>
                )}
              </button>

              <button
                onClick={() => {
                  onNavigate("chat");
                  setSocialMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                  currentView === "chat"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-3" />
                  <span className="font-medium">{t("nav.chat")}</span>
                </div>
                {unreadMessages > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                    {unreadMessages}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          body {
            padding-bottom: 4rem;
          }
          .animate-slide-up {
            animation: slideUp 0.3s ease-out;
          }
          @keyframes slideUp {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
        }
      `}</style>
    </>
  );
}
