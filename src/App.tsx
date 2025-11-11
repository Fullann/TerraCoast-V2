import { useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { LoginForm } from "./components/auth/LoginForm";
import { RegisterForm } from "./components/auth/RegisterForm";
import { Navbar } from "./components/layout/Navbar";
import { HomePage } from "./components/home/HomePage";
import { ProfilePage } from "./components/profile/ProfilePage";
import { SettingsPage } from "./components/profile/SettingsPage";
import { QuizzesPage } from "./components/quizzes/QuizzesPage";
import { CreateQuizPage } from "./components/quizzes/CreateQuizPage";
import { EditQuizPage } from "./components/quizzes/EditQuizPage";
import { PlayQuizPage } from "./components/quizzes/PlayQuizPage";
import { TrainingModePage } from "./components/quizzes/TrainingModePage";
import { LeaderboardPage } from "./components/leaderboard/LeaderboardPage";
import { FriendsPage } from "./components/friends/FriendsPage";
import { AdminPage } from "./components/admin/AdminPage";
import { BadgeManagementPage } from "./components/admin/BadgeManagementPage";
import { TitleManagementPage } from "./components/admin/TitleManagementPage";
import { CategoryManagementPage } from "./components/admin/CategoryManagementPage";
import { DifficultyManagementPage } from "./components/admin/DifficultyManagementPage";
import { QuizValidationPage } from "./components/admin/QuizValidationPage";
import { WarningsManagementPage } from "./components/admin/WarningsManagementPage";
import { QuizTypeManagementPage } from "./components/admin/QuizTypeManagementPage";
import { UserManagementPage } from "./components/admin/UserManagementPage";
import { QuizManagementPage } from "./components/admin/QuizManagementPage";
import { DuelsPage } from "./components/duels/DuelsPage";
import { ChatPage } from "./components/chat/ChatPage";
import { LandingPage } from "./components/landing/LandingPage";
import { BannedPage } from "./components/auth/BannedPage";
import { ForceUsernamePage } from "./components/auth/ForceUsernamePage";

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [authView, setAuthView] = useState<"login" | "register" | "landing">(
    "landing"
  );
  const [currentView, setCurrentView] = useState<string>("home");
  const [viewData, setViewData] = useState<any>(null);

  const handleNavigate = (view: string, data?: any) => {
    setCurrentView(view);
    setViewData(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (user && profile) {
    const now = new Date();
    const isBanned = profile.is_banned;
    const banUntil = profile.ban_until ? new Date(profile.ban_until) : null;
    const isStillBanned = isBanned && (!banUntil || banUntil > now);

    if (isStillBanned) {
      return <BannedPage />;
    }

    if (profile.force_username_change) {
      return <ForceUsernamePage />;
    }
  }

  if (!user) {
    if (authView === "landing") {
      return (
        <LandingPage
          onNavigate={(view) => setAuthView(view as "login" | "register")}
        />
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 flex items-center justify-center p-4">
        <div className="w-full">
          <div className="max-w-md mx-auto mb-4">
            <button
              onClick={() => setAuthView("landing")}
              className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center"
            >
              ← Retour à l'accueil
            </button>
          </div>
          {authView === "login" ? (
            <LoginForm onSwitchToRegister={() => setAuthView("register")} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setAuthView("login")} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar currentView={currentView} onNavigate={handleNavigate} />

      <main className="pb-8">
        {currentView === "home" && <HomePage onNavigate={handleNavigate} />}
        {currentView === "profile" && (
          <ProfilePage onNavigate={handleNavigate} />
        )}
        {currentView === "view-profile" && viewData?.userId && (
          <ProfilePage userId={viewData.userId} onNavigate={handleNavigate} />
        )}
        {currentView === "settings" && (
          <SettingsPage onNavigate={handleNavigate} />
        )}
        {currentView === "quizzes" && (
          <QuizzesPage onNavigate={handleNavigate} />
        )}
        {currentView === "create-quiz" && (
          <CreateQuizPage onNavigate={handleNavigate} />
        )}
        {currentView === "edit-quiz" && viewData?.quizId && (
          <EditQuizPage quizId={viewData.quizId} onNavigate={handleNavigate} />
        )}
        {currentView === "training-mode" && (
          <TrainingModePage onNavigate={handleNavigate} />
        )}
        {currentView === "play-quiz" && viewData?.quizId && (
          <PlayQuizPage
            key={
              viewData.resetKey
                ? `play-${viewData.quizId}-${viewData.resetKey}`
                : `play-${viewData.quizId}`
            }
            quizId={viewData.quizId}
            onNavigate={handleNavigate}
          />
        )}
        {currentView === "play-training" && viewData?.quizId && (
          <PlayQuizPage
            key={
              viewData.resetKey
                ? `training-${viewData.quizId}-${viewData.resetKey}`
                : `training-${viewData.quizId}`
            }
            quizId={viewData.quizId}
            trainingMode={true}
            questionCount={viewData.questionCount}
            onNavigate={handleNavigate}
          />
        )}
        {currentView === "play-duel" && viewData?.duelId && (
          <PlayQuizPage
            key={
              viewData.resetKey
                ? `duel-${viewData.duelId}-${viewData.resetKey}`
                : `duel-${viewData.duelId}`
            }
            quizId={viewData.quizId}
            mode="duel"
            duelId={viewData.duelId}
            onNavigate={handleNavigate}
          />
        )}
        {currentView === "leaderboard" && (
          <LeaderboardPage onNavigate={handleNavigate} />
        )}
        {currentView === "friends" && (
          <FriendsPage onNavigate={handleNavigate} />
        )}
        {currentView === "duels" && <DuelsPage onNavigate={handleNavigate} />}
        {currentView === "chat" && (
          <ChatPage friendId={viewData?.friendId} onNavigate={handleNavigate} />
        )}
        {currentView === "admin" && <AdminPage onNavigate={handleNavigate} />}
        {currentView === "badge-management" && <BadgeManagementPage />}
        {currentView === "title-management" && <TitleManagementPage />}
        {currentView === "category-management" && <CategoryManagementPage />}
        {currentView === "difficulty-management" && (
          <DifficultyManagementPage />
        )}
        {currentView === "quiz-validation" && <QuizValidationPage />}
        {currentView === "warnings-management" && <WarningsManagementPage />}
        {currentView === "quiz-type-management" && <QuizTypeManagementPage />}
        {currentView === "user-management" && <UserManagementPage />}
        {currentView === "quiz-management" && (
          <QuizManagementPage onNavigate={handleNavigate} />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
