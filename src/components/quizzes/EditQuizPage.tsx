import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { languageNames, Language } from "../../i18n/translations";
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  CreditCard as Edit,
  Image,
  X,
} from "lucide-react";
import type { Database } from "../../lib/database.types";
import { ImageDropzone } from "./ImageDropzone";

type QuestionType =
  | "mcq"
  | "single_answer"
  | "map_click"
  | "text_free"
  | "true_false";
type QuizCategory =
  | "flags"
  | "capitals"
  | "maps"
  | "borders"
  | "regions"
  | "mixed";
type Difficulty = "easy" | "medium" | "hard";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type Question = Database["public"]["Tables"]["questions"]["Row"];
type QuizType = Database["public"]["Tables"]["quiz_types"]["Row"];

interface EditQuizPageProps {
  quizId: string;
  onNavigate: (view: string) => void;
}

export function EditQuizPage({ quizId, onNavigate }: EditQuizPageProps) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<QuizCategory>("capitals");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(30);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [quizLanguage, setQuizLanguage] = useState<Language>("fr");
  const [quizTypes, setQuizTypes] = useState<QuizType[]>([]);
  const [selectedQuizType, setSelectedQuizType] = useState<string>("");
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeAnswers, setRandomizeAnswers] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false);
  const [questions, setQuestions] = useState<
    (Question & { isNew?: boolean })[]
  >([]);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [difficulties, setDifficulties] = useState<
    { id: string; name: string; level: number }[]
  >([]);

  useEffect(() => {
    loadQuiz();
    loadQuizTypes();
    loadDifficulties();
  }, [quizId]);

  const loadQuizTypes = async () => {
    const { data } = await supabase
      .from("quiz_types")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (data) setQuizTypes(data);
  };
  const loadDifficulties = async () => {
  const { data, error } = await supabase
    .from("difficulties")
    .select("*")
    .order("multiplier");
  if (error) {
    console.error("Erreur chargement difficultés:", error);
    return;
  }

  if (data) {
    setDifficulties(data);
  }
};
  const loadQuiz = async () => {
    const { data: quizData } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single();

    if (quizData) {
      if (quizData.creator_id !== profile?.id && profile?.role !== "admin") {
        setError("Tu n'as pas la permission d'éditer ce quiz");
        setLoading(false);
        return;
      }

      setQuiz(quizData);
      setTitle(quizData.title);
      setDescription(quizData.description || "");
      setCategory(quizData.category);
      setDifficulty(quizData.difficulty);
      setTimeLimitSeconds(quizData.time_limit_seconds || 30);
      setCoverImageUrl(quizData.cover_image_url || "");
      setQuizLanguage((quizData.language as Language) || "fr");
      setSelectedQuizType(quizData.quiz_type_id || "");
      setRandomizeQuestions(quizData.randomize_questions || false);
      setRandomizeAnswers(quizData.randomize_answers || false);
      setIsPublic(quizData.is_public || false);
      setIsGlobal(quizData.is_global || false);
      setTags(quizData.tags || []);

      const { data: questionsData } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_index");

      if (questionsData) {
        setQuestions(questionsData);
      }
    }

    setLoading(false);
  };

  const updateOptionImage = (optionText: string, imageUrl: string) => {
    if (!editingQuestion) return;

    const newOptionImages = { ...(editingQuestion.option_images || {}) };
    if (imageUrl.trim()) {
      newOptionImages[optionText] = imageUrl;
    } else {
      delete newOptionImages[optionText];
    }

    setEditingQuestion({ ...editingQuestion, option_images: newOptionImages });
  };

  const startEditingQuestion = (question: Question) => {
    setEditingQuestion({ ...question });
  };

  const cancelEditingQuestion = () => {
    setEditingQuestion(null);
  };

  const addTag = () => {
    const trimmedTag = currentTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };
  const saveQuestion = () => {
    if (!editingQuestion) return;

    const index = questions.findIndex((q) => q.id === editingQuestion.id);

    if (index >= 0) {
      const newQuestions = [...questions];
      newQuestions[index] = editingQuestion;
      setQuestions(newQuestions);
    } else {
      setQuestions([
        ...questions,
        { ...editingQuestion, order_index: questions.length },
      ]);
    }

    setEditingQuestion(null);
  };

  const addNewQuestion = () => {
    const newQuestion: any = {
      id: `temp_${Date.now()}`,
      quiz_id: quizId,
      question_text: "",
      question_type: "mcq" as QuestionType,
      correct_answer: "",
      correct_answers: [],
      options: ["", "", "", ""],
      image_url: null,
      points: 100,
      order_index: questions.length,
      created_at: new Date().toISOString(),
      isNew: true,
    };

    setQuestions([...questions, newQuestion]);
    setEditingQuestion(newQuestion);
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm(t("editQuiz.confirmDeleteQuestion"))) return;

    if (questionId.startsWith("temp_")) {
      setQuestions(questions.filter((q) => q.id !== questionId));
      return;
    }

    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId);

    if (error) {
      console.error("Error deleting question:", error);
      alert(t("editQuiz.deleteQuestionError"));
      return;
    }

    setQuestions(questions.filter((q) => q.id !== questionId));
    alert(t("editQuiz.deleteQuestionSuccess"));
  };

  const updateOption = (index: number, value: string) => {
    if (!editingQuestion) return;

    const newOptions = Array.isArray(editingQuestion.options)
      ? [...(editingQuestion.options as string[])]
      : ["", "", "", ""];
    newOptions[index] = value;

    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  const addVariant = () => {
    if (!editingQuestion) return;

    const currentVariants = Array.isArray(editingQuestion.correct_answers)
      ? editingQuestion.correct_answers
      : [];

    setEditingQuestion({
      ...editingQuestion,
      correct_answers: [...currentVariants, ""],
    });
  };

  const updateVariant = (index: number, value: string) => {
    if (!editingQuestion) return;

    const newVariants = [...(editingQuestion.correct_answers || [])];
    newVariants[index] = value;

    setEditingQuestion({
      ...editingQuestion,
      correct_answers: newVariants,
    });
  };

  const removeVariant = (index: number) => {
    if (!editingQuestion) return;

    const newVariants = (editingQuestion.correct_answers || []).filter(
      (_: any, i: number) => i !== index
    );

    setEditingQuestion({
      ...editingQuestion,
      correct_answers: newVariants,
    });
  };

  const makeQuizPrivate = async () => {
    if (!quiz) return;

    if (confirm("Voulez-vous vraiment rendre ce quiz privé ?")) {
      const { error } = await supabase
        .from("quizzes")
        .update({
          is_public: false,
          is_global: false,
          validation_status: null,
          pending_validation: false,
        })
        .eq("id", quizId);

      if (error) {
        alert("Erreur lors de la modification");
      } else {
        alert("Quiz rendu privé avec succès !");
        loadQuiz();
      }
    }
  };

  const saveQuiz = async () => {
    if (!profile || !quiz) return;

    if (!title.trim()) {
      setError(t("editQuiz.titleRequired"));
      return;
    }

    if (!difficulty) {
      setError("La difficulté est obligatoire");
      return;
    }

    if (questions.length === 0) {
      setError(t("editQuiz.atLeastOneQuestion"));
      return;
    }

    const hasInvalidPoints = questions.some((q) => q.points > 500);
    if (hasInvalidPoints) {
      setError("Une ou plusieurs questions dépassent 500 points maximum");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await supabase
        .from("quizzes")
        .update({
          title,
          description,
          category,
          difficulty,
          time_limit_seconds: timeLimitSeconds,
          cover_image_url: coverImageUrl || null,
          language: quizLanguage,
          quiz_type_id: selectedQuizType || null,
          randomize_questions: randomizeQuestions,
          randomize_answers: randomizeAnswers,
          tags: tags.length > 0 ? tags : null,
        })
        .eq("id", quizId);

      const { data: existingQuestions } = await supabase
        .from("questions")
        .select("id")
        .eq("quiz_id", quizId);

      if (existingQuestions) {
        const currentQuestionIds = questions
          .filter((q) => !q.isNew)
          .map((q) => q.id);

        const questionsToDelete = existingQuestions
          .filter((eq) => !currentQuestionIds.includes(eq.id))
          .map((eq) => eq.id);

        if (questionsToDelete.length > 0) {
          await supabase.from("questions").delete().in("id", questionsToDelete);
        }
      }

      for (const question of questions) {
        if (question.isNew) {
          const { id, isNew, ...questionData } = question;
          await supabase.from("questions").insert({
            ...questionData,
            options:
              question.question_type === "mcq"
                ? (Array.isArray(question.options)
                    ? question.options
                    : []
                  ).filter((opt: string) => opt.trim())
                : null,
            correct_answers:
              question.question_type === "mcq"
                ? Array.isArray(question.correct_answers)
                  ? question.correct_answers.filter((v: string) => v.trim())
                  : []
                : question.question_type === "single_answer" ||
                  question.question_type === "text_free"
                ? Array.isArray(question.correct_answers)
                  ? question.correct_answers.filter((v: string) => v.trim())
                  : []
                : null,
          });
        } else {
          const { isNew, ...questionData } = question;
          await supabase
            .from("questions")
            .update({
              question_text: questionData.question_text,
              question_type: questionData.question_type,
              correct_answer: questionData.correct_answer,
              correct_answers:
                questionData.question_type === "mcq"
                  ? Array.isArray(questionData.correct_answers)
                    ? questionData.correct_answers.filter((v: string) =>
                        v.trim()
                      )
                    : []
                  : questionData.question_type === "single_answer" ||
                    questionData.question_type === "text_free"
                  ? Array.isArray(questionData.correct_answers)
                    ? questionData.correct_answers.filter((v: string) =>
                        v.trim()
                      )
                    : []
                  : null,
              options:
                questionData.question_type === "mcq"
                  ? (Array.isArray(questionData.options)
                      ? questionData.options
                      : []
                    ).filter((opt: string) => opt.trim())
                  : null,
              image_url: questionData.image_url,
              option_images: questionData.option_images || null,
              points: questionData.points,
              order_index: questionData.order_index,
            })
            .eq("id", question.id);
        }
      }

      alert(t("editQuiz.updateSuccess"));
      onNavigate("quizzes");
    } catch (err: any) {
      setError(err.message || t("editQuiz.updateError"));
    } finally {
      setSaving(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    return t(`quizzes.category.${cat}` as any);
  };

  const getDifficultyLabel = (diff: string) => {
    return t(`quizzes.difficulty.${diff}` as any);
  };

  const getQuestionTypeLabel = (type: string) => {
    return t(`editQuiz.questionType.${type}` as any);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("editQuiz.loadingQuiz")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => onNavigate("quizzes")}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        {t("editQuiz.backToQuizzes")}
      </button>

      <div className="bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {t("editQuiz.title")}
        </h1>
        <p className="text-gray-600 mb-8">{t("editQuiz.subtitle")}</p>

        {error && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">⚠️ Erreur</h3>
                <button
                  onClick={() => setError("")}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => setError("")}
                className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {t("editQuiz.quizInfo")}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("editQuiz.quizTitle")} *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder={t("editQuiz.titlePlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("editQuiz.description")}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder={t("editQuiz.descriptionPlaceholder")}
                />
              </div>

              <ImageDropzone
                currentImageUrl={coverImageUrl}
                onImageUploaded={(url) => setCoverImageUrl(url)}
                bucketName="quiz-images"
              />

              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("createQuiz.searchTags")}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder={t("createQuiz.addTagPlaceholder")}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium flex items-center gap-2"
                      >
                        #{tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-emerald-700 hover:text-emerald-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {t("createQuiz.maxTags")} • {tags.length}/10
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("editQuiz.language")} *
                  </label>
                  <select
                    value={quizLanguage}
                    onChange={(e) =>
                      setQuizLanguage(e.target.value as Language)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    {Object.entries(languageNames).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("createQuiz.quizType")}
                  </label>
                  <select
                    value={selectedQuizType}
                    onChange={(e) => setSelectedQuizType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="">{t("createQuiz.noType")}</option>
                    {quizTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("editQuiz.category")} *
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as QuizCategory)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="flags">{getCategoryLabel("flags")}</option>
                    <option value="capitals">
                      {getCategoryLabel("capitals")}
                    </option>
                    <option value="maps">{getCategoryLabel("maps")}</option>
                    <option value="borders">
                      {getCategoryLabel("borders")}
                    </option>
                    <option value="regions">
                      {getCategoryLabel("regions")}
                    </option>
                    <option value="mixed">{getCategoryLabel("mixed")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("editQuiz.difficulty")} *
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) =>
                      setDifficulty(e.target.value as Difficulty)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    {difficulties.length > 0 ? (
                      difficulties.map((diff) => (
                        <option key={diff.name} value={diff.name}>
                          {diff.label}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="easy">
                          {getDifficultyLabel("easy")}
                        </option>
                        <option value="medium">
                          {getDifficultyLabel("medium")}
                        </option>
                        <option value="hard">
                          {getDifficultyLabel("hard")}
                        </option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("editQuiz.timePerQuestion")}
                </label>
                <input
                  type="number"
                  value={timeLimitSeconds}
                  onChange={(e) =>
                    setTimeLimitSeconds(parseInt(e.target.value) || 30)
                  }
                  min="5"
                  max="120"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="space-y-3 border-t pt-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={randomizeQuestions}
                    onChange={(e) => setRandomizeQuestions(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700">
                    {t("createQuiz.randomizeQuestions")}
                  </span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={randomizeAnswers}
                    onChange={(e) => setRandomizeAnswers(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700">
                    {t("createQuiz.randomizeAnswers")}
                  </span>
                </label>
              </div>

              {quiz && (quiz.is_public || quiz.is_global) && (
                <div className="border-t pt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-blue-800">
                      Statut actuel :{" "}
                      {quiz.is_global
                        ? "✅ Quiz public validé"
                        : quiz.pending_validation
                        ? "⏳ En attente de validation"
                        : "📤 Publié"}
                    </p>
                  </div>
                  <button
                    onClick={makeQuizPrivate}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    🔒 Rendre privé
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {t("editQuiz.questions")} ({questions.length})
              </h2>
              <button
                onClick={addNewQuestion}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>{t("editQuiz.addQuestion")}</span>
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  {editingQuestion?.id === question.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t("editQuiz.question")} *
                        </label>
                        <input
                          type="text"
                          value={editingQuestion.question_text}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion,
                              question_text: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <ImageDropzone
                        currentImageUrl={editingQuestion.image_url || ""}
                        onImageUploaded={(url) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            image_url: url,
                          })
                        }
                        bucketName="quiz-images"
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t("editQuiz.questionType.label")}
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
                            <option value="mcq">
                              {getQuestionTypeLabel("mcq")}
                            </option>
                            <option value="true_false">
                              {t("createQuiz.trueFalse.type")}
                            </option>
                            <option value="single_answer">
                              {getQuestionTypeLabel("single_answer")}
                            </option>
                            <option value="text_free">
                              {getQuestionTypeLabel("text_free")}
                            </option>
                            <option value="map_click">
                              {getQuestionTypeLabel("map_click")}
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t("editQuiz.points")}
                          </label>
                          <input
                            type="number"
                            value={editingQuestion.points}
                            onChange={(e) => {
                              let value = parseInt(e.target.value) || 10;
                              if (value > 500) value = 500;
                              if (value < 10) value = 10;
                              setEditingQuestion({
                                ...editingQuestion,
                                points: value,
                              });
                            }}
                            min="10"
                            max="500"
                            step="10"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                          />
                          {editingQuestion.points > 500 && (
                            <p className="text-xs text-red-600 mt-1">
                              Max 500 points par question
                            </p>
                          )}
                        </div>
                      </div>

                      {editingQuestion.question_type === "true_false" && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-800 mb-3">
                            {t("createQuiz.trueFalse.description")}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() =>
                                setEditingQuestion({
                                  ...editingQuestion,
                                  correct_answer: t(
                                    "createQuiz.trueFalse.true"
                                  ),
                                })
                              }
                              className={`p-3 rounded-lg border-2 font-medium transition-all ${
                                editingQuestion.correct_answer ===
                                t("createQuiz.trueFalse.true")
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                  : "border-gray-300 hover:border-emerald-300"
                              }`}
                            >
                              ✓ {t("createQuiz.trueFalse.true")}
                            </button>
                            <button
                              onClick={() =>
                                setEditingQuestion({
                                  ...editingQuestion,
                                  correct_answer: t(
                                    "createQuiz.trueFalse.false"
                                  ),
                                })
                              }
                              className={`p-3 rounded-lg border-2 font-medium transition-all ${
                                editingQuestion.correct_answer ===
                                t("createQuiz.trueFalse.false")
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                  : "border-gray-300 hover:border-emerald-300"
                              }`}
                            >
                              ✗ {t("createQuiz.trueFalse.false")}
                            </button>
                          </div>
                        </div>
                      )}
                      {editingQuestion.question_type === "mcq" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t("editQuiz.options")}
                          </label>
                          <div className="space-y-3">
                            {(Array.isArray(editingQuestion.options)
                              ? editingQuestion.options
                              : ["", "", "", ""]
                            ).map((option: string, idx: number) => (
                              <div key={idx} className="space-y-2">
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) =>
                                    updateOption(idx, e.target.value)
                                  }
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                  placeholder={`${t("editQuiz.option")} ${
                                    idx + 1
                                  }`}
                                />
                                {option.trim() && (
                                  <ImageDropzone
                                    currentImageUrl={
                                      editingQuestion.option_images?.[option] ||
                                      ""
                                    }
                                    onImageUploaded={(url) =>
                                      updateOptionImage(option, url)
                                    }
                                    bucketName="quiz-images"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t("editQuiz.correctAnswer")} *
                        </label>
                        {editingQuestion.question_type === "mcq" ? (
                          <div className="space-y-2">
                            <div className="space-y-2">
                              {(Array.isArray(editingQuestion.options)
                                ? editingQuestion.options
                                : []
                              )
                                .filter((opt: string) => opt.trim())
                                .map((option: string, idx: number) => {
                                  const isSelected = (
                                    editingQuestion.correct_answers || []
                                  ).includes(option);

                                  return (
                                    <label
                                      key={idx}
                                      className={`flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                        isSelected
                                          ? "border-emerald-500 bg-emerald-50"
                                          : "border-gray-200 hover:border-gray-300"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          const answers =
                                            editingQuestion.correct_answers ||
                                            [];
                                          if (e.target.checked) {
                                            setEditingQuestion({
                                              ...editingQuestion,
                                              correct_answers: [
                                                ...answers,
                                                option,
                                              ],
                                              correct_answer: option,
                                            });
                                          } else {
                                            const newAnswers = answers.filter(
                                              (a: string) => a !== option
                                            );
                                            setEditingQuestion({
                                              ...editingQuestion,
                                              correct_answers: newAnswers,
                                              correct_answer:
                                                newAnswers[0] || "",
                                            });
                                          }
                                        }}
                                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                      />
                                      <span
                                        className={`font-medium ${
                                          isSelected
                                            ? "text-emerald-700"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        {option}
                                        {isSelected && " ✓"}
                                      </span>
                                    </label>
                                  );
                                })}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              {t("createQuiz.multipleCorrect")}
                            </p>
                          </div>
                        ) : editingQuestion.question_type !== "true_false" ? (
                          <input
                            type="text"
                            value={editingQuestion.correct_answer}
                            onChange={(e) =>
                              setEditingQuestion({
                                ...editingQuestion,
                                correct_answer: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                          />
                        ) : null}
                      </div>

                      {(editingQuestion.question_type === "single_answer" ||
                        editingQuestion.question_type === "text_free") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t("createQuiz.variants")}
                          </label>
                          <div className="space-y-2">
                            {(editingQuestion.correct_answers || []).map(
                              (variant: string, index: number) => (
                                <div key={index} className="flex space-x-2">
                                  <input
                                    type="text"
                                    value={variant}
                                    onChange={(e) =>
                                      updateVariant(index, e.target.value)
                                    }
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                    placeholder={t(
                                      "createQuiz.variantPlaceholder"
                                    ).replace("{number}", String(index + 1))}
                                  />
                                  <button
                                    onClick={() => removeVariant(index)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                              )
                            )}
                            <button
                              onClick={addVariant}
                              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                            >
                              + {t("createQuiz.addVariant")}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {t("createQuiz.variantsDesc")}
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-3 pt-4">
                        <button
                          onClick={saveQuestion}
                          className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                        >
                          {t("common.save")}
                        </button>
                        <button
                          onClick={cancelEditingQuestion}
                          className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                          {t("common.cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 mb-2">
                          {index + 1}. {question.question_text}
                        </p>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          {question.image_url && (
                            <span className="text-blue-600">
                              📷 {t("editQuiz.imageIncluded")}
                            </span>
                          )}
                          <span>
                            {getQuestionTypeLabel(question.question_type)}
                          </span>
                          <span>
                            {question.points} {t("home.pts")}
                          </span>
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

          <div className="flex space-x-4 pt-6">
            <button
              onClick={() => onNavigate("quizzes")}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={saveQuiz}
              disabled={saving}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? t("editQuiz.saving") : t("editQuiz.saveChanges")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
