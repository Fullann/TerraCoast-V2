import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Dumbbell, ArrowLeft, Play, Search } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Quiz = Database['public']['Tables']['quizzes']['Row'];

interface TrainingModePageProps {
  onNavigate: (view: string, data?: any) => void;
}

export function TrainingModePage({ onNavigate }: TrainingModePageProps) {
  const { profile } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [maxQuestions, setMaxQuestions] = useState(50);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    const { data } = await supabase
      .from('quizzes')
      .select('*')
      .or('is_public.eq.true,is_global.eq.true')
      .order('total_plays', { ascending: false });

    if (data) {
      setQuizzes(data);
    }
    setLoading(false);
  };

  const handleQuizSelection = async (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    const { count } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quiz.id);

    const quizQuestionCount = count || 10;
    setMaxQuestions(quizQuestionCount);
    setQuestionCount(Math.min(10, quizQuestionCount));
  };

  const startTraining = () => {
    if (!selectedQuiz) return;

    onNavigate('play-training', {
      quizId: selectedQuiz.id,
      questionCount: questionCount,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </button>
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <Dumbbell className="w-10 h-10 mr-3 text-emerald-600" />
          Mode Entraînement
        </h1>
        <p className="text-gray-600">
          Pratiquez sans limite de temps et sans gagner d'XP
        </p>
      </div>

      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Caractéristiques du mode entraînement</h2>
        <ul className="space-y-2">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
            Pas de limite de temps - prenez le temps de réfléchir
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
            Pas de gain d'XP - juste pour s'entraîner
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
            Choisissez le nombre de questions
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
            Validation immédiate avec explications
          </li>
        </ul>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          1. Choisissez un quiz
        </h2>

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un quiz..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {quizzes
              .filter((quiz) =>
                quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((quiz) => (
              <button
                key={quiz.id}
                onClick={() => handleQuizSelection(quiz)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedQuiz?.id === quiz.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{quiz.title}</h3>
                    <p className="text-sm text-gray-600">{quiz.description}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {quiz.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {quiz.total_plays} parties
                      </span>
                    </div>
                  </div>
                  {selectedQuiz?.id === quiz.id && (
                    <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">✓</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedQuiz && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            2. Nombre de questions
          </h2>

          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="5"
              max={maxQuestions}
              step="5"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="text-center min-w-[60px]">
              <span className="text-3xl font-bold text-emerald-600">{questionCount}</span>
              <p className="text-xs text-gray-600">questions</p>
            </div>
          </div>

          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>5 questions</span>
            <span>{maxQuestions} questions (max)</span>
          </div>
        </div>
      )}

      <button
        onClick={startTraining}
        disabled={!selectedQuiz}
        className="w-full py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        <Play className="w-6 h-6 mr-2" />
        Commencer l'entraînement
      </button>
    </div>
  );
}
