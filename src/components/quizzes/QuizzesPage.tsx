import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  BookOpen,
  Search,
  Filter,
  Play,
  Plus,
  Share2,
  CreditCard as Edit,
  Dumbbell,
  Trash2,
  Globe,
} from "lucide-react";
import { ShareQuizModal } from "./ShareQuizModal";
import type { Database } from "../../lib/database.types";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type QuizType = Database["public"]["Tables"]["quiz_types"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Difficulty = Database["public"]["Tables"]["difficulties"]["Row"];

interface QuizWithType extends Quiz {
  quiz_types?: QuizType | null;
}

interface QuizzesPageProps {
  onNavigate: (view: string, data?: any) => void;
}

export function QuizzesPage({ onNavigate }: QuizzesPageProps) {
  const { profile } = useAuth();
  const { language, showAllLanguages, t } = useLanguage();
  const [quizzes, setQuizzes] = useState<QuizWithType[]>([]);
  const [myQuizzes, setMyQuizzes] = useState<QuizWithType[]>([]);
  const [sharedQuizzes, setSharedQuizzes] = useState<QuizWithType[]>([]);
  const [quizTypes, setQuizTypes] = useState<QuizType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"public" | "my" | "shared">(
    "public"
  );
  const [shareQuiz, setShareQuiz] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    loadQuizzes();
    loadQuizTypes();
    loadCategories();
    loadDifficulties();
  }, [
    profile,
    categoryFilter,
    difficultyFilter,
    typeFilter,
    language,
    showAllLanguages,
  ]);

  const loadQuizTypes = async () => {
    const { data } = await supabase
      .from("quiz_types")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (data) setQuizTypes(data);
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("label");

    if (data) setCategories(data);
  };

  const loadDifficulties = async () => {
    const { data } = await supabase
      .from("difficulties")
      .select("*")
      .order("multiplier");

    if (data) setDifficulties(data);
  };

  const requestPublish = async (quizId: string, quizTitle: string) => {
    if (
      !confirm(t("quizzes.confirmPublishRequest").replace("{title}", quizTitle))
    )
      return;

    const { error } = await supabase
      .from("quizzes")
      .update({ pending_validation: true, validation_status: "pending" })
      .eq("id", quizId);

    if (error) {
      alert(t("quizzes.publishRequestError"));
      return;
    }

    alert(t("quizzes.publishRequestSuccess"));
    loadQuizzes();
  };

  const publishQuizDirectly = async (quizId: string) => {
    const { error } = await supabase
      .from("quizzes")
      .update({
        is_public: true,
        is_global: true,
        published_at: new Date().toISOString(),
      })
      .eq("id", quizId);

    if (error) {
      alert(t("quizzes.publishError"));
      return;
    }

    alert(t("quizzes.publishSuccess"));
    loadQuizzes();
  };

  const removeSharedQuiz = async (quizId: string) => {
    if (!confirm(t("quizzes.confirmRemoveShared"))) return;

    const { error } = await supabase
      .from("quiz_shares")
      .delete()
      .eq("quiz_id", quizId)
      .eq("shared_with_user_id", profile?.id);

    if (error) {
      console.error("Error removing shared quiz:", error);
      alert(t("quizzes.removeError"));
      return;
    }

    setSharedQuizzes(sharedQuizzes.filter((q) => q.id !== quizId));

    alert(
      t("quizzes.removeSuccess") || "Quiz retiré de votre liste avec succès !"
    );
  };
  const deleteQuiz = async (quizId: string, quizTitle: string) => {
    if (!confirm(t("quizzes.confirmDelete").replace("{title}", quizTitle)))
      return;

    // Supprimer d'abord les questions associées
    const { error: questionsError } = await supabase
      .from("questions")
      .delete()
      .eq("quiz_id", quizId);

    if (questionsError) {
      console.error("Error deleting questions:", questionsError);
      alert(t("quizzes.deleteQuestionsError"));
      return;
    }

    // Supprimer les partages associés
    await supabase.from("quiz_shares").delete().eq("quiz_id", quizId);

    // Supprimer le quiz
    const { error: quizError } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", quizId);

    if (quizError) {
      console.error("Error deleting quiz:", quizError);
      alert(t("quizzes.deleteError"));
      return;
    }

    // Mettre à jour la liste locale
    setMyQuizzes(myQuizzes.filter((q) => q.id !== quizId));

    alert(t("quizzes.deleteSuccess"));
  };

  const loadQuizzes = async () => {
    if (!profile) return;

    let query = supabase
      .from("quizzes")
      .select("*, quiz_types(*)")
      .or("is_public.eq.true,is_global.eq.true")
      .order("total_plays", { ascending: false });

    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter);
    }

    if (difficultyFilter !== "all") {
      query = query.eq("difficulty", difficultyFilter);
    }

    if (typeFilter !== "all") {
      query = query.eq("quiz_type_id", typeFilter);
    }

    if (!showAllLanguages) {
      query = query.eq("language", language);
    }

    const { data } = await query;
    if (data) setQuizzes(data as QuizWithType[]);

    const { data: myData } = await supabase
      .from("quizzes")
      .select("*, quiz_types(*)")
      .eq("creator_id", profile.id)
      .order("created_at", { ascending: false });

    if (myData) setMyQuizzes(myData as QuizWithType[]);

    const { data: sharedData } = await supabase
      .from("quiz_shares")
      .select("quiz:quizzes(*)")
      .eq("shared_with_user_id", profile.id);

    if (sharedData) {
      const sharedQuizzesList = sharedData
        .map((share: any) => share.quiz)
        .filter((quiz: Quiz | null) => quiz !== null) as Quiz[];
      setSharedQuizzes(sharedQuizzesList);
    }
  };

  const filteredQuizzes = (
    activeTab === "public"
      ? quizzes
      : activeTab === "my"
      ? myQuizzes
      : sharedQuizzes
  ).filter(
    (quiz) =>
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryLabel = (categoryName: string) => {
    const category = categories.find((c) => c.name === categoryName);
    return category ? category.label : categoryName;
  };

  const getDifficultyLabel = (difficultyName: string) => {
    const difficulty = difficulties.find((d) => d.name === difficultyName);
    return difficulty ? difficulty.label : difficultyName;
  };

  const getDifficultyColor = (difficultyName: string) => {
    const difficulty = difficulties.find((d) => d.name === difficultyName);
    if (!difficulty) return "bg-gray-100 text-gray-700";

    return `bg-${difficulty.color}-100 text-${difficulty.color}-700`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          {t("quizzes.title")}
        </h1>
        <p className="text-gray-600">{t("quizzes.subtitle")}</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t("quizzes.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none appearance-none bg-white cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.5rem center",
              backgroundSize: "1.5em 1.5em",
            }}
          >
            <option value="all">{t("quizzes.allCategories")}</option>
            {categories.map((category) => (
              <option key={category.name} value={category.name}>
                {category.label}
              </option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none appearance-none bg-white cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.5rem center",
              backgroundSize: "1.5em 1.5em",
            }}
          >
            <option value="all">{t("quizzes.allDifficulties")}</option>
            {difficulties.map((difficulty) => (
              <option key={difficulty.name} value={difficulty.name}>
                {difficulty.label}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none appearance-none bg-white cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.5rem center",
              backgroundSize: "1.5em 1.5em",
            }}
          >
            <option value="all">{t("quizzes.allTypes")}</option>
            {quizTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("public")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "public"
                ? "bg-emerald-100 text-emerald-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            {t("quiz.publicQuizzes")}
          </button>
          <button
            onClick={() => setActiveTab("my")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "my"
                ? "bg-emerald-100 text-emerald-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t("quiz.myQuizzes")}
          </button>
          <button
            onClick={() => setActiveTab("shared")}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "shared"
                ? "bg-emerald-100 text-emerald-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Share2 className="w-4 h-4 inline mr-2" />
            {t("quiz.sharedQuizzes")} ({sharedQuizzes.length})
          </button>
          <button
            onClick={() => onNavigate("create-quiz")}
            className="ml-auto px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            {t("quiz.create")}
          </button>
        </div>
      </div>

      {filteredQuizzes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {t("quizzes.noQuizFound")}
          </h3>
          <p className="text-gray-500">
            {activeTab === "my"
              ? t("quizzes.noQuizCreated")
              : activeTab === "shared"
              ? t("quizzes.noQuizShared")
              : t("quizzes.tryDifferentFilters")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden"
            >
              {quiz.cover_image_url ? (
                <img
                  src={quiz.cover_image_url}
                  alt={quiz.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <BookOpen className="w-20 h-20 text-white opacity-50" />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-800 flex-1">
                    {quiz.title}
                  </h3>
                  {quiz.is_global && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {t("quizzes.global")}
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {quiz.description || ""}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    {getCategoryLabel(quiz.category)}
                  </span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${getDifficultyColor(
                      quiz.difficulty
                    )}`}
                  >
                    {getDifficultyLabel(quiz.difficulty)}
                  </span>
                  {quiz.quiz_types && (
                    <span
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: `${quiz.quiz_types.color}20`,
                        color: quiz.quiz_types.color,
                      }}
                    >
                      {quiz.quiz_types.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>
                    {quiz.total_plays} {t("quizzes.games")}
                  </span>
                  {quiz.average_score > 0 && (
                    <span>
                      {t("quizzes.average")}: {Math.round(quiz.average_score)}
                    </span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => onNavigate("play-quiz", { quizId: quiz.id })}
                    className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {t("quiz.play")}
                  </button>
                  <button
                    onClick={() =>
                      onNavigate("play-training", {
                        quizId: quiz.id,
                        questionCount: 10,
                      })
                    }
                    className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    title={t("quizzes.trainingMode")}
                  >
                    <Dumbbell className="w-4 h-4" />
                  </button>
                  {activeTab === "my" && (
                    <>
                      <button
                        onClick={() =>
                          onNavigate("edit-quiz", { quizId: quiz.id })
                        }
                        className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        title={t("quiz.edit")}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {!quiz.is_public && (
                        <>
                          <button
                            onClick={() =>
                              setShareQuiz({ id: quiz.id, title: quiz.title })
                            }
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            title={t("quizzes.shareWithFriends")}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              profile?.role === "admin"
                                ? publishQuizDirectly(quiz.id)
                                : requestPublish(quiz.id, quiz.title)
                            }
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            title={
                              profile?.role === "admin"
                                ? t("quizzes.publishDirectly")
                                : t("quizzes.requestPublish")
                            }
                          >
                            <Globe className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteQuiz(quiz.id, quiz.title)}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            title={t("quizzes.deleteQuiz")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                  {activeTab === "shared" && (
                    <button
                      onClick={() => removeSharedQuiz(quiz.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      title={t("quizzes.removeFromList")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
