import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Quiz = Database['public']['Tables']['quizzes']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface QuizWithAuthor extends Quiz {
  author?: Profile;
  question_count?: number;
}

export function QuizValidationPage() {
  const { profile } = useAuth();
  const [pendingQuizzes, setPendingQuizzes] = useState<QuizWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizWithAuthor | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPendingQuizzes();
  }, []);

  const loadPendingQuizzes = async () => {
    setLoading(true);
   const { data: quizzes, error } = await supabase
  .from('quizzes')
  .select('*, author:profiles!quizzes_creator_id_fkey(*)')
  .eq('pending_validation', true)
  .eq('validation_status', 'pending')
  .order('created_at', { ascending: false });


    if (quizzes) {
      const quizzesWithCounts = await Promise.all(
        quizzes.map(async (quiz: any) => {
          const { count } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_id', quiz.id);

          return {
            ...quiz,
            question_count: count || 0,
          };
        })
      );

      setPendingQuizzes(quizzesWithCounts);
    }
    setLoading(false);
  };

  const approveQuiz = async (quizId: string) => {
    const { error: quizError } = await supabase
      .from('quizzes')
      .update({
        is_public: true,
        validation_status: 'approved',
        pending_validation: false,
      })
      .eq('id', quizId);

    if (!quizError) {
      await supabase
        .from('quiz_validations')
        .insert({
          quiz_id: quizId,
          validated_by: profile?.id,
          status: 'approved',
        });

      const quiz = pendingQuizzes.find(q => q.id === quizId);
      if (quiz?.author_id) {
        const { data: author } = await supabase
          .from('profiles')
          .select('published_quiz_count')
          .eq('id', quiz.author_id)
          .single();

        if (author) {
          await supabase
            .from('profiles')
            .update({
              published_quiz_count: (author.published_quiz_count || 0) + 1,
            })
            .eq('id', quiz.author_id);
        }
      }

      await loadPendingQuizzes();
      setSelectedQuiz(null);
    }
  };

  const rejectQuiz = async (quizId: string) => {
    if (!rejectionReason.trim()) {
      alert('Merci de fournir une raison pour le rejet');
      return;
    }

    const { error: quizError } = await supabase
      .from('quizzes')
      .update({
        validation_status: 'rejected',
        pending_validation: false,
      })
      .eq('id', quizId);

    if (!quizError) {
      await supabase
        .from('quiz_validations')
        .insert({
          quiz_id: quizId,
          validated_by: profile?.id,
          status: 'rejected',
          rejection_reason: rejectionReason,
        });

      await loadPendingQuizzes();
      setSelectedQuiz(null);
      setRejectionReason('');
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h2>
          <p className="text-gray-600">Seuls les administrateurs peuvent valider les quiz</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <Clock className="w-10 h-10 mr-3 text-blue-600" />
          Validation des Quiz
        </h1>
        <p className="text-gray-600">Valide les quiz avant leur publication</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      ) : pendingQuizzes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun quiz en attente</h3>
          <p className="text-gray-500">Tous les quiz ont été validés</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {pendingQuizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{quiz.title}</h3>
                  <p className="text-gray-600 mb-4">{quiz.description || 'Pas de description'}</p>

                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                      {quiz.question_count} questions
                    </span>
                    <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                      {quiz.category}
                    </span>
                    <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                      {quiz.difficulty}
                    </span>
                    {quiz.author && (
                      <span className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                        Par {quiz.author.pseudo}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {selectedQuiz?.id === quiz.id ? (
                <div className="border-t pt-4 mt-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raison du rejet (optionnel pour approbation)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      rows={3}
                      placeholder="Explique pourquoi ce quiz est rejeté..."
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setSelectedQuiz(null);
                        setRejectionReason('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => rejectQuiz(quiz.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <XCircle className="w-5 h-5 mr-2" />
                      Rejeter
                    </button>
                    <button
                      onClick={() => approveQuiz(quiz.id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Approuver
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedQuiz(quiz)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Examiner et valider
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
