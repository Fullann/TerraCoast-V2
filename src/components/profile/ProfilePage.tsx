import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { supabase } from "../../lib/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import {
  Award,
  Trophy,
  Star,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Settings,
  ArrowLeft,
  Flame,
  UserPlus,
  UserCheck,
  Clock,
  History,
  X,
} from "lucide-react";
import type { Database } from "../../lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Badge = Database["public"]["Tables"]["badges"]["Row"];
type UserBadge = Database["public"]["Tables"]["user_badges"]["Row"] & {
  badges: Badge;
};
type Title = Database["public"]["Tables"]["titles"]["Row"];
type UserTitle = Database["public"]["Tables"]["user_titles"]["Row"] & {
  titles: Title;
};
type GameSession = Database["public"]["Tables"]["game_sessions"]["Row"];

interface ProfilePageProps {
  userId?: string;
  onNavigate: (view: string, data?: any) => void;
}

export function ProfilePage({ userId, onNavigate }: ProfilePageProps) {
  const { profile: currentUserProfile } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [titles, setTitles] = useState<UserTitle[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [currentUserDailyStats, setCurrentUserDailyStats] = useState<
    { date: string; points: number }[]
  >([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    winRate: 0,
    averageScore: 0,
  });
  const [dailyStats, setDailyStats] = useState<
    { date: string; points: number }[]
  >([]);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [warnReason, setWarnReason] = useState("");
  const [sending, setSending] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<
    "none" | "pending" | "friends" | "blocked"
  >("none");
  const [showWarningHistory, setShowWarningHistory] = useState(false);
  const [warningHistory, setWarningHistory] = useState<any[]>([]);

  const isOwnProfile = !userId || userId === currentUserProfile?.id;
  const targetUserId = userId || currentUserProfile?.id;
  const isAdmin = currentUserProfile?.role === "admin";

  const getDayText = (count: number) => {
    return count > 1 ? t("common.days") : t("common.day");
  };

  useEffect(() => {
    loadProfileData();
  }, [targetUserId]);

  const loadProfileData = async () => {
    if (!targetUserId) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .single();

    if (profileData) setProfile(profileData);

    if (!isOwnProfile && currentUserProfile) {
      await loadFriendshipStatus();
    }

    const { data: userBadges } = await supabase
      .from("user_badges")
      .select("*, badges(*)")
      .eq("user_id", targetUserId)
      .order("earned_at", { ascending: false });

    if (userBadges) setBadges(userBadges as UserBadge[]);

    const { data: userTitles } = await supabase
      .from("user_titles")
      .select("*, titles(*)")
      .eq("user_id", targetUserId)
      .order("earned_at", { ascending: false });

    if (userTitles) setTitles(userTitles as UserTitle[]);

    const { data: gameSessions } = await supabase
      .from("game_sessions")
      .select("*")
      .eq("player_id", targetUserId)
      .eq("completed", true)
      .order("completed_at", { ascending: false });

    if (gameSessions) {
      setSessions(gameSessions);
      const totalGames = gameSessions.length;
      const totalScore = gameSessions.reduce((sum, s) => sum + s.score, 0);
      const averageScore = totalGames > 0 ? totalScore / totalGames : 0;
      const winRate =
        totalGames > 0
          ? (gameSessions.filter((s) => s.accuracy_percentage >= 70).length /
              totalGames) *
            100
          : 0;

      setStats({ totalGames, winRate, averageScore });
    }

    const { data: last7DaysData } = await supabase
      .from("game_sessions")
      .select("score, completed_at")
      .eq("player_id", targetUserId)
      .eq("completed", true)
      .gte(
        "completed_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      )
      .order("completed_at", { ascending: true });

    if (last7DaysData) {
      const dailyPointsMap = new Map<string, number>();

      // Initialiser les 7 derniers jours à 0
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString();
        dailyPointsMap.set(dateStr, 0);
      }

      // Ajouter/Mettre à jour avec les données réelles
      last7DaysData.forEach((session) => {
        const date = new Date(session.completed_at!).toLocaleDateString();
        dailyPointsMap.set(
          date,
          (dailyPointsMap.get(date) || 0) + session.score
        );
      });

      // Convertir en array maintenant que tous les jours sont présents
      const dailyStatsArray = Array.from(dailyPointsMap.entries()).map(
        ([date, points]) => ({
          date,
          points,
        })
      );
      setDailyStats(dailyStatsArray);
    }
    if (!isOwnProfile && currentUserProfile) {
      const { data: myLast7DaysData } = await supabase
        .from("game_sessions")
        .select("score, completed_at")
        .eq("player_id", currentUserProfile.id)
        .eq("completed", true)
        .gte(
          "completed_at",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order("completed_at", { ascending: true });

      if (myLast7DaysData) {
        const myDailyPointsMap = new Map<string, number>();

        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString();
          myDailyPointsMap.set(dateStr, 0);
        }

        myLast7DaysData.forEach((session) => {
          const date = new Date(session.completed_at!).toLocaleDateString();
          myDailyPointsMap.set(
            date,
            (myDailyPointsMap.get(date) || 0) + session.score
          );
        });

        const myDailyStatsArray = Array.from(myDailyPointsMap.entries()).map(
          ([date, points]) => ({
            date,
            points,
          })
        );
        setCurrentUserDailyStats(myDailyStatsArray);
      }
    }
  };
  const getStreakStartDate = () => {
    if (!profile?.current_streak || profile.current_streak === 0) return null;

    const today = new Date();
    const streakStartDate = new Date();
    streakStartDate.setDate(today.getDate() - (profile.current_streak - 1));

    return streakStartDate;
  };

  const loadFriendshipStatus = async () => {
    if (!currentUserProfile || !targetUserId) return;

    const { data: friendship } = await supabase
      .from("friendships")
      .select("status")
      .or(
        `and(user_id.eq.${currentUserProfile.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUserProfile.id})`
      )
      .maybeSingle();

    if (friendship) {
      setFriendshipStatus(friendship.status as any);
    } else {
      setFriendshipStatus("none");
    }
  };

  const sendFriendRequest = async () => {
    if (!currentUserProfile || !targetUserId) return;

    const { error } = await supabase.from("friendships").insert({
      user_id: currentUserProfile.id,
      friend_id: targetUserId,
      status: "pending",
    });

    if (error) {
      alert(t("profile.friendRequestError"));
      return;
    }

    alert(t("profile.friendRequestSent"));
    setFriendshipStatus("pending");
  };

  const loadWarningHistory = async () => {
    if (!targetUserId) return;

    const { data } = await supabase
      .from("warnings")
      .select(
        `
        *,
        reported_user:profiles!warnings_reported_user_id_fkey(pseudo),
        reporter_user:profiles!warnings_reporter_user_id_fkey(pseudo)
      `
      )
      .eq("reported_user_id", targetUserId)
      .order("created_at", { ascending: false });

    if (data) {
      setWarningHistory(data);
      setShowWarningHistory(true);
    }
  };

  const handleSendWarning = async () => {
    if (!warnReason.trim() || !currentUserProfile || !targetUserId) return;

    setSending(true);

    const { error } = await supabase.from("warnings").insert({
      reported_user_id: targetUserId,
      reporter_user_id: currentUserProfile.id,
      reason: warnReason.trim(),
    });

    setSending(false);

    if (error) {
      alert(t("profile.reportError"));
      return;
    }

    alert(t("profile.reportSuccess"));
    setShowWarnModal(false);
    setWarnReason("");
  };

  if (!profile) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center text-gray-600">{t("common.loading")}</div>
      </div>
    );
  }

  const activeTitle = titles.find((t) => t.is_active)?.titles;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {profile.pseudo.charAt(0).toUpperCase()}
              </span>
            </div>

            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                {profile.pseudo}
              </h1>
              {activeTitle && (
                <p className="text-lg text-emerald-600 font-medium mb-2">
                  {activeTitle.emoji} {activeTitle.name}
                </p>
              )}
              <div className="flex items-center space-x-4 text-gray-600 mb-3">
                <div className="flex items-center">
                  <Trophy className="w-5 h-5 mr-1 text-yellow-500" />
                  <span className="font-medium">
                    {t("profile.level")} {profile.level}
                  </span>
                </div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 mr-1 text-emerald-500" />
                  <span className="font-medium">
                    {profile.experience_points} {t("profile.xp")}
                  </span>
                </div>
              </div>

              <div className="w-full max-w-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-600">
                    {t("profile.level")} {profile.level}
                  </span>
                  <span className="text-xs font-medium text-gray-600">
                    {t("profile.level")} {profile.level + 1}
                  </span>
                </div>
                <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        ((profile.experience_points % 1000) / 1000) * 100
                      }%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                  </div>
                </div>
              </div>
              {/* Boutons compacts  */}
              <div className="flex justify-end gap-3 mt-4">
                {isOwnProfile && (
                  <button
                    onClick={() => onNavigate("settings")}
                    className="flex flex-col items-center justify-center w-16 h-16 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                    title={t("nav.settings")}
                  >
                    <Settings className="w-6 h-6" />
                    <span className="text-xs mt-1">{t("nav.settings")}</span>
                  </button>
                )}

                {!isOwnProfile && friendshipStatus === "none" && (
                  <button
                    onClick={sendFriendRequest}
                    className="flex flex-col items-center justify-center w-16 h-16 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl transition-colors"
                    title={t("profile.addFriend")}
                  >
                    <UserPlus className="w-6 h-6" />
                    <span className="text-xs mt-1"> {t("profile.addFriend")}</span>
                  </button>
                )}

                {!isOwnProfile && friendshipStatus === "pending" && (
                  <button
                    disabled
                    className="flex flex-col items-center justify-center w-16 h-16 bg-gray-100 text-gray-500 rounded-xl cursor-not-allowed"
                    title={t("profile.requestSent")}
                  >
                    <Clock className="w-6 h-6" />
                    <span className="text-xs mt-1"> {t("profile.requestSent")}</span>
                  </button>
                )}

                {!isOwnProfile && friendshipStatus === "accepted" && (
                  <button
                    disabled
                    className="flex flex-col items-center justify-center w-16 h-16 bg-green-100 text-green-700 rounded-xl cursor-not-allowed"
                    title={t("profile.friend")}
                  >
                    <UserCheck className="w-6 h-6" />
                    <span className="text-xs mt-1">{t("profile.friend")}</span>
                  </button>
                )}

                {!isOwnProfile && isAdmin && (
                  <button
                    onClick={loadWarningHistory}
                    className="flex flex-col items-center justify-center w-16 h-16 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-colors"
                    title={t("profile.history")}
                  >
                    <History className="w-6 h-6" />
                    <span className="text-xs mt-1">{t("profile.history")}</span>
                  </button>
                )}

                {!isOwnProfile && (
                  <button
                    onClick={() => setShowWarnModal(true)}
                    className="flex flex-col items-center justify-center w-16 h-16 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-colors"
                    title={t("profile.report")}
                  >
                    <AlertTriangle className="w-6 h-6" />
                    <span className="text-xs mt-1"> {t("profile.report")}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-blue-900">
                {t("profile.gamesPlayed")}
              </h3>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">
              {stats.totalGames}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-green-900">
                {t("profile.successRate")}
              </h3>
              <Trophy className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">
              {stats.winRate.toFixed(1)}%
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-100 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-orange-900">
                {t("home.currentStreak")}
              </h3>
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowStreakModal(true)}
            >
              <p className="text-3xl font-bold text-orange-900">
                {profile?.current_streak || 0}
              </p>
              <Flame
                className={`w-8 h-8 ${
                  (profile?.current_streak || 0) > 0
                    ? "text-orange-500 animate-pulse"
                    : "text-gray-400"
                }`}
              />
            </div>
            <p className="text-xs text-orange-700 mt-1">
              {t("home.record")}: {profile?.longest_streak || 0}{" "}
              {getDayText(profile?.longest_streak || 0)}
            </p>
            <p className="text-xs text-orange-600 mt-2 cursor-pointer hover:underline">
              {t("common.clickForDetails")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Award className="w-6 h-6 mr-2 text-purple-500" />
            {t("profile.titles")} ({titles.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {titles.map((userTitle) => (
              <div
                key={userTitle.id}
                className={`relative overflow-hidden p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                  userTitle.is_active
                    ? "bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 border-purple-400 shadow-lg"
                    : "bg-gradient-to-br from-gray-50 to-slate-100 border-gray-300"
                }`}
              >
                {userTitle.is_active && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full font-bold shadow-md flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      {t("profile.active")}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <div
                    className={`text-4xl ${
                      userTitle.is_active ? "animate-bounce" : ""
                    }`}
                  >
                    {userTitle.titles.emoji}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-bold ${
                        userTitle.is_active
                          ? "text-purple-900"
                          : "text-gray-800"
                      }`}
                    >
                      {userTitle.titles.name}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {userTitle.titles.description}
                    </p>
                  </div>
                </div>
                {userTitle.is_active && (
                  <div className="absolute -bottom-1 -right-1 w-20 h-20 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 blur-xl"></div>
                )}
              </div>
            ))}
            {titles.length === 0 && (
              <div className="col-span-2 text-center py-12">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t("profile.noTitles")}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-blue-500" />
            {t("profile.last7Days")}
          </h2>

          {dailyStats.length > 0 ? (
            <div className="space-y-4">
              {(() => {
                const allDaysData: any[] = [];

                // Générer les 7 derniers jours avec les données
                for (let i = 6; i >= 0; i--) {
                  const date = new Date();
                  date.setDate(date.getDate() - i);
                  const dateStr = date.toLocaleDateString();
                  const dayLabel = date.toLocaleDateString("en-US", {
                    weekday: "short",
                  });

                  const targetPoints =
                    dailyStats.find((s) => s.date === dateStr)?.points || 0;
                  const currentPoints =
                    currentUserDailyStats.find((s) => s.date === dateStr)
                      ?.points || 0;

                  allDaysData.push({
                    name: dayLabel,
                    [isOwnProfile ? profile.pseudo : profile.pseudo]:
                      targetPoints,
                    ...(!isOwnProfile && currentUserDailyStats.length > 0
                      ? {
                          [currentUserProfile?.pseudo || "You"]: currentPoints,
                        }
                      : {}),
                  });
                }

                const targetTotal = dailyStats.reduce(
                  (sum, stat) => sum + stat.points,
                  0
                );
                const currentTotal = currentUserDailyStats.reduce(
                  (sum, stat) => sum + stat.points,
                  0
                );

                return (
                  <>
                    {/* Affichage des totaux */}
                    <div className="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-700">
                            {isOwnProfile ? t("profile.you") : profile.pseudo}
                          </span>
                        </div>
                        <span className="text-2xl font-bold text-blue-600">
                          {targetTotal} {t("home.pts")}
                        </span>
                      </div>

                      {!isOwnProfile && currentUserDailyStats.length > 0 && (
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">
                              {currentUserProfile?.pseudo}
                            </span>
                          </div>
                          <span className="text-2xl font-bold text-purple-600">
                            {currentTotal} {t("home.pts")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Graphique en ligne */}
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={allDaysData}
                        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="name"
                          stroke="#9ca3af"
                          style={{ fontSize: "12px" }}
                        />
                        <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1f2937",
                            border: "1px solid #4b5563",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                          cursor={{ stroke: "#e5e7eb", strokeWidth: 2 }}
                          formatter={(value: any) => [value, "pts"]}
                        />
                        <Legend
                          wrapperStyle={{
                            paddingTop: "20px",
                            fontSize: "12px",
                          }}
                          iconType="circle"
                        />

                        {/* Ligne pour le profil visité */}
                        <Line
                          type="linear"
                          dataKey={
                            isOwnProfile ? profile.pseudo : profile.pseudo
                          }
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ fill: "#3b82f6", r: 5 }}
                          activeDot={{ r: 7 }}
                        />

                        {/* Ligne pour l'utilisateur actuel (comparaison) */}
                        {!isOwnProfile && currentUserDailyStats.length > 0 && (
                          <Line
                            type="linear"
                            dataKey={currentUserProfile?.pseudo || "You"}
                            stroke="#a855f7"
                            strokeWidth={3}
                            dot={{ fill: "#a855f7", r: 5 }}
                            activeDot={{ r: 7 }}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                );
              })()}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              {t("profile.noGamesThisWeek")}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
            {t("profile.badges")} ({badges.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {badges.map((userBadge, index) => (
              <div
                key={userBadge.id}
                className="group relative"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-300 hover:border-yellow-400 transition-all hover:scale-110 hover:shadow-xl cursor-pointer">
                  {/* Icône du badge basée sur le type */}
                  <div className="absolute top-1 right-1">
                    {userBadge.badges.requirement_type === "level" && (
                      <Trophy className="w-4 h-4 text-yellow-600" />
                    )}
                    {userBadge.badges.requirement_type === "games_played" && (
                      <Star className="w-4 h-4 text-blue-600" />
                    )}
                    {userBadge.badges.requirement_type === "streak" && (
                      <Flame className="w-4 h-4 text-orange-600" />
                    )}
                    {userBadge.badges.requirement_type === "wins" && (
                      <Award className="w-4 h-4 text-green-600" />
                    )}
                  </div>

                  {/* Emoji du badge avec effet brillant */}
                  <div className="relative">
                    <span className="text-5xl mb-2 filter drop-shadow-lg">
                      {userBadge.badges.emoji}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-amber-200 rounded-full opacity-0 group-hover:opacity-30 blur-xl transition-opacity"></div>
                  </div>

                  {/* Nom du badge */}
                  <p className="text-xs font-bold text-gray-800 text-center leading-tight mt-2">
                    {userBadge.badges.name}
                  </p>

                  {/* Tooltip au survol */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {userBadge.badges.description}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            ))}
            {badges.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t("profile.noBadges")}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-emerald-500" />
            {t("profile.recentGames")}
          </h2>
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">
                      {t("profile.score")}: {session.score} {t("home.pts")}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("profile.accuracy")}:{" "}
                      {session.accuracy_percentage.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(session.completed_at!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                {t("profile.noGames")}
              </p>
            )}
          </div>
        </div>
      </div>

      {showWarnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-red-600" />
              {t("profile.reportUser").replace("{user}", profile.pseudo)}
            </h3>

            <p className="text-gray-600 mb-4">
              {t("profile.reportDescription")}
            </p>

            <textarea
              value={warnReason}
              onChange={(e) => setWarnReason(e.target.value)}
              placeholder={t("profile.reportReason")}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
            />

            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowWarnModal(false);
                  setWarnReason("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                disabled={sending}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSendWarning}
                disabled={!warnReason.trim() || sending}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? t("profile.sending") : t("chat.send")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWarningHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {t("profile.warningHistory")} - {profile.pseudo}
              </h3>
              <button
                onClick={() => {
                  setShowWarningHistory(false);
                  setWarningHistory([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {warningHistory.length === 0 ? (
              <p className="text-center text-gray-600 py-8">
                {t("profile.noWarnings")}
              </p>
            ) : (
              <div className="space-y-4">
                {warningHistory.map((warning, index) => (
                  <div
                    key={warning.id}
                    className="border-2 border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-lg text-gray-700">
                          #{index + 1}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            warning.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : warning.status === "action_taken"
                              ? "bg-red-100 text-red-800"
                              : warning.status === "reviewed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {warning.status}
                        </span>
                        {warning.action_taken &&
                          warning.action_taken !== "none" && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                warning.action_taken === "warning"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : warning.action_taken === "temporary_ban"
                                  ? "bg-orange-100 text-orange-800"
                                  : warning.action_taken === "permanent_ban"
                                  ? "bg-red-100 text-red-800"
                                  : warning.action_taken ===
                                    "force_username_change"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {warning.action_taken}
                            </span>
                          )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(warning.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {t("profile.reportedBy")}:{" "}
                      <span className="font-medium">
                        {warning.reporter_user?.pseudo || t("profile.unknown")}
                      </span>
                    </p>
                    <div className="bg-gray-50 rounded p-3 mb-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">
                        {t("home.reason")}:
                      </p>
                      <p className="text-sm text-gray-800">{warning.reason}</p>
                    </div>
                    {warning.admin_notes && (
                      <div className="bg-blue-50 rounded p-3 mb-2">
                        <p className="text-xs font-medium text-blue-700 mb-1">
                          {t("profile.adminNotes")}:
                        </p>
                        <p className="text-sm text-blue-900">
                          {warning.admin_notes}
                        </p>
                      </div>
                    )}
                    {warning.temp_ban_until && (
                      <div className="bg-red-50 rounded p-3">
                        <p className="text-xs font-medium text-red-700">
                          {t("profile.tempBanUntil")}:{" "}
                          {new Date(warning.temp_ban_until).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setShowWarningHistory(false);
                setWarningHistory([]);
              }}
              className="w-full mt-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
      {showStreakModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center">
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
                    💡 {t("profile.streakTip")}
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
                      {t("profile.daysToGo")}
                    </p>
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
