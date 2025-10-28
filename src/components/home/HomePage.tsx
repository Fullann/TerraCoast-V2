import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
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
  TrendingUp,
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
  const { t } = useLanguage();
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [recentSessions, setRecentSessions] = useState<GameSession[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [stats, setStats] = useState({
    totalPlays: 0,
    averageScore: 0,
    dailyPoints: 0,
    maxDailyPoints: 0,
  });

  const getDayText = (count: number) => {
    return count > 1 ? t("common.days") : t("common.day");
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: quizzes } = await supabase
      .from("quizzes")
      .select("*")
      .or("is_public.eq.true,is_global.eq.true")
      .eq("validation_status", "approved")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .gte("total_plays", 1)
      .order("total_plays", { ascending: false })
      .order("created_at", { ascending: false })
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
          {t("home.welcome")}, {profile?.pseudo}!
        </h1>
        <p className="text-gray-600">{t("home.readyToTest")}</p>
      </div>

      {profile?.is_banned && (
        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <Ban className="w-8 h-8 text-red-600 mr-4 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-800 mb-2">
                {t("home.accountBanned")}
              </h3>
              {profile.ban_until ? (
                <>
                  <p className="text-red-700 mb-2">
                    {t("home.temporaryBanUntil")}:{" "}
                    <span className="font-bold">
                      {new Date(profile.ban_until).toLocaleString()}
                    </span>
                  </p>
                  <p className="text-red-700">
                    {t("home.reason")}:{" "}
                    <span className="font-semibold">
                      {profile.ban_reason || t("home.notSpecified")}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-red-700 mb-2 font-bold">
                    {t("home.permanentBan")}
                  </p>
                  <p className="text-red-700">
                    {t("home.reason")}:{" "}
                    <span className="font-semibold">
                      {profile.ban_reason || t("home.notSpecified")}
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
                {t("home.warningsReceived")}
              </h3>
              <div className="space-y-3">
                {warnings.map((warning, index) => (
                  <div
                    key={warning.id}
                    className="bg-white rounded-lg p-4 border border-yellow-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-bold text-gray-700">
                        {t("home.warning")} #{warnings.length - index}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(warning.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mb-2">
                      <span className="font-medium">{t("home.reason")}:</span>{" "}
                      {warning.reason}
                    </p>
                    {warning.admin_notes && (
                      <p className="text-sm text-blue-700 bg-blue-50 rounded p-2">
                        <span className="font-medium">{t("home.note")}:</span>{" "}
                        {warning.admin_notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm text-yellow-700 mt-3">
                {t("home.respectRules")}
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
          <h3 className="text-lg font-semibold">{t("home.gamesPlayed")}</h3>
          <p className="text-emerald-100 text-sm">
            {t("home.totalSessions")}
          </p>
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
          <h3 className="text-lg font-semibold">{t("home.currentStreak")}</h3>
          <p className="text-orange-100 text-sm">
            {t("home.record")}: {profile?.longest_streak || 0}{" "}
            {getDayText(profile?.longest_streak || 0)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="w-10 h-10" />
            <span className="text-3xl font-bold">{stats.dailyPoints}</span>
          </div>
          <h3 className="text-lg font-semibold">{t("home.dailyPoints")}</h3>
          <p className="text-amber-100 text-sm">
            {t("home.record")}: {stats.maxDailyPoints} {t("home.pts")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {t("home.quickActions")}
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
                    {t("home.exploreQuizzes")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("home.discoverNewChallenges")}
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
                  <p className="font-semibold text-gray-800">
                    {t("quiz.create")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("home.shareKnowledge")}
                  </p>
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
                    {t("home.trainingMode")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("home.noTimeLimit")}
                  </p>
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
                  <p className="font-semibold text-gray-800">
                    {t("home.challengeFriend")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("home.realTimeDuel")}
                  </p>
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
              {t("home.trendingQuizzes")}
            </h2>
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {t("home.newAndPopular")}
            </span>
          </div>

          <div className="space-y-3">
            {recentQuizzes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {t("quiz.noQuizzes")}
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
                          🆕 {t("home.new")}
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
                          {quiz.total_plays} {t("home.games")}
                        </span>

                        {quiz.recentPlays !== undefined &&
                          quiz.recentPlays > 0 && (
                            <span className="text-xs text-emerald-600 font-medium flex items-center">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {quiz.recentPlays} {t("home.thisWeek")}
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
                          {quiz.difficulty === "easy" && `⭐ ${t("home.easy")}`}
                          {quiz.difficulty === "medium" &&
                            `⭐⭐ ${t("home.medium")}`}
                          {quiz.difficulty === "hard" &&
                            `⭐⭐⭐ ${t("home.hard")}`}
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
