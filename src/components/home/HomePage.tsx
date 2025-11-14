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
  X,
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
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [stats, setStats] = useState({
    totalPlays: 0,
    averageScore: 0,
    dailyPoints: 0,
    maxDailyPoints: 0,
  });

  const getDayText = (count: number) =>
    count > 1 ? t("common.days") : t("common.day");

  const getStreakStartDate = () => {
    if (!profile?.current_streak || profile.current_streak === 0) return null;
    const today = new Date();
    const streakStartDate = new Date();
    streakStartDate.setDate(today.getDate() - (profile.current_streak - 1));
    return streakStartDate;
  };

  useEffect(() => {
    if (!profile) return;

    const loadData = async () => {
      try {
        const { data: freshProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", profile.id)
          .single();

        let query = supabase
          .from("quizzes")
          .select("*")
          .or("is_public.eq.true,is_global.eq.true");

        if (!profile.show_all_languages && profile.language) {
          query = query.eq("language", profile.language);
        }

        const { data: allQuizzes, error } = await query;

        if (error) {
          console.error("Erreur chargement quiz:", error);
          return;
        }

        if (allQuizzes && allQuizzes.length > 0) {
          const now = Date.now();
          const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

          const trendingQuizzes = allQuizzes
            .map((quiz: any) => {
              const quizAge = now - new Date(quiz.created_at).getTime();
              const recencyScore = Math.max(0, 1 - quizAge / thirtyDaysMs);
              const popularityScore = Math.min(
                1,
                (quiz.total_plays || 0) / 100
              );
              const trendScore = popularityScore * 0.7 + recencyScore * 0.3;
              return { ...quiz, trendScore };
            })
            .sort((a: any, b: any) => b.trendScore - a.trendScore)
            .slice(0, 4);

          setRecentQuizzes(trendingQuizzes);
        }

        const { data: sessions, count: totalSessionsCount } = await supabase
          .from("game_sessions")
          .select("*", { count: "exact" })
          .eq("player_id", profile.id)
          .eq("completed", true)
          .order("completed_at", { ascending: false })
          .limit(5);

        if (sessions) {
          setRecentSessions(sessions);

          const totalPlays = totalSessionsCount || 0;
          const averageScore =
            sessions.reduce((acc, s) => acc + s.score, 0) / sessions.length ||
            0;

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
              dailyPointsMap.set(
                date,
                (dailyPointsMap.get(date) || 0) + s.score
              );
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
      } catch (err) {
        console.error("Erreur:", err);
      }
    };

    loadData();

    const sessionSubscription = supabase
      .channel(`sessions_${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_sessions",
          filter: `player_id=eq.${profile.id}`,
        },
        () => {
          console.log("🔄 Session mise à jour, rechargement...");
          loadData();
        }
      )
      .subscribe();

    return () => {
      sessionSubscription.unsubscribe();
    };
  }, [profile]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-gray-900 mb-2">
          {t("home.welcome")},{" "}
          <span className="text-indigo-600">{profile?.pseudo}</span>!
        </h1>
        <p className="text-gray-600 text-base sm:text-lg">
          {t("home.readyToTest")}
        </p>
      </div>

      {profile?.is_banned && (
        <div className="bg-red-50 border-red-400 border-2 rounded-lg p-5 mb-8 flex items-start space-x-4">
          <Ban className="w-8 h-8 text-red-600 flex-shrink-0" />
          <div className="text-red-700">
            <h3 className="text-xl font-semibold mb-2">
              {t("home.accountBanned")}
            </h3>
            {profile.ban_until ? (
              <p>
                {t("home.temporaryBanUntil")}:{" "}
                <span className="font-bold">
                  {new Date(profile.ban_until).toLocaleString()}
                </span>
              </p>
            ) : (
              <p className="font-bold">{t("home.permanentBan")}</p>
            )}
            <p>
              {t("home.reason")}: {profile.ban_reason || t("home.notSpecified")}
            </p>
          </div>
        </div>
      )}

      {warnings.length > 0 && !profile?.is_banned && (
        <div className="bg-yellow-50 border-yellow-400 border-2 rounded-lg p-5 mb-8 flex items-start space-x-4">
          <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
          <div>
            <h3 className="text-yellow-800 text-xl font-semibold mb-4">
              {t("home.warningsReceived")}
            </h3>
            <div className="space-y-3">
              {warnings.map((warning, idx) => (
                <div
                  key={warning.id}
                  className="bg-white rounded-lg p-4 border border-yellow-200"
                >
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-800 font-semibold text-sm">
                      {t("home.warning")} #{warnings.length - idx}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(warning.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mb-3">
                    <strong>{t("home.reason")}:</strong> {warning.reason}
                  </p>
                  {warning.admin_notes && (
                    <p className="text-blue-700 bg-blue-50 rounded p-2 text-sm">
                      {t("home.note")}: {warning.admin_notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-yellow-700 text-sm mt-4">
              {t("home.respectRules")}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white shadow-lg flex flex-col">
          <Target className="w-10 h-10 mb-4" />
          <span className="text-3xl font-extrabold">{stats.totalPlays}</span>
          <h3 className="text-lg font-semibold mt-auto">
            {t("home.gamesPlayed")}
          </h3>
          <p className="text-green-200 text-sm">{t("home.totalSessions")}</p>
        </div>

        <div
          className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow flex flex-col"
          onClick={() => setShowStreakModal(true)}
        >
          <Flame className="w-10 h-10 mb-4" />
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-3xl font-extrabold">
              {profile?.current_streak || 0}
            </span>
            <Flame
              className={`w-8 h-8 ${
                profile?.current_streak ? "animate-pulse" : "opacity-50"
              }`}
            />
          </div>
          <h3 className="text-lg font-semibold">{t("home.currentStreak")}</h3>
          <p className="text-red-200 text-sm mt-auto">
            {t("home.record")}: {profile?.longest_streak || 0}{" "}
            {getDayText(profile?.longest_streak || 0)}
          </p>
          <p className="text-xs text-red-300 mt-2 cursor-pointer hover:underline">
            {t("common.clickForDetails")}
          </p>
        </div>

        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-xl p-6 text-white shadow-lg flex flex-col">
          <Trophy className="w-10 h-10 mb-4" />
          <span className="text-3xl font-extrabold">{stats.dailyPoints}</span>
          <h3 className="text-lg font-semibold mt-auto">
            {t("home.dailyPoints")}
          </h3>
          <p className="text-yellow-200 text-sm">
            {t("home.record")}: {stats.maxDailyPoints} {t("home.pts")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
            {t("home.quickActions")}
          </h2>

          <button
            onClick={() => onNavigate("quizzes")}
            className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group mb-4"
          >
            <div className="flex items-center space-x-3">
              <BookOpen className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-gray-900">
                  {t("home.exploreQuizzes")}
                </p>
                <p className="text-gray-600 text-sm">
                  {t("home.discoverNewChallenges")}
                </p>
              </div>
            </div>
            <span className="text-green-600 group-hover:translate-x-1 transition-transform text-2xl">
              →
            </span>
          </button>

          <button
            onClick={() => onNavigate("create-quiz")}
            className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group mb-4"
          >
            <div className="flex items-center space-x-3">
              <Award className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-semibold text-gray-900">
                  {t("quiz.create")}
                </p>
                <p className="text-gray-600 text-sm">
                  {t("home.shareKnowledge")}
                </p>
              </div>
            </div>
            <span className="text-blue-600 group-hover:translate-x-1 transition-transform text-2xl">
              →
            </span>
          </button>

          <button
            onClick={() => onNavigate("training-mode")}
            className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group mb-4"
          >
            <div className="flex items-center space-x-3">
              <Dumbbell className="w-6 h-6 text-purple-600" />
              <div>
                <p className="font-semibold text-gray-900">
                  {t("home.trainingMode")}
                </p>
                <p className="text-gray-600 text-sm">{t("home.noTimeLimit")}</p>
              </div>
            </div>
            <span className="text-purple-600 group-hover:translate-x-1 transition-transform text-2xl">
              →
            </span>
          </button>

          <button
            onClick={() => onNavigate("duels")}
            className="w-full flex items-center justify-between p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-semibold text-gray-900">
                  {t("home.challengeFriend")}
                </p>
                <p className="text-gray-600 text-sm">
                  {t("home.realTimeDuel")}
                </p>
              </div>
            </div>
            <span className="text-yellow-600 group-hover:translate-x-1 transition-transform text-2xl">
              →
            </span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center justify-between">
            <span>{t("home.trendingQuizzes")}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {t("home.newAndPopular")}
            </span>
          </h2>

          {recentQuizzes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {t("quiz.noQuizzes")}
            </p>
          ) : (
            recentQuizzes.map((quiz, index) => (
              <div
                key={quiz.id}
                onClick={() => onNavigate("play-quiz", { quizId: quiz.id })}
                className="cursor-pointer p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-lg transition-shadow flex flex-col gap-2"
              >
                {new Date(quiz.created_at).getTime() >
                  Date.now() - 7 * 24 * 60 * 60 * 1000 && (
                  <span className="self-start px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                    🆕 {t("home.new")}
                  </span>
                )}

                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-semibold text-sm">#{index + 1}</span>
                  <h3 className="font-semibold text-lg">{quiz.title}</h3>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">
                  {quiz.description}
                </p>

                <div className="flex items-center gap-4 mt-auto">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Trophy className="w-4 h-4" />
                    <span>
                      {quiz.total_plays} {t("home.games")}
                    </span>
                  </div>

                  {quiz.recentPlays !== undefined && quiz.recentPlays > 0 && (
                    <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                      <TrendingUp className="w-4 h-4" />
                      <span>
                        {quiz.recentPlays} {t("home.thisWeek")}
                      </span>
                    </div>
                  )}

                  <div
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      quiz.difficulty === "easy"
                        ? "bg-green-100 text-green-700"
                        : quiz.difficulty === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {quiz.difficulty === "easy" && <>⭐ {t("home.easy")}</>}
                    {quiz.difficulty === "medium" && (
                      <>⭐⭐ {t("home.medium")}</>
                    )}
                    {quiz.difficulty === "hard" && <>⭐⭐⭐ {t("home.hard")}</>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showStreakModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Flame className="w-6 h-6 mr-2 text-orange-600" />
                {t("home.currentStreak")}
              </h3>
              <button
                onClick={() => setShowStreakModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {profile?.current_streak && profile.current_streak > 0 ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-orange-50 to-red-100 p-6 rounded-lg text-center">
                  <p className="text-5xl font-bold text-orange-600 mb-2">
                    {profile.current_streak}
                  </p>
                  <p className="text-sm text-orange-700 font-medium">
                    {t("home.currentStreak")}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    {t("profile.streakStartedOn")}:
                  </p>
                  <p className="text-lg font-bold text-gray-800">
                    {getStreakStartDate()?.toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">
                    💡 {t("profile.playTodayToKeepStreak")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-xs text-gray-600 mb-1">
                      {t("home.record")}
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {profile.longest_streak || 0}
                    </p>
                    <p className="text-xs text-gray-600">
                      {getDayText(profile.longest_streak || 0)}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-xs text-gray-600 mb-1">
                      {(profile.current_streak || 0) >
                      (profile.longest_streak || 0)
                        ? t("profile.keepGoing")
                        : t("profile.daysToBreakRecord")}
                    </p>
                    {(profile.current_streak || 0) <=
                    (profile.longest_streak || 0) ? (
                      <>
                        <p className="text-2xl font-bold text-gray-800">
                          {Math.max(
                            0,
                            (profile.longest_streak || 0) -
                              (profile.current_streak || 0)
                          )}
                        </p>
                        <p className="text-xs text-gray-600">
                          {getDayText(
                            Math.max(
                              0,
                              (profile.longest_streak || 0) -
                                (profile.current_streak || 0)
                            )
                          )}
                        </p>
                      </>
                    ) : (
                      <div className="mt-2">
                        <p className="text-3xl">🔥🎉</p>
                        <p className="text-xs text-emerald-600 font-bold mt-1">
                          +
                          {(profile.current_streak || 0) -
                            (profile.longest_streak || 0)}{" "}
                          {getDayText(
                            (profile.current_streak || 0) -
                              (profile.longest_streak || 0)
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Flame className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">{t("profile.noActiveStreak")}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {t("profile.playToStartStreak")}
                </p>
              </div>
            )}

            <button
              onClick={() => setShowStreakModal(false)}
              className="w-full mt-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
