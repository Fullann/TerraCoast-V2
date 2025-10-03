import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { Navbar } from './components/layout/Navbar';
import { HomePage } from './components/home/HomePage';
import { ProfilePage } from './components/profile/ProfilePage';
import { QuizzesPage } from './components/quizzes/QuizzesPage';
import { CreateQuizPage } from './components/quizzes/CreateQuizPage';
import { EditQuizPage } from './components/quizzes/EditQuizPage';
import { PlayQuizPage } from './components/quizzes/PlayQuizPage';
import { TrainingModePage } from './components/quizzes/TrainingModePage';
import { LeaderboardPage } from './components/leaderboard/LeaderboardPage';
import { FriendsPage } from './components/friends/FriendsPage';
import { AdminPage } from './components/admin/AdminPage';
import { BadgeManagementPage } from './components/admin/BadgeManagementPage';
import { TitleManagementPage } from './components/admin/TitleManagementPage';
import { CategoryManagementPage } from './components/admin/CategoryManagementPage';
import { DifficultyManagementPage } from './components/admin/DifficultyManagementPage';
import { DuelsPage } from './components/duels/DuelsPage';
import { ChatPage } from './components/chat/ChatPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentView, setCurrentView] = useState<string>('home');
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 flex items-center justify-center p-4">
        <div className="w-full">
          {authView === 'login' ? (
            <LoginForm onSwitchToRegister={() => setAuthView('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setAuthView('login')} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar currentView={currentView} onNavigate={handleNavigate} />

      <main className="pb-8">
        {currentView === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentView === 'profile' && <ProfilePage />}
        {currentView === 'quizzes' && <QuizzesPage onNavigate={handleNavigate} />}
        {currentView === 'create-quiz' && <CreateQuizPage onNavigate={handleNavigate} />}
        {currentView === 'edit-quiz' && viewData?.quizId && (
          <EditQuizPage quizId={viewData.quizId} onNavigate={handleNavigate} />
        )}
        {currentView === 'training-mode' && <TrainingModePage onNavigate={handleNavigate} />}
        {currentView === 'play-quiz' && viewData?.quizId && (
          <PlayQuizPage quizId={viewData.quizId} onNavigate={handleNavigate} />
        )}
        {currentView === 'play-training' && viewData?.quizId && (
          <PlayQuizPage
            quizId={viewData.quizId}
            trainingMode={true}
            questionCount={viewData.questionCount}
            onNavigate={handleNavigate}
          />
        )}
        {currentView === 'play-duel' && viewData?.duelId && (
          <PlayQuizPage quizId={viewData.quizId} mode="duel" duelId={viewData.duelId} onNavigate={handleNavigate} />
        )}
        {currentView === 'leaderboard' && <LeaderboardPage />}
        {currentView === 'friends' && <FriendsPage onNavigate={handleNavigate} />}
        {currentView === 'duels' && <DuelsPage onNavigate={handleNavigate} />}
        {currentView === 'chat' && <ChatPage friendId={viewData?.friendId} onNavigate={handleNavigate} />}
        {currentView === 'admin' && <AdminPage onNavigate={handleNavigate} />}
        {currentView === 'badge-management' && <BadgeManagementPage />}
        {currentView === 'title-management' && <TitleManagementPage />}
        {currentView === 'category-management' && <CategoryManagementPage />}
        {currentView === 'difficulty-management' && <DifficultyManagementPage />}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
