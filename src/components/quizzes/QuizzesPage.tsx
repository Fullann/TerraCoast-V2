import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Search, Filter, Play, Plus, Share2, CreditCard as Edit, Dumbbell } from 'lucide-react';
import { ShareQuizModal } from './ShareQuizModal';
import type { Database } from '../../lib/database.types';

type Quiz = Database['public']['Tables']['quizzes']['Row'];

interface QuizzesPageProps {
  onNavigate: (view: string, data?: any) => void;
}

export function QuizzesPage({ onNavigate }: QuizzesPageProps) {
  const { profile } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [sharedQuizzes, setSharedQuizzes] = useState<Quiz[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'public' | 'my' | 'shared'>('public');
  const [shareQuiz, setShareQuiz] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    loadQuizzes();
  }, [profile, categoryFilter, difficultyFilter]);

  const loadQuizzes = async () => {
    if (!profile) return;

    let query = supabase
      .from('quizzes')
      .select('*')
      .or('is_public.eq.true,is_global.eq.true')
      .order('total_plays', { ascending: false });

    if (categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }

    if (difficultyFilter !== 'all') {
      query = query.eq('difficulty', difficultyFilter);
    }

    const { data } = await query;
    if (data) setQuizzes(data);

    const { data: myData } = await supabase
      .from('quizzes')
      .select('*')
      .eq('creator_id', profile.id)
      .order('created_at', { ascending: false });

    if (myData) setMyQuizzes(myData);

    const { data: sharedData } = await supabase
      .from('quiz_shares')
      .select('quiz:quizzes(*)')
      .eq('shared_with_user_id', profile.id);

    if (sharedData) {
      const sharedQuizzesList = sharedData
        .map((share: any) => share.quiz)
        .filter((quiz: Quiz | null) => quiz !== null) as Quiz[];
      setSharedQuizzes(sharedQuizzesList);
    }
  };

  const filteredQuizzes = (
    activeTab === 'public' ? quizzes : activeTab === 'my' ? myQuizzes : sharedQuizzes
  ).filter((quiz) =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      flags: 'Drapeaux',
      capitals: 'Capitales',
      maps: 'Cartes',
      borders: 'Frontières',
      regions: 'Régions',
      mixed: 'Mixte',
    };
    return labels[category] || category;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      hard: 'bg-red-100 text-red-700',
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Quiz de géographie</h1>
        <p className="text-gray-600">Explorez et jouez à des quiz créés par la communauté</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un quiz..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          >
            <option value="all">Toutes catégories</option>
            <option value="flags">Drapeaux</option>
            <option value="capitals">Capitales</option>
            <option value="maps">Cartes</option>
            <option value="borders">Frontières</option>
            <option value="regions">Régions</option>
            <option value="mixed">Mixte</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          >
            <option value="all">Toutes difficultés</option>
            <option value="easy">Facile</option>
            <option value="medium">Moyen</option>
            <option value="hard">Difficile</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('public')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'public'
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Quiz publics
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'my'
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Mes quiz
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'shared'
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Share2 className="w-4 h-4 inline mr-2" />
            Partagés ({sharedQuizzes.length})
          </button>
          <button
            onClick={() => onNavigate('create-quiz')}
            className="ml-auto px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Créer un quiz
          </button>
        </div>
      </div>

      {filteredQuizzes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun quiz trouvé</h3>
          <p className="text-gray-500">
            {activeTab === 'my'
              ? 'Vous n\'avez pas encore créé de quiz'
              : activeTab === 'shared'
              ? 'Aucun quiz partagé avec vous'
              : 'Essayez de modifier vos filtres'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-800 flex-1">{quiz.title}</h3>
                  {quiz.is_global && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      Global
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {quiz.description || 'Pas de description'}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    {getCategoryLabel(quiz.category)}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full ${getDifficultyColor(quiz.difficulty)}`}>
                    {quiz.difficulty === 'easy' && 'Facile'}
                    {quiz.difficulty === 'medium' && 'Moyen'}
                    {quiz.difficulty === 'hard' && 'Difficile'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{quiz.total_plays} parties</span>
                  {quiz.average_score > 0 && (
                    <span>Moy: {Math.round(quiz.average_score)}</span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => onNavigate('play-quiz', { quizId: quiz.id })}
                    className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Jouer
                  </button>
                  <button
                    onClick={() => onNavigate('play-training', { quizId: quiz.id, questionCount: 10 })}
                    className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    title="Mode entraînement"
                  >
                    <Dumbbell className="w-4 h-4" />
                  </button>
                  {activeTab === 'my' && (
                    <>
                      <button
                        onClick={() => onNavigate('edit-quiz', { quizId: quiz.id })}
                        className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        title="Modifier le quiz"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {!quiz.is_public && (
                        <button
                          onClick={() => setShareQuiz({ id: quiz.id, title: quiz.title })}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          title="Partager avec des amis"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {shareQuiz && (
        <ShareQuizModal
          quizId={shareQuiz.id}
          quizTitle={shareQuiz.title}
          onClose={() => setShareQuiz(null)}
        />
      )}
    </div>
  );
}
