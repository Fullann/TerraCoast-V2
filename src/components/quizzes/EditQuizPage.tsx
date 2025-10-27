import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { languageNames, Language } from '../../i18n/translations';
import { Plus, Trash2, Save, ArrowLeft, CreditCard as Edit, Image } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type QuestionType = 'mcq' | 'single_answer' | 'map_click' | 'text_free';
type QuizCategory = 'flags' | 'capitals' | 'maps' | 'borders' | 'regions' | 'mixed';
type Difficulty = 'easy' | 'medium' | 'hard';
type Quiz = Database['public']['Tables']['quizzes']['Row'];
type Question = Database['public']['Tables']['questions']['Row'];

interface EditQuizPageProps {
  quizId: string;
  onNavigate: (view: string) => void;
}

export function EditQuizPage({ quizId, onNavigate }: EditQuizPageProps) {
  const { profile } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<QuizCategory>('capitals');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(30);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [quizLanguage, setQuizLanguage] = useState<Language>('fr');
  const [questions, setQuestions] = useState<(Question & { isNew?: boolean })[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    const { data: quizData } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizData) {
      setQuiz(quizData);
      setTitle(quizData.title);
      setDescription(quizData.description || '');
      setCategory(quizData.category);
      setDifficulty(quizData.difficulty);
      setTimeLimitSeconds(quizData.time_limit_seconds || 30);
      setCoverImageUrl(quizData.cover_image_url || '');
      setQuizLanguage((quizData.language as Language) || 'fr');

      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index');

      if (questionsData) {
        setQuestions(questionsData);
      }
    }

    setLoading(false);
  };

  const startEditingQuestion = (question: Question) => {
    setEditingQuestion({ ...question });
  };

  const cancelEditingQuestion = () => {
    setEditingQuestion(null);
  };

  const saveQuestion = () => {
    if (!editingQuestion) return;

    const index = questions.findIndex(q => q.id === editingQuestion.id);
    if (index >= 0) {
      const newQuestions = [...questions];
      newQuestions[index] = editingQuestion;
      setQuestions(newQuestions);
    }
    setEditingQuestion(null);
  };

  const addNewQuestion = () => {
    const newQuestion: any = {
      id: `temp_${Date.now()}`,
      quiz_id: quizId,
      question_text: '',
      question_type: 'mcq' as QuestionType,
      correct_answer: '',
      options: ['', '', '', ''],
      image_url: null,
      points: 100,
      order_index: questions.length,
      created_at: new Date().toISOString(),
      isNew: true,
    };
    setQuestions([...questions, newQuestion]);
    setEditingQuestion(newQuestion);
  };

  const deleteQuestion = (questionId: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette question?')) {
      setQuestions(questions.filter(q => q.id !== questionId));
    }
  };

  const updateOption = (index: number, value: string) => {
    if (!editingQuestion) return;
    const newOptions = Array.isArray(editingQuestion.options)
      ? [...editingQuestion.options as string[]]
      : ['', '', '', ''];
    newOptions[index] = value;
    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  const saveQuiz = async () => {
    if (!profile || !quiz) return;

    if (!title.trim()) {
      setError('Le titre ne peut pas être vide');
      return;
    }

    if (questions.length === 0) {
      setError('Ajoutez au moins une question');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await supabase
        .from('quizzes')
        .update({
          title,
          description,
          category,
          difficulty,
          time_limit_seconds: timeLimitSeconds,
          cover_image_url: coverImageUrl || null,
          language: quizLanguage,
        })
        .eq('id', quizId);

      for (const question of questions) {
        if (question.isNew) {
          const { id, isNew, ...questionData } = question;
          await supabase.from('questions').insert({
            ...questionData,
            options: question.question_type === 'mcq'
              ? (Array.isArray(question.options) ? question.options : []).filter((opt: string) => opt.trim())
              : null,
          });
        } else {
          const { isNew, ...questionData } = question;
          await supabase
            .from('questions')
            .update({
              question_text: questionData.question_text,
              question_type: questionData.question_type,
              correct_answer: questionData.correct_answer,
              options: questionData.question_type === 'mcq'
                ? (Array.isArray(questionData.options) ? questionData.options : []).filter((opt: string) => opt.trim())
                : null,
              image_url: questionData.image_url,
              points: questionData.points,
              order_index: questionData.order_index,
            })
            .eq('id', question.id);
        }
      }

      alert('Quiz mis à jour avec succès!');
      onNavigate('quizzes');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du quiz');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => onNavigate('quizzes')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour aux quiz
        </button>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Modifier le quiz</h1>
        <p className="text-gray-600">Éditez votre quiz de géographie</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Informations du quiz</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre du quiz *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              placeholder="Ex: Capitales d'Europe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              rows={3}
              placeholder="Décrivez votre quiz..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image de couverture (URL)
            </label>
            <input
              type="text"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              placeholder="https://exemple.com/image.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optionnel : Ajoute une image de présentation pour ton quiz
            </p>
            {coverImageUrl && (
              <div className="mt-2">
                <img
                  src={coverImageUrl}
                  alt="Aperçu"
                  className="w-full max-w-md h-32 object-cover rounded-lg border-2 border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Langue *
              </label>
              <select
                value={quizLanguage}
                onChange={(e) => setQuizLanguage(e.target.value as Language)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                {Object.entries(languageNames).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as QuizCategory)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="flags">Drapeaux</option>
                <option value="capitals">Capitales</option>
                <option value="maps">Cartes</option>
                <option value="borders">Frontières</option>
                <option value="regions">Régions</option>
                <option value="mixed">Mixte</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulté *
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="easy">Facile</option>
                <option value="medium">Moyen</option>
                <option value="hard">Difficile</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temps par question (sec)
              </label>
              <input
                type="number"
                value={timeLimitSeconds}
                onChange={(e) => setTimeLimitSeconds(parseInt(e.target.value) || 30)}
                min="5"
                max="120"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Questions ({questions.length})
          </h2>
          <button
            onClick={addNewQuestion}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une question
          </button>
        </div>

        <div className="space-y-3">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-emerald-300 transition-colors"
            >
              {editingQuestion?.id === question.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question *
                    </label>
                    <input
                      type="text"
                      value={editingQuestion.question_text}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, question_text: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image (URL) - Optionnel
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={editingQuestion.image_url || ''}
                        onChange={(e) =>
                          setEditingQuestion({ ...editingQuestion, image_url: e.target.value })
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        placeholder="https://example.com/image.jpg"
                      />
                      <Image className="w-10 h-10 p-2 text-gray-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type de question
                      </label>
                      <select
                        value={editingQuestion.question_type}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            question_type: e.target.value as QuestionType,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      >
                        <option value="mcq">QCM</option>
                        <option value="single_answer">Réponse unique</option>
                        <option value="text_free">Texte libre</option>
                        <option value="map_click">Clic sur carte</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Points
                      </label>
                      <input
                        type="number"
                        value={editingQuestion.points}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            points: parseInt(e.target.value) || 100,
                          })
                        }
                        min="10"
                        max="1000"
                        step="10"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  {editingQuestion.question_type === 'mcq' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options
                      </label>
                      <div className="space-y-2">
                        {(Array.isArray(editingQuestion.options) ? editingQuestion.options : ['', '', '', '']).map((option: string, idx: number) => (
                          <input
                            key={idx}
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(idx, e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                            placeholder={`Option ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Réponse correcte *
                    </label>
                    {editingQuestion.question_type === 'mcq' ? (
                      <select
                        value={editingQuestion.correct_answer}
                        onChange={(e) =>
                          setEditingQuestion({ ...editingQuestion, correct_answer: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      >
                        <option value="">Sélectionnez</option>
                        {(Array.isArray(editingQuestion.options) ? editingQuestion.options : [])
                          .filter((opt: string) => opt.trim())
                          .map((option: string, idx: number) => (
                            <option key={idx} value={option}>
                              {option}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={editingQuestion.correct_answer}
                        onChange={(e) =>
                          setEditingQuestion({ ...editingQuestion, correct_answer: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      />
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={saveQuestion}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={cancelEditingQuestion}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 mb-1">
                      {index + 1}. {question.question_text}
                    </p>
                    {question.image_url && (
                      <p className="text-xs text-blue-600 mb-2">📷 Image incluse</p>
                    )}
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {question.question_type === 'mcq' && 'QCM'}
                        {question.question_type === 'single_answer' && 'Réponse unique'}
                        {question.question_type === 'text_free' && 'Texte libre'}
                        {question.question_type === 'map_click' && 'Clic sur carte'}
                      </span>
                      <span>{question.points} pts</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditingQuestion(question)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteQuestion(question.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => onNavigate('quizzes')}
          className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Annuler
        </button>
        <button
          onClick={saveQuiz}
          disabled={saving}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
}
