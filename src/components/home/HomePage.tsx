import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  Trophy,
  Target,
  Flame,
  Users,
  BookOpen,
  Award,
  Dumbbell,
  AlertTriangle,
  Ban,
} from "lucide-react";
import type { Database } from "../../lib/database.types";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type GameSession = Database["public"]["Tables"]["game_sessions"]["Row"];
type Warning = Database["public"]["Tables"]["warnings"]["Row"];

export function HomePage({
  onNavigate,
}: {
  onNavigate: (view: string) => void;
}) {
  const { profile } = useAuth();
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [recentSessions, setRecentSessions] = useState<GameSession[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [stats, setStats] = useState({
    totalPlays: 0,
    averageScore: 0,
    dailyPoints: 0,
    maxDailyPoints: 0,
  });

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
  if (!profile) return;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*')
    .or('is_public.eq.true,is_global.eq.true')
    .eq('validation_status', 'approved') 
    .gte('created_at', thirtyDaysAgo.toISOString()) 
    .gte('total_plays', 1) 
    .order('total_plays', { ascending: false }) 
    .order('created_at', { ascending: false }) 
    .limit(4); 

  if (quizzes) setRecentQuizzes(quizzes);

    const { data: sessions } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("player_id", profile.id)
      .eq("completed", true)
      .order("completed_at", { ascending: false })
      .limit(5);

    if (sessions) {
      setRecentSessions(sessions);

      const totalPlays = sessions.length;
      const averageScore =
        sessions.reduce((acc, s) => acc + s.score, 0) / totalPlays || 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { data: todaySessions } = await supabase
        .from("game_sessions")
        .select("score")
        .eq("player_id", profile.id)
        .eq("completed", true)
        .gte("completed_at", todayISO);

      let dailyPoints = 0;
      if (todaySessions) {
        dailyPoints = todaySessions.reduce((sum, s) => sum + s.score, 0);
      }

      const { data: allCompletedSessions } = await supabase
        .from("game_sessions")
        .select("score, completed_at")
        .eq("player_id", profile.id)
        .eq("completed", true)
        .order("completed_at", { ascending: false });

      let maxDailyPoints = 0;
      if (allCompletedSessions) {
        const dailyPointsMap = new Map<string, number>();
        allCompletedSessions.forEach((s) => {
          const date = new Date(s.completed_at).toISOString().split("T")[0];
          dailyPointsMap.set(date, (dailyPointsMap.get(date) || 0) + s.score);
        });
        maxDailyPoints = Math.max(...dailyPointsMap.values(), 0);
      }

      setStats({ totalPlays, averageScore, dailyPoints, maxDailyPoints });
    }

    const { data: userWarnings } = await supabase
      .from("warnings")
      .select("*")
      .eq("reported_user_id", profile.id)
      .in("status", ["action_taken"])
      .order("created_at", { ascending: false })
      .limit(3);

    if (userWarnings) setWarnings(userWarnings);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Bienvenue, {profile?.pseudo}!
        </h1>
        <p className="text-gray-600">
          Prêt à tester vos connaissances en géographie?
        </p>
      </div>

      {profile?.is_banned && (
        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <Ban className="w-8 h-8 text-red-600 mr-4 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-800 mb-2">
                Compte banni
              </h3>
              {profile.ban_until ? (
                <>
                  <p className="text-red-700 mb-2">
                    Votre compte est temporairement banni jusqu'au:{" "}
                    <span className="font-bold">
                      {new Date(profile.ban_until).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-red-700">
                    Raison:{" "}
                    <span className="font-semibold">
                      {profile.ban_reason || "Non spécifiée"}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-red-700 mb-2 font-bold">
                    Votre compte est banni de manière permanente.
                  </p>
                  <p className="text-red-700">
                    Raison:{" "}
                    <span className="font-semibold">
                      {profile.ban_reason || "Non spécifiée"}
                    </span>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {warnings.length > 0 && !profile?.is_banned && (
        <div className="bg-yellow-50 border-2 border-yellow-500 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <AlertTriangle className="w-8 h-8 text-yellow-600 mr-4 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-yellow-800 mb-3">
                Avertissements reçus
              </h3>
              <div className="space-y-3">
                {warnings.map((warning, index) => (
                  <div
                    key={warning.id}
                    className="bg-white rounded-lg p-4 border border-yellow-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-bold text-gray-700">
                        Avertissement #{warnings.length - index}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(warning.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mb-2">
                      <span className="font-medium">Raison:</span>{" "}
                      {warning.reason}
                    </p>
                    {warning.admin_notes && (
                      <p className="text-sm text-blue-700 bg-blue-50 rounded p-2">
                        <span className="font-medium">Note:</span>{" "}
                        {warning.admin_notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-yellow-700 mt-3">
                Veuillez respecter les règles de la communauté pour éviter
                d'autres sanctions.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-10 h-10" />
            <span className="text-3xl font-bold">{stats.totalPlays}</span>
          </div>
          <h3 className="text-lg font-semibold">Parties jouées</h3>
          <p className="text-emerald-100 text-sm">Total de vos sessions</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Flame className="w-10 h-10" />
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold">
                {profile?.current_streak || 0}
              </span>
              <Flame
                className={`w-8 h-8 ${
                  (profile?.current_streak || 0) > 0
                    ? "animate-pulse"
                    : "opacity-50"
                }`}
              />
            </div>
          </div>
          <h3 className="text-lg font-semibold">Série en cours</h3>
          <p className="text-orange-100 text-sm">
            Record: {profile?.longest_streak || 0} jours
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="w-10 h-10" />
            <span className="text-3xl font-bold">{stats.dailyPoints}</span>
          </div>
          <h3 className="text-lg font-semibold">Points du jour</h3>
          <p className="text-amber-100 text-sm">
            Record: {stats.maxDailyPoints} pts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Actions rapides
            </h2>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onNavigate("quizzes")}
              className="w-full flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <BookOpen className="w-6 h-6 text-emerald-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">
                    Explorer les quiz
                  </p>
                  <p className="text-sm text-gray-600">
                    Découvrez de nouveaux défis
                  </p>
                </div>
              </div>
              <span className="text-emerald-600 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>

            <button
              onClick={() => onNavigate("create-quiz")}
              className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <Award className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Créer un quiz</p>
                  <p className="text-sm text-gray-600">Partagez votre savoir</p>
                </div>
              </div>
              <span className="text-blue-600 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>

            <button
              onClick={() => onNavigate("training-mode")}
              className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <Dumbbell className="w-6 h-6 text-purple-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">
                    Mode Entraînement
                  </p>
                  <p className="text-sm text-gray-600">Sans limite de temps</p>
                </div>
              </div>
              <span className="text-purple-600 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>

            <button
              onClick={() => onNavigate("duels")}
              className="w-full flex items-center justify-between p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-amber-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Défier un ami</p>
                  <p className="text-sm text-gray-600">Duel en temps réel</p>
                </div>
              </div>
              <span className="text-amber-600 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Quiz en tendance
            </h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Nouveaux & populaires
            </span>
          </div>

          <div className="space-y-3">
            {recentQuizzes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucun quiz disponible
              </p>
            ) : (
              recentQuizzes.map((quiz, index) => (
                <div
                  key={quiz.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onNavigate("play-quiz", { quizId: quiz.id })}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {new Date(quiz.created_at).getTime() >
                        Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                        <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full mb-2">
                          🆕 NOUVEAU
                        </span>
                      )}

                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-gray-400 font-bold">
                          #{index + 1}
                        </span>
                        <h3 className="font-semibold text-gray-800">
                          {quiz.title}
                        </h3>
                      </div>

                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {quiz.description}
                      </p>

                      <div className="flex items-center space-x-4 mt-3">
                        <span className="text-xs text-gray-500 flex items-center">
                          <Trophy className="w-3 h-3 mr-1" />
                          {quiz.total_plays} parties
                        </span>

                        {quiz.recentPlays !== undefined &&
                          quiz.recentPlays > 0 && (
                            <span className="text-xs text-emerald-600 font-medium flex items-center">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {quiz.recentPlays} cette semaine
                            </span>
                          )}

                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            quiz.difficulty === "easy"
                              ? "bg-green-100 text-green-700"
                              : quiz.difficulty === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {quiz.difficulty === "easy" && "⭐ Facile"}
                          {quiz.difficulty === "medium" && "⭐⭐ Moyen"}
                          {quiz.difficulty === "hard" && "⭐⭐⭐ Difficile"}
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
