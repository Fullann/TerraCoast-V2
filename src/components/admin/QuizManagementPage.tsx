import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  BookOpen,
  Search,
  Copy,
  Trash2,
  Shield,
  AlertTriangle,
  Edit2,
  Eye,
  EyeOff,
  RotateCcw,
  User,
  Flag,
} from "lucide-react";
import type { Database } from "../../lib/database.types";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface QuizWithCreator extends Quiz {
  creator?: Profile;
}

interface QuizManagementPageProps {
  onNavigate?: (view: string, data?: any) => void;
}

export function QuizManagementPage({ onNavigate }: QuizManagementPageProps) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [quizzes, setQuizzes] = useState<QuizWithCreator[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<QuizWithCreator[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"created" | "plays" | "score">(
    "created"
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "public" | "private"
  >("all");
  const [filterReported, setFilterReported] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizWithCreator | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

  useEffect(() => {
    loadQuizzes();
  }, [sortBy, filterStatus, filterReported]);

  const loadQuizzes = async () => {
    setLoading(true);
    let query = supabase.from("quizzes").select(`
        *,
        creator:profiles!quizzes_creator_id_fkey(*)
      `);

    if (filterStatus === "public") {
      query = query.eq("is_public", true);
    } else if (filterStatus === "private") {
      query = query.eq("is_public", false);
    }

    if (filterReported) {
      query = query.eq("is_reported", true);
    }

    const { data, error } = await query
      .order(
        sortBy === "created"
          ? "created_at"
          : sortBy === "plays"
          ? "total_plays"
          : "average_score",
        { ascending: false }
      )
      .limit(100);

    if (data) {
      const quizzesWithCreator = data.map((quiz: any) => ({
        ...quiz,
        creator: Array.isArray(quiz.creator) ? quiz.creator[0] : quiz.creator,
      }));
      setQuizzes(quizzesWithCreator);
    }
    setLoading(false);
  };

  const searchQuizzes = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from("quizzes")
      .select(
        `
        *,
        creator:profiles!quizzes_creator_id_fkey(*)
      `
      )
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20);

    if (data) {
      const quizzesWithCreator = data.map((quiz: any) => ({
        ...quiz,
        creator: Array.isArray(quiz.creator) ? quiz.creator[0] : quiz.creator,
      }));
      setSearchResults(quizzesWithCreator);
    }
  };

  const toggleQuizVisibility = async (quizId: string, isPublic: boolean) => {
    if (!confirm(`Rendre ce quiz ${isPublic ? "privé" : "public"} ?`)) return;

    const { error } = await supabase
      .from("quizzes")
      .update({ is_public: !isPublic })
      .eq("id", quizId);

    if (error) {
      alert("Erreur : " + error.message);
      return;
    }

    alert(`Quiz rendu ${isPublic ? "privé" : "public"} !`);
    loadQuizzes();
  };

  const toggleQuizGlobal = async (quizId: string, isGlobal: boolean) => {
    if (
      !confirm(`${isGlobal ? "Retirer" : "Ajouter"} ce quiz des quiz globaux ?`)
    )
      return;

    const { error } = await supabase
      .from("quizzes")
      .update({ is_global: !isGlobal })
      .eq("id", quizId);

    if (error) {
      alert("Erreur : " + error.message);
      return;
    }

    alert(`Quiz ${isGlobal ? "retiré des" : "ajouté aux"} quiz globaux !`);
    loadQuizzes();
  };

  const duplicateQuiz = async (quiz: QuizWithCreator) => {
    if (!confirm(`Dupliquer le quiz "${quiz.title}" ?`)) return;

    try {
      const { data, error } = await supabase.rpc("duplicate_quiz", {
        p_quiz_id: quiz.id,
        p_new_title: `${quiz.title} (copie)`,
      });

      if (error) {
        console.error("Erreur:", error);
        alert("Erreur lors de la duplication : " + error.message);
        return;
      }

      alert(`Quiz "${quiz.title}" dupliqué avec succès ! ID: ${data}`);
      loadQuizzes();
    } catch (error: any) {
      alert("Erreur : " + error.message);
    }
  };

  const resetQuizStats = async (quizId: string, quizTitle: string) => {
    if (
      !confirm(
        `Réinitialiser les statistiques de "${quizTitle}" ?\n\nCela remettra à zéro :\n- Le nombre de parties jouées\n- Le score moyen\n- Les signalements`
      )
    )
      return;

    const { error } = await supabase
      .from("quizzes")
      .update({
        total_plays: 0,
        average_score: 0,
        is_reported: false,
        report_count: 0,
      })
      .eq("id", quizId);

    if (error) {
      alert("Erreur : " + error.message);
      return;
    }

    alert(`Statistiques réinitialisées pour "${quizTitle}" !`);
    loadQuizzes();
  };

  const deleteQuiz = async () => {
    if (!selectedQuiz) return;

    if (!deleteReason.trim()) {
      alert("Tu dois indiquer une raison");
      return;
    }

    try {
      // Supprimer les réponses des sessions de jeu
      const { data: sessions } = await supabase
        .from("game_sessions")
        .select("id")
        .eq("quiz_id", selectedQuiz.id);

      if (sessions) {
        for (const session of sessions) {
          await supabase
            .from("game_answers")
            .delete()
            .eq("session_id", session.id);
        }
      }

      // Supprimer les questions du quiz
      await supabase.from("questions").delete().eq("quiz_id", selectedQuiz.id);

      // Supprimer les sessions de jeu
      await supabase
        .from("game_sessions")
        .delete()
        .eq("quiz_id", selectedQuiz.id);

      // Supprimer les partages
      await supabase
        .from("quiz_shares")
        .delete()
        .eq("quiz_id", selectedQuiz.id);

      // Supprimer les duels
      await supabase.from("duels").delete().eq("quiz_id", selectedQuiz.id);

      // Supprimer les rapports
      await supabase.from("reports").delete().eq("quiz_id", selectedQuiz.id);

      // Supprimer le quiz
      const { error } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", selectedQuiz.id);

      if (error) {
        alert("Erreur : " + error.message);
        return;
      }

      // Mettre à jour le compteur de quiz publiés du créateur
      if (selectedQuiz.is_public) {
        const { data: creatorProfile } = await supabase
          .from("profiles")
          .select("published_quiz_count")
          .eq("id", selectedQuiz.creator_id)
          .single();

        if (creatorProfile) {
          await supabase
            .from("profiles")
            .update({
              published_quiz_count: Math.max(
                0,
                (creatorProfile.published_quiz_count || 0) - 1
              ),
            })
            .eq("id", selectedQuiz.creator_id);
        }
      }

      alert(`Quiz "${selectedQuiz.title}" supprimé avec succès !`);
      setShowDeleteModal(false);
      setDeleteReason("");
      setSelectedQuiz(null);
      loadQuizzes();
    } catch (error: any) {
      alert("Erreur lors de la suppression : " + error.message);
    }
  };

  if (profile?.role !== "admin") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Accès refusé
          </h2>
          <p className="text-gray-600">
            Tu dois être administrateur pour accéder à cette page
          </p>
        </div>
      </div>
    );
  }

  const displayQuizzes =
    searchTerm.trim().length >= 2 ? searchResults : quizzes;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <BookOpen className="w-10 h-10 mr-3 text-emerald-600" />
          Gestion des quiz
        </h1>
        <p className="text-gray-600">
          Gère les quiz, leur visibilité et leurs statistiques
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="space-y-4">
          {/* Recherche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher un quiz
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cherche par titre ou description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchQuizzes(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="created">Date de création</option>
                <option value="plays">Nombre de parties</option>
                <option value="score">Score moyen</option>
              </select>
            </div>

            {/* Filtre statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="all">Tous les quiz</option>
                <option value="public">Publics uniquement</option>
                <option value="private">Privés uniquement</option>
              </select>
            </div>

            {/* Filtre signalés */}
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterReported}
                  onChange={(e) => setFilterReported(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Signalés uniquement
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des quiz */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : displayQuizzes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun quiz trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Titre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Créateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Difficulté
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Parties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Score moy.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayQuizzes.map((quiz) => (
                  <tr
                    key={quiz.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">
                        {quiz.title}
                      </p>
                      {quiz.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {quiz.description.substring(0, 50)}
                          {quiz.description.length > 50 ? "..." : ""}
                        </p>
                      )}
                      {quiz.is_reported && (
                        <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 mt-1">
                          <Flag className="w-3 h-3" />
                          <span>{quiz.report_count} signalement(s)</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {quiz.creator ? (
                        <button
                          onClick={() =>
                            onNavigate?.("view-profile", {
                              userId: quiz.creator?.id,
                            })
                          }
                          className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {quiz.creator.pseudo}
                          </span>
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">Inconnu</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 capitalize">
                        {quiz.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          quiz.difficulty === "easy"
                            ? "bg-green-100 text-green-700"
                            : quiz.difficulty === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {quiz.difficulty === "easy"
                          ? "Facile"
                          : quiz.difficulty === "medium"
                          ? "Moyen"
                          : "Difficile"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-800">
                        {quiz.total_plays}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-800">
                        {quiz.average_score
                          ? quiz.average_score.toFixed(1)
                          : "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            quiz.is_public
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {quiz.is_public ? "Public" : "Privé"}
                        </span>
                        {quiz.is_global && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            Global
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {/* Bouton Modifier */}
                        <button
                          onClick={() =>
                            onNavigate?.("edit-quiz", { quizId: quiz.id })
                          }
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {/* Bouton Dupliquer */}
                        <button
                          onClick={() => duplicateQuiz(quiz)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Dupliquer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Bouton Visibilité */}
                        <button
                          onClick={() =>
                            toggleQuizVisibility(quiz.id, quiz.is_public)
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            quiz.is_public
                              ? "text-orange-600 hover:bg-orange-50"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                          title={
                            quiz.is_public ? "Rendre privé" : "Rendre public"
                          }
                        >
                          {quiz.is_public ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>

                        {/* Bouton Global */}
                        <button
                          onClick={() =>
                            toggleQuizGlobal(quiz.id, quiz.is_global)
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            quiz.is_global
                              ? "text-purple-600 hover:bg-purple-50"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                          title={
                            quiz.is_global
                              ? "Retirer des globaux"
                              : "Ajouter aux globaux"
                          }
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>

                        {/* Bouton Reset Stats */}
                        <button
                          onClick={() => resetQuizStats(quiz.id, quiz.title)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Réinitialiser les statistiques"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        {/* Bouton Supprimer */}
                        <button
                          onClick={() => {
                            setSelectedQuiz(quiz);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Suppression */}
      {showDeleteModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Supprimer "{selectedQuiz.title}"
            </h3>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Action irréversible
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Le quiz, ses questions, sessions et partages seront
                    définitivement supprimés
                  </p>
                </div>
              </div>
            </div>

            {selectedQuiz.creator && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Créateur :</span>{" "}
                  {selectedQuiz.creator.pseudo}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Son compteur de quiz sera mis à jour
                </p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison de la suppression
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Ex: Contenu inapproprié, violation des règles..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason("");
                  setSelectedQuiz(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={deleteQuiz}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
