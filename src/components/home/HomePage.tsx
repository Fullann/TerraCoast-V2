import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Trophy, Target, Zap, Users, BookOpen, Award, Dumbbell } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Quiz = Database['public']['Tables']['quizzes']['Row'];
type GameSession = Database['public']['Tables']['game_sessions']['Row'];

export function HomePage({ onNavigate }: { onNavigate: (view: string) => void }) {
  const { profile } = useAuth();
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [recentSessions, setRecentSessions] = useState<GameSession[]>([]);
  const [stats, setStats] = useState({
    totalPlays: 0,
    averageScore: 0,
    bestScore: 0,
  });

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;

    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('*')
      .or('is_public.eq.true,is_global.eq.true')
      .order('total_plays', { ascending: false })
      .limit(6);

    if (quizzes) setRecentQuizzes(quizzes);

    const { data: sessions } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('player_id', profile.id)
      .eq('completed', true)
      .order('completed_at', { ascending: false })
      .limit(5);

    if (sessions) {
      setRecentSessions(sessions);

      const totalPlays = sessions.length;
      const averageScore = sessions.reduce((acc, s) => acc + s.score, 0) / totalPlays || 0;
      const bestScore = Math.max(...sessions.map(s => s.score), 0);

      setStats({ totalPlays, averageScore, bestScore });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Bienvenue, {profile?.pseudo}!
        </h1>
        <p className="text-gray-600">Prêt à tester vos connaissances en géographie?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-10 h-10" />
            <span className="text-3xl font-bold">{stats.totalPlays}</span>
          </div>
          <h3 className="text-lg font-semibold">Parties jouées</h3>
          <p className="text-emerald-100 text-sm">Total de vos sessions</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-10 h-10" />
            <span className="text-3xl font-bold">{Math.round(stats.averageScore)}</span>
          </div>
          <h3 className="text-lg font-semibold">Score moyen</h3>
          <p className="text-blue-100 text-sm">Sur toutes vos parties</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="w-10 h-10" />
            <span className="text-3xl font-bold">{stats.bestScore}</span>
          </div>
          <h3 className="text-lg font-semibold">Meilleur score</h3>
          <p className="text-amber-100 text-sm">Votre record personnel</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Actions rapides</h2>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onNavigate('quizzes')}
              className="w-full flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <BookOpen className="w-6 h-6 text-emerald-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Explorer les quiz</p>
                  <p className="text-sm text-gray-600">Découvrez de nouveaux défis</p>
                </div>
              </div>
              <span className="text-emerald-600 group-hover:translate-x-1 transition-transform">→</span>
            </button>

            <button
              onClick={() => onNavigate('create-quiz')}
              className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <Award className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Créer un quiz</p>
                  <p className="text-sm text-gray-600">Partagez votre savoir</p>
                </div>
              </div>
              <span className="text-blue-600 group-hover:translate-x-1 transition-transform">→</span>
            </button>

            <button
              onClick={() => onNavigate('training-mode')}
              className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <Dumbbell className="w-6 h-6 text-purple-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Mode Entraînement</p>
                  <p className="text-sm text-gray-600">Sans limite de temps</p>
                </div>
              </div>
              <span className="text-purple-600 group-hover:translate-x-1 transition-transform">→</span>
            </button>

            <button
              onClick={() => onNavigate('friends')}
              className="w-full flex items-center justify-between p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-amber-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Défier un ami</p>
                  <p className="text-sm text-gray-600">Duel en temps réel</p>
                </div>
              </div>
              <span className="text-amber-600 group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Quiz populaires</h2>

          <div className="space-y-3">
            {recentQuizzes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucun quiz disponible</p>
            ) : (
              recentQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-emerald-300 transition-colors cursor-pointer"
                  onClick={() => onNavigate('quizzes')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{quiz.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-xs text-gray-500">
                          {quiz.total_plays} parties
                        </span>
                        <span className="text-xs text-emerald-600 font-medium">
                          {quiz.difficulty === 'easy' && 'Facile'}
                          {quiz.difficulty === 'medium' && 'Moyen'}
                          {quiz.difficulty === 'hard' && 'Difficile'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
