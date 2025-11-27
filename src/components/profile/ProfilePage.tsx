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
  TrendingUp,
  AlertTriangle,
  Settings,
  Flame,
  User,
  Clock,
  History,
  X,
  UserPlus,
  UserCheck,
  ArrowLeft,
  Calendar,
  Target,
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
type GameSession = Database["public"]["Tables"]["game_sessions"]["Row"] & {
  quizzes?: { title: string };
};

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
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);

  const isOwnProfile = !userId || userId === currentUserProfile?.id;
  const targetUserId = userId || currentUserProfile?.id;
  const isAdmin = currentUserProfile?.role === "admin";

  const getDayText = (count: number) => {
    return count > 1 ? t("common.days") : t("common.day");
  };

  const getXPForLevel = (level: number) => {
    // Retourne l'XP total nécessaire pour atteindre ce niveau
    return (level - 1) * 100;
  };

  const getLevelProgress = () => {
    if (!profile)
      return { current: 0, needed: 100, percentage: 0, remaining: 100 };

    const currentXP = profile.experience_points;
    const currentLevel = profile.level;

    // XP pour le début du niveau actuel
    const xpForCurrentLevel = getXPForLevel(currentLevel);

    // XP pour atteindre le niveau suivant
    const xpForNextLevel = getXPForLevel(currentLevel + 1);

    // XP dans le niveau actuel
    const xpInCurrentLevel = currentXP - xpForCurrentLevel;

    // XP nécessaire pour compléter le niveau
    const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel; // Toujours 1000

    // Pourcentage de progression
    const percentage = Math.min(
      100,
      (xpInCurrentLevel / xpNeededForLevel) * 100
    );

    return {
      current: xpInCurrentLevel,
      needed: xpNeededForLevel,
      percentage: Math.round(percentage),
      remaining: xpNeededForLevel - xpInCurrentLevel,
    };
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

    const { data: badgesData } = await supabase
      .from("user_badges")
      .select("*, badges(*)")
      .eq("user_id", targetUserId);

    if (badgesData) setBadges(badgesData);

    const { data: titlesData } = await supabase
      .from("user_titles")
      .select("*, titles(*)")
      .eq("user_id", targetUserId);

    if (titlesData) setTitles(titlesData);

    const { data: sessionsData } = await supabase
      .from("game_sessions")
      .select("*, quizzes(title)")
      .eq("player_id", targetUserId)
      .eq("completed", true)
      .order("started_at", { ascending: false })
      .limit(5);

    if (sessionsData) setSessions(sessionsData as any);

    await loadStats();
    await loadDailyStats();
  };

  const loadFriendshipStatus = async () => {
    if (!currentUserProfile || !targetUserId) return;

    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(
        `and(user_id.eq.${currentUserProfile.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${currentUserProfile.id})`
      )
      .single();

    if (data) {
      setFriendshipStatus(data.status as any);
    }
  };

  const loadStats = async () => {
    if (!targetUserId) return;

    const { data } = await supabase
      .from("game_sessions")
      .select("score, completed")
      .eq("player_id", targetUserId)
      .eq("completed", true);

    if (data) {
      const totalGames = data.length;
      const averageScore =
        data.reduce((sum, s) => sum + (s.score || 0), 0) / totalGames || 0;

      setStats({
        totalGames,
        winRate: 0,
        averageScore: Math.round(averageScore),
      });
    }
  };

  const loadDailyStats = async () => {
    if (!targetUserId) return;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString();
    });

    const startDate = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data } = await supabase
      .from("game_sessions")
      .select("started_at, score")
      .eq("player_id", targetUserId)
      .eq("completed", true)
      .gte("started_at", startDate);

    const dailyData: { [key: string]: number } = {};
    last7Days.forEach((day) => {
      dailyData[day] = 0;
    });

    if (data) {
      data.forEach((session) => {
        const date = new Date(session.started_at).toLocaleDateString();
        if (dailyData.hasOwnProperty(date)) {
          dailyData[date] = (dailyData[date] || 0) + (session.score || 0);
        }
      });
    }

    const formattedData = last7Days.map((date) => ({
      date,
      points: dailyData[date],
    }));

    setDailyStats(formattedData);

    if (!isOwnProfile && currentUserProfile) {
      const { data: myData } = await supabase
        .from("game_sessions")
        .select("started_at, score")
        .eq("player_id", currentUserProfile.id)
        .eq("completed", true)
        .gte("started_at", startDate);

      const myDailyData: { [key: string]: number } = {};
      last7Days.forEach((day) => {
        myDailyData[day] = 0;
      });

      if (myData) {
        myData.forEach((session) => {
          const date = new Date(session.started_at).toLocaleDateString();
          if (myDailyData.hasOwnProperty(date)) {
            myDailyData[date] = (myDailyData[date] || 0) + (session.score || 0);
          }
        });
      }

      const myFormattedData = last7Days.map((date) => ({
        date,
        points: myDailyData[date],
      }));

      setCurrentUserDailyStats(myFormattedData);
    }
  };

  const sendFriendRequest = async () => {
    if (!currentUserProfile || !targetUserId) return;

    const { error } = await supabase.from("friendships").insert({
      user_id: currentUserProfile.id,
      friend_id: targetUserId,
      status: "pending",
    });

    if (!error) {
      setFriendshipStatus("pending");
    }
  };

  const sendWarning = async () => {
    if (!warnReason.trim()) return;

    setSending(true);
    const { error } = await supabase.from("warnings").insert({
      reported_user_id: targetUserId,
      reporter_user_id: currentUserProfile?.id,
      reason: warnReason,
      status: "pending",
    });

    if (!error) {
      setShowWarnModal(false);
      setWarnReason("");
    }
    setSending(false);
  };

  const loadWarningHistory = async () => {
    const { data } = await supabase
      .from("warnings")
      .select("*")
      .eq("reported_user_id", targetUserId)
      .order("created_at", { ascending: false });

    if (data) setWarningHistory(data);
  };

  // ✅ Fonction corrigée pour gérer le clic sur le graphique
  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const clickedData = data.activePayload.payload;
      setSelectedDataPoint(clickedData);
    }
  };

  const allDaysData = dailyStats.map((stat) => {
    const myStatForDay = currentUserDailyStats.find(
      (s) => s.date === stat.date
    );
    return {
      name: stat.date,
      [isOwnProfile
        ? t("profile.myProgress")
        : profile?.pseudo || t("profile.user")]: stat.points,
      ...(myStatForDay && { [t("profile.myProgress")]: myStatForDay.points }),
    };
  });

  const levelProgress = getLevelProgress();

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center shadow-lg">
                <User className="w-12 h-12 md:w-16 md:h-16 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold shadow-lg border-4 border-white">
                {profile.level}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left w-full">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                {profile.pseudo}
              </h1>

              {/* ✅ BARRE DE PROGRESSION DU NIVEAU */}
              <div className="bg-gray-100 rounded-full p-1 mb-4">
                <div className="relative">
                  <div className="overflow-hidden h-6 rounded-full bg-gradient-to-r from-gray-200 to-gray-300">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 transition-all duration-500 ease-out flex items-center justify-end pr-2"
                      style={{ width: `${levelProgress.percentage}%` }}
                    >
                      {levelProgress.percentage > 20 && (
                        <span className="text-xs font-bold text-white drop-shadow">
                          {levelProgress.percentage}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between mt-1 px-1">
                    <span className="text-xs text-gray-600">
                      {levelProgress.current} XP
                    </span>
                    <span className="text-xs font-semibold text-gray-700">
                      {levelProgress.remaining} XP {t("profile.toNextLevel")}
                    </span>
                    <span className="text-xs text-gray-600">
                      {levelProgress.needed} XP
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-emerald-600">
                    {profile.level}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">
                    {t("profile.level")}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-blue-600">
                    {profile.experience_points}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">
                    {t("profile.xp")}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-orange-600">
                    {stats.totalGames}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600">
                    {t("profile.games")}
                  </p>
                </div>
              </div>

              {profile.current_streak > 0 && (
                <button
                  onClick={() => setShowStreakModal(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-100 to-orange-100 rounded-lg hover:from-red-200 hover:to-orange-200 transition-all"
                >
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="font-bold text-orange-700">
                    {profile.current_streak}{" "}
                    {getDayText(profile.current_streak)}
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
            {isOwnProfile && (
              <>
                <button
                  onClick={() => onNavigate("settings")}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg hover:scale-105 transform duration-200"
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-semibold">{t("profile.settings")}</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => onNavigate("account-details")}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg hover:scale-105 transform duration-200"
                  >
                    <User className="w-5 h-5" />
                    <span className="font-semibold">
                      {t("profile.accountDetails")}
                    </span>
                  </button>
                )}
              </>
            )}

            {!isOwnProfile && (
              <>
                {friendshipStatus === "none" && (
                  <button
                    onClick={sendFriendRequest}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg hover:scale-105 transform duration-200"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span className="font-semibold">
                      {t("profile.addFriend")}
                    </span>
                  </button>
                )}

                {friendshipStatus === "pending" && (
                  <button
                    disabled
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-400 text-white rounded-xl cursor-not-allowed opacity-75"
                  >
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">
                      {t("profile.requestPending")}
                    </span>
                  </button>
                )}

                {friendshipStatus === "friends" && (
                  <button className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow-md">
                    <UserCheck className="w-5 h-5" />
                    <span className="font-semibold">
                      {t("profile.friends")}
                    </span>
                  </button>
                )}

                {isAdmin && (
                  <>
                    <button
                      onClick={() =>
                        onNavigate("account-details", { userId: targetUserId })
                      }
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg hover:scale-105 transform duration-200"
                    >
                      <User className="w-5 h-5" />
                      <span className="font-semibold">
                        {t("profile.accountDetails")}
                      </span>
                    </button>

                    <button
                      onClick={() => setShowWarnModal(true)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all shadow-md hover:shadow-lg hover:scale-105 transform duration-200"
                    >
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-semibold">
                        {t("profile.warnUser")}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setShowWarningHistory(true);
                        loadWarningHistory();
                      }}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg hover:scale-105 transform duration-200"
                    >
                      <History className="w-5 h-5" />
                      <span className="font-semibold">
                        {t("profile.warningHistory")}
                      </span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* ✅ GRAPHIQUE avec handler de clic corrigé */}
        {dailyStats.length > 0 && (
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-6 border border-blue-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <TrendingUp className="w-7 h-7 mr-3 text-blue-600" />
              {t("profile.progressChart")}
            </h2>

            <div className="w-full h-[300px] sm:h-[350px] lg:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={allDaysData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                  onClick={handleChartClick}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    strokeOpacity={0.5}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    style={{ fontSize: "11px", fontWeight: 500 }}
                    tick={{ fill: "#6b7280" }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: "11px", fontWeight: 500 }}
                    tick={{ fill: "#6b7280" }}
                    domain={[0, "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(31, 41, 55, 0.95)",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      padding: "12px 16px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                    formatter={(value: any) => [`${value} pts`, ""]}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px", fontSize: "13px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey={
                      isOwnProfile
                        ? t("profile.myProgress")
                        : profile.pseudo || t("profile.user")
                    }
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", r: 5 }}
                    activeDot={{ r: 7 }}
                    animationDuration={1000}
                  />
                  {!isOwnProfile && currentUserDailyStats.length > 0 && (
                    <Line
                      type="monotone"
                      dataKey={t("profile.myProgress")}
                      stroke="#10b981"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ fill: "#10b981", r: 5 }}
                      activeDot={{ r: 7 }}
                      animationDuration={1000}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* BADGES */}
        <div className="bg-gradient-to-br from-white to-yellow-50 rounded-2xl shadow-xl p-6 border border-yellow-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Award className="w-7 h-7 mr-3 text-yellow-500" />
            {t("profile.badges")}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {badges.map((userBadge) => (
              <div
                key={userBadge.id}
                className="group relative bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-yellow-200 hover:border-yellow-400"
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-center text-sm leading-tight">
                    {userBadge.badges.name}
                  </h3>
                  <div className="absolute inset-0 bg-black bg-opacity-90 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3">
                    <p className="text-white text-xs text-center">
                      {userBadge.badges.description}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(userBadge.earned_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {badges.length === 0 && (
            <div className="text-center py-16">
              <Award className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">{t("profile.noBadges")}</p>
            </div>
          )}
        </div>

        {/* ✅ TITRES - Suppression du bouton Activer */}
        <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-xl p-6 border border-purple-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Star className="w-7 h-7 mr-3 text-purple-500" />
            {t("profile.titles")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {titles.map((userTitle) => (
              <div
                key={userTitle.id}
                className={`group relative rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-300 border-2 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300"
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg mb-2">
                      {userTitle.titles.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {userTitle.titles.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(userTitle.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {titles.length === 0 && (
            <div className="text-center py-16">
              <Star className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">{t("profile.noTitles")}</p>
            </div>
          )}
        </div>

        {/* DERNIÈRES PARTIES */}
        <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-xl p-6 border border-green-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <History className="w-7 h-7 mr-3 text-green-600" />
            {t("profile.recentGames")}
          </h2>

          {sessions.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">{t("profile.noGamesYet")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="group bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-green-400 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-5 h-5 text-green-600" />
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-green-600 transition-colors">
                          {session.quizzes?.title || t("profile.unknownQuiz")}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-lg">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">
                            {new Date(session.started_at).toLocaleDateString(
                              undefined,
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                          <span className="text-gray-400">- </span>
                          <span>
                            {new Date(session.started_at).toLocaleTimeString(
                              undefined,
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>

                        {session.mode && (
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-bold ${
                              session.mode === "duel"
                                ? "bg-gradient-to-r from-red-100 to-red-200 text-red-700"
                                : "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700"
                            }`}
                          >
                            {session.mode === "duel" ? "🎮 Duel" : "👤 Solo"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      {session.completed ? (
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-lg shadow-sm">
                          <Trophy className="w-4 h-4" />
                          <span className="text-sm font-bold">
                            {t("profile.completed")}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-semibold">
                            {t("profile.inProgress")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center">
                      <p className="text-xs text-purple-600 font-semibold mb-1">
                        {t("profile.score")}
                      </p>
                      <p className="text-2xl font-bold text-purple-700">
                        {session.score || 0}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center">
                      <p className="text-xs text-blue-600 font-semibold mb-1">
                        {t("profile.accuracy")}
                      </p>
                      <p className="text-2xl font-bold text-blue-700">
                        {Math.round(session.accuracy_percentage || 0)}%
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center">
                      <p className="text-xs text-green-600 font-semibold mb-1">
                        {t("profile.questions")}
                      </p>
                      <p className="text-2xl font-bold text-green-700">
  {session.correct_answers ?? 0}/{session.total_questions ?? 0}
</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 text-center">
                      <p className="text-xs text-orange-600 font-semibold mb-1">
                        {t("profile.time")}
                      </p>
                      <p className="text-2xl font-bold text-orange-700">
                        {session.time_taken_seconds
                          ? `${Math.floor(session.time_taken_seconds / 60)}:${(
                              session.time_taken_seconds % 60
                            )
                              .toString()
                              .padStart(2, "0")}`
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODALS - Conservées telles quelles */}
      {showStreakModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowStreakModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-500" />
                {t("profile.streakDetails")}
              </h3>
              <button
                onClick={() => setShowStreakModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4">
                <p className="text-sm text-orange-600 font-semibold mb-1">
                  {t("profile.currentStreak")}
                </p>
                <p className="text-4xl font-bold text-orange-600 flex items-center gap-2">
                  <Flame className="w-8 h-8" />
                  {profile.current_streak} {getDayText(profile.current_streak)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4">
                <p className="text-sm text-yellow-600 font-semibold mb-1">
                  {t("profile.longestStreak")}
                </p>
                <p className="text-4xl font-bold text-yellow-600 flex items-center gap-2">
                  <Trophy className="w-8 h-8" />
                  {profile.longest_streak} {getDayText(profile.longest_streak)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-semibold mb-2">
                  {t("profile.keepGoing")}
                </p>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-gray-700">
                    {t("profile.playTodayToKeepStreak")}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowStreakModal(false)}
              className="w-full mt-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-colors font-semibold"
            >
              {t("profile.close")}
            </button>
          </div>
        </div>
      )}

      {selectedDataPoint && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedDataPoint(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                {t("profile.dayDetails")}
              </h3>
              <button
                onClick={() => setSelectedDataPoint(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">
                  {t("profile.date")}
                </p>
                <p className="text-xl font-bold text-gray-800">
                  {selectedDataPoint.name}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-semibold mb-1">
                  {isOwnProfile
                    ? t("profile.myScore")
                    : `${profile.pseudo} - ${t("profile.score")}`}
                </p>
                <p className="text-3xl font-bold text-blue-700">
                  {selectedDataPoint[
                    isOwnProfile ? t("profile.myProgress") : profile.pseudo
                  ] || 0}{" "}
                  pts
                </p>
              </div>

              {!isOwnProfile &&
                selectedDataPoint[t("profile.myProgress")] !== undefined && (
                  <>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                      <p className="text-sm text-green-600 font-semibold mb-1">
                        {t("profile.myScore")}
                      </p>
                      <p className="text-3xl font-bold text-green-700">
                        {selectedDataPoint[t("profile.myProgress")]} pts
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                      <p className="text-sm text-purple-600 font-semibold mb-1">
                        {t("profile.difference")}
                      </p>
                      <p
                        className={`text-3xl font-bold ${
                          selectedDataPoint[t("profile.myProgress")] >
                          selectedDataPoint[profile.pseudo]
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {selectedDataPoint[t("profile.myProgress")] >
                        selectedDataPoint[profile.pseudo]
                          ? "+"
                          : ""}
                        {selectedDataPoint[t("profile.myProgress")] -
                          selectedDataPoint[profile.pseudo]}{" "}
                        pts
                      </p>
                    </div>
                  </>
                )}
            </div>

            <button
              onClick={() => setSelectedDataPoint(null)}
              className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              {t("profile.close")}
            </button>
          </div>
        </div>
      )}

      {showWarnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {t("profile.warnUser")}
              </h3>
              <button onClick={() => setShowWarnModal(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <textarea
              value={warnReason}
              onChange={(e) => setWarnReason(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 outline-none mb-4"
              rows={4}
              placeholder={t("profile.warnReason")}
            />
            <button
              onClick={sendWarning}
              disabled={sending || !warnReason.trim()}
              className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-semibold"
            >
              {t("profile.sendWarning")}
            </button>
          </div>
        </div>
      )}

      {showWarningHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {t("profile.warningHistory")}
              </h3>
              <button onClick={() => setShowWarningHistory(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              {warningHistory.map((warning) => (
                <div
                  key={warning.id}
                  className="border-2 border-gray-200 rounded-lg p-4"
                >
                  <p className="font-semibold text-gray-800 mb-2">
                    {warning.reason}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("profile.status")}: {warning.status}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(warning.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
              {warningHistory.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  {t("profile.noWarnings")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
