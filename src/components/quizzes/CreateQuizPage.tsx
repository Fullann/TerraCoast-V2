import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { languageNames, Language } from "../../i18n/translations";
import { Plus, Trash2, Save, ArrowLeft, Image, Edit, X } from "lucide-react";
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
type QuizType = Database["public"]["Tables"]["quiz_types"]["Row"];

interface Question {
  question_text: string;
  question_type: QuestionType;
  correct_answer: string;
  correct_answers?: string[];
  options: string[];
  image_url?: string;
  option_images?: Record<string, string>;
  points: number;
  order_index: number;
}

interface CreateQuizPageProps {
  onNavigate: (view: string) => void;
}

export function CreateQuizPage({ onNavigate }: CreateQuizPageProps) {
  const { profile } = useAuth();
  const { language: userLanguage } = useLanguage();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<QuizCategory>("capitals");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [quizLanguage, setQuizLanguage] = useState<Language>(userLanguage);
  const [categories, setCategories] = useState<
    { name: string; label: string }[]
  >([]);
  const [difficulties, setDifficulties] = useState<
    { name: string; label: string }[]
  >([]);
  const [quizTypes, setQuizTypes] = useState<QuizType[]>([]);
  const [selectedQuizType, setSelectedQuizType] = useState<string>("");
  const [isPublic, setIsPublic] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(30);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeAnswers, setRandomizeAnswers] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const loadOptions = async () => {
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("name, label")
        .order("label");
      const { data: difficultiesData } = await supabase
        .from("difficulties")
        .select("name, label")
        .order("multiplier");
      const { data: quizTypesData } = await supabase
        .from("quiz_types")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (categoriesData && categoriesData.length > 0) {
        setCategories(categoriesData);
        setCategory(categoriesData[0].name as QuizCategory);
      }
      if (difficultiesData && difficultiesData.length > 0) {
        setDifficulties(difficultiesData);
        setDifficulty(difficultiesData[0].name as Difficulty);
      }
      if (quizTypesData) {
        setQuizTypes(quizTypesData);
      }
    };
    loadOptions();
  }, []);

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question_text: "",
    question_type: "mcq",
    correct_answer: "",
    correct_answers: [],
    options: ["", "", "", ""],
    image_url: "",
    option_images: {},
    points: 100,
    order_index: 0,
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addQuestion = () => {
    if (!currentQuestion.question_text.trim()) {
      setError("La question ne peut pas être vide");
      return;
    }

    if (!currentQuestion.correct_answer.trim()) {
      setError("La réponse correcte ne peut pas être vide");
      return;
    }

    if (currentQuestion.question_type === "mcq") {
      const validOptions = currentQuestion.options.filter((opt) => opt.trim());
      if (validOptions.length < 2) {
        setError("Il faut au moins 2 options pour un QCM");
        return;
      }
      if (!validOptions.includes(currentQuestion.correct_answer)) {
        setError("La réponse correcte doit être dans les options");
        return;
      }
    }

    if (editingIndex !== null) {
      const updatedQuestions = [...questions];
      updatedQuestions[editingIndex] = {
        ...currentQuestion,
        order_index: editingIndex,
      };
      setQuestions(updatedQuestions);
      setEditingIndex(null);
    } else {
      setQuestions([
        ...questions,
        { ...currentQuestion, order_index: questions.length },
      ]);
    }

    setCurrentQuestion({
      question_text: "",
      question_type: "mcq",
      correct_answer: "",
      correct_answers: [],
      options: ["", "", "", ""],
      image_url: "",
      option_images: {},
      points: 100,
      order_index: 0,
    });
    setError("");
  };

  const editQuestion = (index: number) => {
    setCurrentQuestion(questions[index]);
    setEditingIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setCurrentQuestion({
      question_text: "",
      question_type: "mcq",
      correct_answer: "",
      correct_answers: [],
      options: ["", "", "", ""],
      image_url: "",
      option_images: {},
      points: 100,
      order_index: 0,
    });
    setEditingIndex(null);
    setError("");
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const updateOptionImage = (optionText: string, imageUrl: string) => {
    const newOptionImages = { ...(currentQuestion.option_images || {}) };
    if (imageUrl.trim()) {
      newOptionImages[optionText] = imageUrl;
    } else {
      delete newOptionImages[optionText];
    }
    setCurrentQuestion({ ...currentQuestion, option_images: newOptionImages });
  };

  const saveQuiz = async () => {
    if (!profile) return;

    if (!title.trim()) {
      setError("Le titre ne peut pas être vide");
      return;
    }

    if (questions.length === 0) {
      setError("Ajoutez au moins une question");
      return;
    }

    if (isPublic && profile.published_quiz_count >= 10) {
      setError("Vous avez atteint la limite de 10 quiz publics");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const isGlobal = profile.role === "admin" && isPublic;

      const quizData: any = {
        creator_id: profile.id,
        title,
        description,
        category,
        difficulty,
        time_limit_seconds: timeLimitSeconds,
        cover_image_url: coverImageUrl || null,
        randomize_questions: randomizeQuestions,
        randomize_answers: randomizeAnswers,
        language: quizLanguage,
        quiz_type_id: selectedQuizType || null,
      };

      if (profile.role === "admin") {
        quizData.is_public = isPublic;
        quizData.is_global = isGlobal;
        quizData.validation_status = "approved";
        quizData.pending_validation = false;
        quizData.published_at = isPublic ? new Date().toISOString() : null;
      } else if (isPublic) {
        quizData.is_public = false;
        quizData.validation_status = "pending";
        quizData.pending_validation = true;
        quizData.published_at = null;
      } else {
        quizData.is_public = false;
        quizData.validation_status = "approved";
        quizData.pending_validation = false;
        quizData.published_at = null;
      }

      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert(quizData)
        .select()
        .single();

      if (quizError) throw quizError;

      const questionsToInsert = questions.map((q) => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        question_type: q.question_type,
        correct_answer: q.correct_answer,
        correct_answers:
          q.correct_answers && q.correct_answers.length > 0
            ? q.correct_answers
            : null,
        options:
          q.question_type === "mcq"
            ? q.options.filter((opt) => opt.trim())
            : null,
        image_url: q.image_url || null,
        option_images:
          q.option_images && Object.keys(q.option_images).length > 0
            ? q.option_images
            : null,
        points: q.points,
        order_index: q.order_index,
      }));

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      if (isPublic) {
        await supabase
          .from("profiles")
          .update({ published_quiz_count: profile.published_quiz_count + 1 })
          .eq("id", profile.id);
      }

      alert("Quiz créé avec succès!");
      onNavigate("quizzes");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du quiz");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => onNavigate("quizzes")}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour aux quiz
        </button>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Créer un quiz</h1>
        <p className="text-gray-600">Créez votre propre quiz de géographie</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Informations du quiz
        </h2>

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
            <ImageDropzone
              label="Image de couverture"
              currentImageUrl={coverImageUrl}
              onImageUploaded={(url) => setCoverImageUrl(url)}
              bucketName="quiz-images"
            />
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
                  <option key={code} value={code}>
                    {name}
                  </option>
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
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.label}
                  </option>
                ))}
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
                {difficulties.map((diff) => (
                  <option key={diff.name} value={diff.name}>
                    {diff.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de quiz
              </label>
              <select
                value={selectedQuizType}
                onChange={(e) => setSelectedQuizType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="">Aucun type</option>
                {quizTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temps par question (sec)
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
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="randomizeQuestions"
                checked={randomizeQuestions}
                onChange={(e) => setRandomizeQuestions(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label
                htmlFor="randomizeQuestions"
                className="text-sm text-gray-700"
              >
                Mélanger l'ordre des questions
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="randomizeAnswers"
                checked={randomizeAnswers}
                onChange={(e) => setRandomizeAnswers(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label
                htmlFor="randomizeAnswers"
                className="text-sm text-gray-700"
              >
                Mélanger l'ordre des réponses (QCM)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-700">
                {profile?.role === "admin"
                  ? "Quiz public - En tant qu'admin, ce sera un quiz global approuvé immédiatement"
                  : `Soumettre pour validation (${
                      profile?.published_quiz_count || 0
                    }/10 quiz publiés)`}
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Ajouter une question
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question *
            </label>
            <input
              type="text"
              value={currentQuestion.question_text}
              onChange={(e) =>
                setCurrentQuestion({
                  ...currentQuestion,
                  question_text: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              placeholder="Ex: Quelle est la capitale de la France?"
            />
          </div>

          <div>
            <div className="flex space-x-2">
              <ImageDropzone
                label="Image de la question (optionnel)"
                currentImageUrl={currentQuestion.image_url || ""}
                onImageUploaded={(url) =>
                  setCurrentQuestion({ ...currentQuestion, image_url: url })
                }
                bucketName="quiz-images"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Ajoutez une image pour illustrer votre question
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de question *
              </label>
              <select
                value={currentQuestion.question_type}
                onChange={(e) => {
                  const newType = e.target.value as QuestionType;
                  if (newType === "true_false") {
                    setCurrentQuestion({
                      ...currentQuestion,
                      question_type: newType,
                      options: ["Vrai", "Faux"],
                      correct_answer: "Vrai",
                    });
                  } else {
                    setCurrentQuestion({
                      ...currentQuestion,
                      question_type: newType,
                    });
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="mcq">QCM (Choix multiples)</option>
                <option value="single_answer">Réponse unique</option>
                <option value="text_free">Texte libre</option>
                <option value="true_false">Vrai / Faux</option>
                <option value="map_click">Clic sur carte</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Points
              </label>
              <input
                type="number"
                value={currentQuestion.points}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
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

          {currentQuestion.question_type === "true_false" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                Pour les questions Vrai/Faux, les options sont automatiquement
                définies. Sélectionnez simplement la bonne réponse ci-dessous.
              </p>
            </div>
          )}

          {currentQuestion.question_type === "mcq" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options (2 minimum)
              </label>
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="space-y-1">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      placeholder={`Option ${index + 1}`}
                    />
                    {option.trim() && (
                      <ImageDropzone
                        label={`Image pour "${option}"`}
                        currentImageUrl={
                          currentQuestion.option_images?.[option] || ""
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
              <p className="text-xs text-gray-500 mt-2">
                Ajoutez des images pour chaque option (ex: drapeaux). Parfait
                pour les quiz visuels!
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Réponse(s) correcte(s) *
            </label>
            {currentQuestion.question_type === "true_false" ? (
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      correct_answer: "Vrai",
                    })
                  }
                  className={`p-4 rounded-lg border-2 transition-all font-medium ${
                    currentQuestion.correct_answer === "Vrai"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                >
                  ✓ Vrai
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      correct_answer: "Faux",
                    })
                  }
                  className={`p-4 rounded-lg border-2 transition-all font-medium ${
                    currentQuestion.correct_answer === "Faux"
                      ? "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 hover:border-red-300"
                  }`}
                >
                  ✗ Faux
                </button>
              </div>
            ) : currentQuestion.question_type === "mcq" ? (
              <div className="space-y-2">
                <div className="space-y-2">
                  {currentQuestion.options
                    .filter((opt) => opt.trim())
                    .map((option, index) => (
                      <label
                        key={index}
                        className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={(
                            currentQuestion.correct_answers || []
                          ).includes(option)}
                          onChange={(e) => {
                            const answers =
                              currentQuestion.correct_answers || [];
                            if (e.target.checked) {
                              setCurrentQuestion({
                                ...currentQuestion,
                                correct_answers: [...answers, option],
                                correct_answer: option,
                              });
                            } else {
                              const newAnswers = answers.filter(
                                (a) => a !== option
                              );
                              setCurrentQuestion({
                                ...currentQuestion,
                                correct_answers: newAnswers,
                                correct_answer: newAnswers[0] || "",
                              });
                            }
                          }}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                </div>
                <p className="text-xs text-gray-500">
                  Sélectionne une ou plusieurs réponses correctes (ex: Capitales
                  d'Afrique du Sud)
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={currentQuestion.correct_answer}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      correct_answer: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Ex: Paris"
                />

                {(currentQuestion.question_type === "text_free" ||
                  currentQuestion.question_type === "single_answer") && (
                  <>
                    <p className="text-xs text-gray-600 font-medium">
                      Variantes acceptées (optionnel)
                    </p>
                    {(currentQuestion.correct_answers || []).map(
                      (variant, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="text"
                            value={variant}
                            onChange={(e) => {
                              const newAnswers = [
                                ...(currentQuestion.correct_answers || []),
                              ];
                              newAnswers[index] = e.target.value;
                              setCurrentQuestion({
                                ...currentQuestion,
                                correct_answers: newAnswers,
                              });
                            }}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                            placeholder={`Variante ${
                              index + 1
                            } (ex: paris, PARIS)`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newAnswers = (
                                currentQuestion.correct_answers || []
                              ).filter((_, i) => i !== index);
                              setCurrentQuestion({
                                ...currentQuestion,
                                correct_answers: newAnswers,
                              });
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const newAnswers = [
                          ...(currentQuestion.correct_answers || []),
                          "",
                        ];
                        setCurrentQuestion({
                          ...currentQuestion,
                          correct_answers: newAnswers,
                        });
                      }}
                      className="px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter une variante
                    </button>
                    <p className="text-xs text-gray-500">
                      Ajoutez plusieurs variantes acceptées (ex: "Paris",
                      "paris", "La capitale de la France")
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {editingIndex !== null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
              <p className="text-blue-700 font-medium">
                Modification de la question #{editingIndex + 1}
              </p>
              <button
                onClick={cancelEdit}
                className="px-3 py-1 text-blue-600 hover:bg-blue-100 rounded transition-colors flex items-center text-sm"
              >
                <X className="w-4 h-4 mr-1" />
                Annuler
              </button>
            </div>
          )}

          <div className="flex space-x-3">
            {editingIndex !== null && (
              <button
                onClick={cancelEdit}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center"
              >
                <X className="w-5 h-5 mr-2" />
                Annuler
              </button>
            )}
            <button
              onClick={addQuestion}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center"
            >
              {editingIndex !== null ? (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Mettre à jour
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Ajouter cette question
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Questions ajoutées ({questions.length})
          </h2>

          <div className="space-y-3">
            {questions.map((q, index) => (
              <div
                key={index}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 mb-1">
                      {index + 1}. {q.question_text}
                    </p>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {q.question_type === "mcq" && "QCM"}
                        {q.question_type === "single_answer" &&
                          "Réponse unique"}
                        {q.question_type === "text_free" && "Texte libre"}
                        {q.question_type === "true_false" && "Vrai / Faux"}
                        {q.question_type === "map_click" && "Clic sur carte"}
                      </span>
                      <span>{q.points} pts</span>
                    </div>
                    <p className="text-sm text-emerald-700 mt-2">
                      Réponse: {q.correct_answer}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => editQuestion(index)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => removeQuestion(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          onClick={() => onNavigate("quizzes")}
          className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          Annuler
        </button>
        <button
          onClick={saveQuiz}
          disabled={saving || questions.length === 0}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? "Enregistrement..." : "Enregistrer le quiz"}
        </button>
      </div>
    </div>
  );
}
