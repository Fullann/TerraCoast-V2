import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Clock, CheckCircle, XCircle, Trophy, ArrowLeft } from "lucide-react";
import type { Database } from "../../lib/database.types";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type Question = Database["public"]["Tables"]["questions"]["Row"];

interface PlayQuizPageProps {
  quizId: string;
  mode?: "solo" | "duel";
  duelId?: string;
  trainingMode?: boolean;
  questionCount?: number;
  onNavigate: (view: string) => void;
}

export function PlayQuizPage({
  quizId,
  mode = "solo",
  duelId,
  trainingMode = false,
  questionCount,
  onNavigate,
}: PlayQuizPageProps) {
  const { profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<
    {
      question_id: string;
      user_answer: string;
      is_correct: boolean;
      time_taken: number;
      points_earned: number;
    }[]
  >([]);
  const [showResult, setShowResult] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const isCompletingRef = useRef(false);
  const isCreatingSessionRef = useRef(false);
  const hasTimedOutRef = useRef(false);

  useEffect(() => {
    console.log("[useEffect-loadQuiz] Loading quiz:", quizId);
    isCompletingRef.current = false;
    isCreatingSessionRef.current = false;
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    console.log(
      "[useEffect-session] quiz:",
      !!quiz,
      "questions:",
      questions.length,
      "sessionId:",
      !!sessionId,
      "gameComplete:",
      gameComplete,
      "isCreatingSession:",
      isCreatingSessionRef.current
    );
    if (
      quiz &&
      questions.length > 0 &&
      !sessionId &&
      !gameComplete &&
      !isCreatingSessionRef.current
    ) {
      console.log("[useEffect-session] Creating new session");
      isCreatingSessionRef.current = true;
      createSession();
    }
  }, [quiz, questions, gameComplete]);

  const saveAnswer = async (answerData: any) => {
    if (!sessionId) return;

    await supabase.from("game_answers").insert({
      session_id: sessionId,
      question_id: answerData.question_id,
      user_answer: answerData.user_answer,
      is_correct: answerData.is_correct,
      time_taken_seconds: answerData.time_taken,
      points_earned: answerData.points_earned,
    });
  };

  const moveToNextQuestion = () => {
    console.log(
      "[moveToNextQuestion] Called. gameComplete:",
      gameComplete,
      "currentQuestionIndex:",
      currentQuestionIndex,
      "questions.length:",
      questions.length
    );

    if (gameComplete) {
      console.log("[moveToNextQuestion] Game already complete, exiting");
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      console.log("[moveToNextQuestion] Moving to next question");
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer("");
      setSelectedOption("");
      setShowResult(false);
      setIsAnswered(false);
      setTimeLeft(quiz?.time_limit_seconds || 30);
      setQuestionStartTime(Date.now());
      hasTimedOutRef.current = false;
    } else {
      console.log(
        "[moveToNextQuestion] Last question reached, calling completeGame"
      );
      completeGame();
    }
  };

  const handleTimeout = useCallback(() => {
    console.log(
      "[handleTimeout] Called. isAnswered:",
      isAnswered,
      "gameComplete:",
      gameComplete,
      "hasTimedOut:",
      hasTimedOutRef.current
    );

    if (isAnswered || gameComplete || hasTimedOutRef.current) return;

    hasTimedOutRef.current = true;

    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
    const currentQuestion = questions[currentQuestionIndex];

    if (!currentQuestion) return;

    const answerData = {
      question_id: currentQuestion.id,
      user_answer: "",
      is_correct: false,
      time_taken: timeTaken,
      points_earned: 0,
    };

    setAnswers((prev) => [...prev, answerData]);
    setIsAnswered(true);

    saveAnswer(answerData);

    console.log("[handleTimeout] Setting timeout to move to next question");
    setTimeout(() => {
      hasTimedOutRef.current = false;
      moveToNextQuestion();
    }, 100);
  }, [
    isAnswered,
    gameComplete,
    questionStartTime,
    questions,
    currentQuestionIndex,
    sessionId,
  ]);

  useEffect(() => {
    if (gameComplete || isAnswered || trainingMode) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    currentQuestionIndex,
    isAnswered,
    gameComplete,
    trainingMode,
    handleTimeout,
  ]);

  const loadQuiz = async () => {
    const { data: quizData } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single();

    if (quizData) {
      setQuiz(quizData);
      setTimeLeft(quizData.time_limit_seconds || 30);

      const { data: questionsData } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_index");

      if (questionsData) {
        let processedQuestions = [...questionsData];

        if (trainingMode || quizData.randomize_questions) {
          processedQuestions = processedQuestions.sort(
            () => Math.random() - 0.5
          );
        }
        if (trainingMode && questionCount && questionCount > 0) {
          processedQuestions = processedQuestions.slice(0, questionCount);
        }

        if (quizData.randomize_answers) {
          processedQuestions = processedQuestions.map((q) => ({
            ...q,
            options: q.options
              ? [...q.options].sort(() => Math.random() - 0.5)
              : q.options,
          }));
        }

        setQuestions(processedQuestions);
      }
    }
  };

  const createSession = async () => {
    console.log("[createSession] Starting session creation");
    if (!profile || trainingMode) {
      console.log("[createSession] Skipping (no profile or training mode)");
      isCreatingSessionRef.current = false;
      return;
    }

    const { data: session, error } = await supabase
      .from("game_sessions")
      .insert({
        quiz_id: quizId,
        player_id: profile.id,
        mode,
      })
      .select()
      .single();

    if (error) {
      console.error("[createSession] Error creating session:", error);
      isCreatingSessionRef.current = false;
      return;
    }

    if (session) {
      console.log("[createSession] Session created:", session.id);
      setSessionId(session.id);
      isCreatingSessionRef.current = false;
    }
  };

  const calculatePoints = (timeTaken: number, basePoints: number): number => {
    const timeLimit = quiz?.time_limit_seconds || 30;
    const speedBonus = Math.max(0, 1 - timeTaken / timeLimit) * 0.5;
    return Math.round(basePoints * (1 + speedBonus));
  };

  const handleSubmitAnswer = () => {
    if (isAnswered || gameComplete) return;

    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
    const currentQuestion = questions[currentQuestionIndex];
    const answer =
      currentQuestion.question_type === "mcq" ||
      currentQuestion.question_type === "true_false"
        ? selectedOption
        : userAnswer;

    if (!answer.trim()) {
      alert(t("playQuiz.selectAnswer"));
      return;
    }

    const correctAnswers =
      currentQuestion.correct_answers &&
      currentQuestion.correct_answers.length > 0
        ? [currentQuestion.correct_answer, ...currentQuestion.correct_answers]
        : [currentQuestion.correct_answer];

    const isCorrect = correctAnswers.some(
      (ca) => answer.toLowerCase().trim() === ca.toLowerCase().trim()
    );
    const pointsEarned = isCorrect
      ? calculatePoints(timeTaken, currentQuestion.points)
      : 0;

    const answerData = {
      question_id: currentQuestion.id,
      user_answer: answer,
      is_correct: isCorrect,
      time_taken: timeTaken,
      points_earned: pointsEarned,
    };

    setAnswers([...answers, answerData]);
    setTotalScore(totalScore + pointsEarned);
    setShowResult(true);
    setIsAnswered(true);

    saveAnswer(answerData);

    setTimeout(() => {
      moveToNextQuestion();
    }, 1500);
  };

  const completeGame = async () => {
    console.log(
      "[completeGame] Called. gameComplete:",
      gameComplete,
      "isCompletingRef:",
      isCompletingRef.current
    );

    if (gameComplete || isCompletingRef.current) {
      console.log("[completeGame] Already completing or complete, exiting");
      return;
    }

    console.log("[completeGame] Starting game completion");
    isCompletingRef.current = true;
    setGameComplete(true);

    if (trainingMode) {
      return;
    }

    if (!sessionId || !profile) return;

    const correctAnswers =
      answers.filter((a) => a.is_correct).length +
      (answers[answers.length - 1]?.is_correct ? 1 : 0);
    const accuracy = (correctAnswers / questions.length) * 100;
    const totalTime = answers.reduce((sum, a) => sum + a.time_taken, 0);

    const normalizedScore = Math.min(
      100,
      Math.round((totalScore / (questions.length * 150)) * 100)
    );

    await supabase
      .from("game_sessions")
      .update({
        score: normalizedScore,
        accuracy_percentage: accuracy,
        time_taken_seconds: totalTime,
        completed: true,
        completed_at: new Date().toISOString(),
        correct_answers: correctAnswers,
        total_questions: questions.length,
      })
      .eq("id", sessionId);

    if (mode === "duel" && duelId) {
      await updateDuel();
    }

    const shouldGiveXP = (quiz?.is_public || quiz?.is_global) && !trainingMode;
    let earnedXP = 0;

    if (shouldGiveXP) {
      earnedXP = Math.round(normalizedScore / 10);
      setXpGained(earnedXP);
      const newXP = profile.experience_points + earnedXP;
      const newLevel = Math.floor(newXP / 1000) + 1;

      const currentMonth = new Date().toISOString().slice(0, 7);
      const needsReset = profile.last_reset_month !== currentMonth;

      await supabase
        .from("profiles")
        .update({
          experience_points: newXP,
          level: newLevel,
          monthly_score: needsReset
            ? normalizedScore
            : (profile.monthly_score || 0) + normalizedScore,
          monthly_games_played: needsReset
            ? 1
            : (profile.monthly_games_played || 0) + 1,
          last_reset_month: currentMonth,
        })
        .eq("id", profile.id);

      if (needsReset && profile.last_reset_month) {
        await recordMonthlyRanking(profile.last_reset_month);
      }
    } else {
      setXpGained(0);
    }

    await supabase
      .from("quizzes")
      .update({
        total_plays: (quiz?.total_plays || 0) + 1,
        average_score:
          ((quiz?.average_score || 0) * (quiz?.total_plays || 0) +
            normalizedScore) /
          ((quiz?.total_plays || 0) + 1),
      })
      .eq("id", quizId);

    if (shouldGiveXP) {
      await checkAndAwardBadges(profile.level);
    }
    await refreshProfile();
  };

  const updateDuel = async () => {
    if (!duelId || !sessionId || !profile) return;

    const { data: duel } = await supabase
      .from("duels")
      .select("*")
      .eq("id", duelId)
      .single();

    if (!duel) return;

    const isPlayer1 = duel.player1_id === profile.id;
    const updateField = isPlayer1 ? "player1_session_id" : "player2_session_id";
    const otherPlayerSessionField = isPlayer1
      ? "player2_session_id"
      : "player1_session_id";

    const updates: any = { [updateField]: sessionId };

    if (duel[otherPlayerSessionField]) {
      const { data: otherSession } = await supabase
        .from("game_sessions")
        .select("score")
        .eq("id", duel[otherPlayerSessionField])
        .single();

      const { data: mySession } = await supabase
        .from("game_sessions")
        .select("score")
        .eq("id", sessionId)
        .single();

      if (otherSession && mySession) {
        let winnerId = null;
        if (mySession.score > otherSession.score) {
          winnerId = profile.id;
        } else if (otherSession.score > mySession.score) {
          winnerId = isPlayer1 ? duel.player2_id : duel.player1_id;
        }

        updates.status = "completed";
        updates.winner_id = winnerId;
        updates.completed_at = new Date().toISOString();
      }
    }

    await supabase.from("duels").update(updates).eq("id", duelId);
  };

  const recordMonthlyRanking = async (lastMonth: string) => {
    const { data: topPlayers } = await supabase
      .from("profiles")
      .select("id, pseudo, monthly_score, top_10_count")
      .order("monthly_score", { ascending: false })
      .limit(10);

    if (topPlayers && topPlayers.length > 0) {
      for (let i = 0; i < topPlayers.length; i++) {
        const player = topPlayers[i];

        await supabase.from("monthly_rankings_history").upsert({
          user_id: player.id,
          month: lastMonth,
          final_rank: i + 1,
          final_score: player.monthly_score || 0,
        });

        await supabase
          .from("profiles")
          .update({
            top_10_count: (player.top_10_count || 0) + 1,
          })
          .eq("id", player.id);
      }
    }
  };

  const checkAndAwardBadges = async (level: number) => {
    if (!profile) return;

    const { data: badges } = await supabase
      .from("badges")
      .select("*")
      .eq("requirement_type", "level")
      .lte("requirement_value", level);

    if (badges) {
      for (const badge of badges) {
        const { data: existing } = await supabase
          .from("user_badges")
          .select("id")
          .eq("user_id", profile.id)
          .eq("badge_id", badge.id)
          .maybeSingle();

        if (!existing) {
          await supabase.from("user_badges").insert({
            user_id: profile.id,
            badge_id: badge.id,
          });
        }
      }
    }
  };

  if (!quiz || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("playQuiz.loadingQuiz")}</p>
        </div>
      </div>
    );
  }

  if (gameComplete) {
    const correctAnswers = answers.filter((a) => a.is_correct).length;
    const accuracy = (correctAnswers / questions.length) * 100;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="text-center mb-8">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {trainingMode
                ? t("playQuiz.trainingComplete")
                : t("playQuiz.quizComplete")}
            </h1>
            <p className="text-gray-600">
              {trainingMode
                ? t("playQuiz.trainingMessage")
                : t("playQuiz.congratsMessage")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {!trainingMode && (
              <>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white text-center">
                  <p className="text-emerald-100 text-sm mb-2">
                    {t("playQuiz.totalScore")}
                  </p>
                  <p className="text-4xl font-bold">{totalScore}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white text-center">
                  <p className="text-purple-100 text-sm mb-2">
                    {t("playQuiz.xpGained")}
                  </p>
                  <p className="text-4xl font-bold">+{xpGained}</p>
                </div>
              </>
            )}

            <div
              className={`bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white text-center ${
                trainingMode ? "md:col-span-1" : ""
              }`}
            >
              <p className="text-blue-100 text-sm mb-2">
                {t("playQuiz.accuracy")}
              </p>
              <p className="text-4xl font-bold">{Math.round(accuracy)}%</p>
            </div>

            <div
              className={`bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white text-center ${
                trainingMode ? "md:col-span-1" : ""
              }`}
            >
              <p className="text-amber-100 text-sm mb-2">
                {t("playQuiz.correctAnswers")}
              </p>
              <p className="text-4xl font-bold">
                {correctAnswers}/{questions.length}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t("playQuiz.summary")}
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {questions.map((question, index) => {
                const answer = answers[index];

                // Vérifier si la réponse est correcte (en tenant compte des variantes)
                const isCorrectAnswer =
                  answer?.is_correct ||
                  (answer?.user_answer &&
                    (question.correct_answers &&
                    question.correct_answers.length > 0
                      ? question.correct_answers.some(
                          (ca) =>
                            answer.user_answer.toLowerCase().trim() ===
                            ca.toLowerCase().trim()
                        )
                      : answer.user_answer.toLowerCase().trim() ===
                        question.correct_answer.toLowerCase().trim()));

                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrectAnswer
                        ? "border-green-300 bg-green-50"
                        : "border-red-300 bg-red-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-2">
                          {index + 1}. {question.question_text}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("playQuiz.yourAnswer")}:{" "}
                          <span className="font-medium">
                            {answer?.user_answer || t("playQuiz.noAnswer")}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("playQuiz.correctAnswer")}:{" "}
                          <span className="font-medium text-emerald-600">
                            {question.correct_answer}
                          </span>
                          {question.correct_answers &&
                            question.correct_answers.length > 0 && (
                              <span className="block text-xs text-gray-500 mt-1">
                                {t("playQuiz.acceptedVariants")}:{" "}
                                {question.correct_answers.join(", ")}
                              </span>
                            )}
                        </p>
                      </div>
                      <div className="ml-4">
                        {isCorrectAnswer ? (
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        ) : (
                          <XCircle className="w-8 h-8 text-red-600" />
                        )}
                      </div>
                    </div>
                    {!trainingMode && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">
                          {answer?.points_earned || 0} {t("home.pts")}
                        </span>
                        {" • "}
                        {answer?.time_taken || 0}s
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => onNavigate("quizzes")}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              {t("playQuiz.exploreOtherQuizzes")}
            </button>
            <button
              onClick={() => {
                onNavigate("play-quiz", {
                  quizId,
                  resetKey: Date.now(),
                });
              }}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {t("playQuiz.playAgain")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentQuestionIndex >= questions.length && !gameComplete) {
    console.log("[Render] Index out of bounds, calling completeGame");
    completeGame();
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    console.error("[Render] Current question is undefined!", {
      currentQuestionIndex,
      questionsLength: questions.length,
      gameComplete,
    });
    return null;
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => {
            if (confirm(t("playQuiz.confirmQuit"))) {
              onNavigate("quizzes");
            }
          }}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t("playQuiz.quit")}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{quiz.title}</h2>
            {trainingMode && (
              <span className="inline-block mt-1 px-3 py-1 bg-teal-100 text-teal-700 text-sm rounded-full font-medium">
                {t("playQuiz.trainingMode")}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {!trainingMode && (
              <>
                <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 rounded-lg">
                  <Trophy className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-blue-600">{totalScore}</span>
                </div>
                <div
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    timeLeft <= 5 ? "bg-red-100" : "bg-gray-100"
                  }`}
                >
                  <Clock
                    className={`w-5 h-5 ${
                      timeLeft <= 5 ? "text-red-600" : "text-gray-600"
                    }`}
                  />
                  <span
                    className={`font-bold ${
                      timeLeft <= 5 ? "text-red-600" : "text-gray-600"
                    }`}
                  >
                    {timeLeft}s
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              {t("playQuiz.question")} {currentQuestionIndex + 1} /{" "}
              {questions.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          {currentQuestion.question_text}
        </h3>

        {currentQuestion.image_url && (
          <div className="mb-6 flex justify-center">
            <img
              src={currentQuestion.image_url}
              alt={t("playQuiz.questionImage")}
              className="max-w-full max-h-96 rounded-lg shadow-md object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        <div className="mb-6">
          {currentQuestion.question_type === "true_false" && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() =>
                  setSelectedOption(
                    currentQuestion.correct_answer ===
                      t("createQuiz.trueFalse.true")
                      ? t("createQuiz.trueFalse.true")
                      : "Vrai"
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isAnswered) {
                    setSelectedOption(
                      currentQuestion.correct_answer ===
                        t("createQuiz.trueFalse.true")
                        ? t("createQuiz.trueFalse.true")
                        : "Vrai"
                    );
                    setTimeout(() => handleSubmitAnswer(), 100);
                  }
                }}
                disabled={isAnswered}
                className={`p-6 rounded-lg border-2 transition-all font-bold text-lg ${
                  isAnswered &&
                  (currentQuestion.correct_answer ===
                    t("createQuiz.trueFalse.true") ||
                    currentQuestion.correct_answer === "Vrai")
                    ? "border-green-500 bg-green-50 text-green-700"
                    : isAnswered &&
                      selectedOption === t("createQuiz.trueFalse.true") &&
                      currentQuestion.correct_answer !==
                        t("createQuiz.trueFalse.true")
                    ? "border-red-500 bg-red-50 text-red-700"
                    : selectedOption === t("createQuiz.trueFalse.true")
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 hover:border-emerald-300"
                } ${isAnswered ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                ✓ {t("createQuiz.trueFalse.true")}
              </button>
              <button
                onClick={() =>
                  setSelectedOption(
                    currentQuestion.correct_answer ===
                      t("createQuiz.trueFalse.false")
                      ? t("createQuiz.trueFalse.false")
                      : "Faux"
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isAnswered) {
                    setSelectedOption(
                      currentQuestion.correct_answer ===
                        t("createQuiz.trueFalse.false")
                        ? t("createQuiz.trueFalse.false")
                        : "Faux"
                    );
                    setTimeout(() => handleSubmitAnswer(), 100);
                  }
                }}
                disabled={isAnswered}
                className={`p-6 rounded-lg border-2 transition-all font-bold text-lg ${
                  isAnswered &&
                  (currentQuestion.correct_answer ===
                    t("createQuiz.trueFalse.false") ||
                    currentQuestion.correct_answer === "Faux")
                    ? "border-green-500 bg-green-50 text-green-700"
                    : isAnswered &&
                      selectedOption === t("createQuiz.trueFalse.false") &&
                      currentQuestion.correct_answer !==
                        t("createQuiz.trueFalse.false")
                    ? "border-red-500 bg-red-50 text-red-700"
                    : selectedOption === t("createQuiz.trueFalse.false")
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 hover:border-emerald-300"
                } ${isAnswered ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                ✗ {t("createQuiz.trueFalse.false")}
              </button>
            </div>
          )}

          {currentQuestion.question_type === "mcq" &&
            currentQuestion.options && (
              <div
                className={`grid gap-4 ${
                  currentQuestion.option_images &&
                  Object.keys(currentQuestion.option_images).length > 0
                    ? "grid-cols-2"
                    : "grid-cols-1"
                }`}
              >
                {(Array.isArray(currentQuestion.options)
                  ? currentQuestion.options
                  : []
                ).map((option: string, index: number) => {
                  const optionImages = currentQuestion.option_images as Record<
                    string,
                    string
                  > | null;
                  const imageUrl = optionImages?.[option];

                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedOption(option)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isAnswered) {
                          setSelectedOption(option);
                          setTimeout(() => handleSubmitAnswer(), 100);
                        }
                      }}
                      disabled={isAnswered}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isAnswered &&
                        (currentQuestion.correct_answers &&
                        currentQuestion.correct_answers.length > 0
                          ? currentQuestion.correct_answers.includes(option)
                          : option === currentQuestion.correct_answer)
                          ? "border-green-500 bg-green-50"
                          : isAnswered &&
                            option === selectedOption &&
                            !(currentQuestion.correct_answers &&
                            currentQuestion.correct_answers.length > 0
                              ? currentQuestion.correct_answers.includes(option)
                              : option === currentQuestion.correct_answer)
                          ? "border-red-500 bg-red-50"
                          : selectedOption === option
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-300"
                      } ${
                        isAnswered ? "cursor-not-allowed" : "cursor-pointer"
                      }`}
                    >
                      {imageUrl && (
                        <div className="mb-3 flex justify-center">
                          <img
                            src={imageUrl}
                            alt={option}
                            className="max-w-full h-40 rounded object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <span className="font-medium text-center block">
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

          {(currentQuestion.question_type === "single_answer" ||
            currentQuestion.question_type === "text_free") && (
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !isAnswered && handleSubmitAnswer()
              }
              autoFocus
              disabled={isAnswered}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none disabled:bg-gray-100"
              placeholder={t("playQuiz.enterAnswer")}
            />
          )}

          {currentQuestion.question_type === "map_click" && (
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-gray-600">{t("playQuiz.mapClickComing")}</p>
            </div>
          )}
        </div>

        {showResult && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              answers[answers.length - 1]?.is_correct ||
              (isAnswered &&
                (currentQuestion.question_type === "mcq" ||
                currentQuestion.question_type === "true_false"
                  ? selectedOption === currentQuestion.correct_answer
                  : [
                      currentQuestion.correct_answer,
                      ...(currentQuestion.correct_answers || []),
                    ].some(
                      (ca) =>
                        userAnswer.toLowerCase().trim() ===
                        ca.toLowerCase().trim()
                    )))
                ? "bg-green-50 border-2 border-green-300"
                : "bg-red-50 border-2 border-red-300"
            }`}
          >
            <div className="flex items-center space-x-3">
              {answers[answers.length - 1]?.is_correct ||
              (isAnswered &&
                (currentQuestion.question_type === "mcq" ||
                currentQuestion.question_type === "true_false"
                  ? selectedOption === currentQuestion.correct_answer
                  : [
                      currentQuestion.correct_answer,
                      ...(currentQuestion.correct_answers || []),
                    ].some(
                      (ca) =>
                        userAnswer.toLowerCase().trim() ===
                        ca.toLowerCase().trim()
                    ))) ? (
                <>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-bold text-green-800">
                      {t("playQuiz.correct")}
                    </p>
                    <p className="text-sm text-green-700">
                      +
                      {answers[answers.length - 1]?.points_earned ||
                        calculatePoints(
                          Math.round((Date.now() - questionStartTime) / 1000),
                          currentQuestion.points
                        )}{" "}
                      {t("home.pts")}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="font-bold text-red-800">
                      {t("playQuiz.incorrect")}
                    </p>
                    <p className="text-sm text-red-700">
                      {t("playQuiz.correctAnswerWas")}:{" "}
                      {currentQuestion.correct_answer}
                      {currentQuestion.correct_answers &&
                        currentQuestion.correct_answers.length > 0 && (
                          <span className="block text-xs mt-1">
                            ({t("playQuiz.variants")}:{" "}
                            {currentQuestion.correct_answers.join(", ")})
                          </span>
                        )}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {!isAnswered && (
          <button
            onClick={handleSubmitAnswer}
            disabled={
              currentQuestion.question_type === "mcq" ||
              currentQuestion.question_type === "true_false"
                ? !selectedOption
                : !userAnswer.trim()
            }
            className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("playQuiz.validate")}
          </button>
        )}
      </div>
    </div>
  );
}
