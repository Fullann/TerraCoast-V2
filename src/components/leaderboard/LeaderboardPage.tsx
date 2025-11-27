import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  Calendar,
  Users,
  Flame,
} from "lucide-react";
import type { Database } from "../../lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface LeaderboardEntry extends Profile {
  total_score: number;
  games_played: number;
  rank?: number;
}

interface LeaderboardPageProps {
  onNavigate?: (view: string, data?: any) => void;
}

export function LeaderboardPage({ onNavigate }: LeaderboardPageProps) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"global" | "friends">("global");
  const [period, setPeriod] = useState<"monthly" | "alltime">("monthly");

  useEffect(() => {
    loadLeaderboard();
  }, [view, period]);

  const loadLeaderboard = async () => {
    setLoading(true);

    let profiles: Profile[] = [];

    if (view === "global") {
      const orderBy =
        period === "monthly" ? "monthly_score" : "experience_points";
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_banned", false)
        .order(orderBy, { ascending: false })
        .limit(100);

      profiles = data || [];
    } else if (view === "friends" && profile) {
      const { data: friendshipsAsSender } = await supabase
        .from("friendships")
        .select("friend_profile:profiles!friendships_friend_id_fkey(*)")
        .eq("user_id", profile.id)
        .eq("status", "accepted");

      const { data: friendshipsAsReceiver } = await supabase
        .from("friendships")
        .select("user_profile:profiles!friendships_user_id_fkey(*)")
        .eq("friend_id", profile.id)
        .eq("status", "accepted");

      const senderFriends =
        friendshipsAsSender
          ?.map((f: any) => f.friend_profile)
          .filter((f) => f && !f.is_banned) || [];
      const receiverFriends =
        friendshipsAsReceiver
          ?.map((f: any) => f.user_profile)
          .filter((f) => f && !f.is_banned) || [];

      const friendIds = new Set<string>();
      const uniqueFriends: Profile[] = [];

      for (const friend of [...senderFriends, ...receiverFriends]) {
        if (!friendIds.has(friend.id)) {
          friendIds.add(friend.id);
          uniqueFriends.push(friend);
        }
      }

      profiles = [profile, ...uniqueFriends];
    }

    if (profiles.length > 0) {
      const enrichedData: LeaderboardEntry[] = profiles.map((p) => {
        if (period === "monthly") {
          return {
            ...p,
            total_score: p.monthly_score || 0,
            games_played: p.monthly_games_played || 0,
          };
        } else {
          // Pour "all time", utiliser experience_points comme score total
          return {
            ...p,
            total_score: p.experience_points || 0,
            games_played: 0, // Pas de compteur de parties pour all-time
          };
        }
      });

      // Trier et ajouter le rang
      enrichedData.sort((a, b) => b.total_score - a.total_score);
      enrichedData.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setLeaderboard(enrichedData);
    } else {
      setLeaderboard([]);
    }

    setLoading(false);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-8 h-8 text-yellow-500" />;
    if (index === 1)
      return (
        <div className="relative w-8 h-8">
          <Medal className="w-8 h-8 text-gray-400" />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
            2
          </span>
        </div>
      );
    if (index === 2)
      return (
        <div className="relative w-8 h-8">
          <Medal className="w-8 h-8 text-amber-600" />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-amber-800">
            3
          </span>
        </div>
      );
    return (
      <span className="text-lg font-bold text-gray-500 w-8 text-center">
        #{index + 1}
      </span>
    );
  };

  const getRankBackground = (index: number, entry: LeaderboardEntry) => {
    const isCurrentUser = entry.id === profile?.id;

    if (index === 0)
      return `border-4 ${
        isCurrentUser
          ? "border-yellow-500 bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 shadow-2xl"
          : "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-100 shadow-xl"
      }`;
    if (index === 1)
      return `border-4 ${
        isCurrentUser
          ? "border-gray-400 bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 shadow-2xl"
          : "border-gray-300 bg-gradient-to-br from-gray-50 to-gray-200 shadow-lg"
      }`;
    if (index === 2)
      return `border-4 ${
        isCurrentUser
          ? "border-amber-500 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 shadow-2xl"
          : "border-amber-400 bg-gradient-to-br from-amber-50 to-orange-100 shadow-lg"
      }`;
    if (index < 10 && period === "monthly")
      return `border-2 ${
        isCurrentUser
          ? "border-emerald-500 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 shadow-xl"
          : "border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-md"
      }`;

    return `border-2 ${
      isCurrentUser
        ? "border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg"
        : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"
    }`;
  };

  const getGameText = (count: number) => {
    return count <= 1 ? t("leaderboard.game") : t("leaderboard.games");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <Trophy className="w-10 h-10 mr-3 text-emerald-600" />
          {t("leaderboard.title")}
        </h1>
        <p className="text-gray-600">{t("leaderboard.subtitle")}</p>
      </div>

      {/* Sélecteur Global/Amis */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-md p-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setView("global")}
            className={`flex items-center justify-center px-6 py-3 rounded-xl font-bold transition-all ${
              view === "global"
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg scale-105"
                : "bg-white text-gray-600 hover:bg-gray-50 shadow"
            }`}
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            {t("leaderboard.global")}
          </button>
          <button
            onClick={() => setView("friends")}
            className={`flex items-center justify-center px-6 py-3 rounded-xl font-bold transition-all ${
              view === "friends"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105"
                : "bg-white text-gray-600 hover:bg-gray-50 shadow"
            }`}
          >
            <Users className="w-5 h-5 mr-2" />
            {t("leaderboard.friends")}
          </button>
        </div>
      </div>

      {/* Sélecteur Mensuel/Tout temps avec styles différents */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md p-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPeriod("monthly")}
            className={`flex flex-col items-center justify-center px-6 py-4 rounded-xl font-bold transition-all ${
              period === "monthly"
                ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg scale-105"
                : "bg-white text-gray-600 hover:bg-gray-50 shadow"
            }`}
          >
            <Calendar className="w-6 h-6 mb-1" />
            <span className="text-sm">{t("leaderboard.thisMonth")}</span>
          </button>
          <button
            onClick={() => setPeriod("alltime")}
            className={`flex flex-col items-center justify-center px-6 py-4 rounded-xl font-bold transition-all ${
              period === "alltime"
                ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg scale-105"
                : "bg-white text-gray-600 hover:bg-gray-50 shadow"
            }`}
          >
            <Flame className="w-6 h-6 mb-1" />
            <span className="text-sm">{t("leaderboard.allTime")}</span>
          </button>
        </div>
        {period === "monthly" && (
          <p className="text-sm text-gray-600 mt-3 text-center bg-white bg-opacity-70 rounded-lg py-2 px-4">
            {t("leaderboard.monthlyReset")}
          </p>
        )}
      </div>

      {/* Liste du classement */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("leaderboard.loading")}</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {t("leaderboard.noPlayers")}
          </h3>
          <p className="text-gray-500">{t("leaderboard.emptyLeaderboard")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.id}
              onClick={() => onNavigate?.("view-profile", { userId: entry.id })}
              className={`${getRankBackground(
                index,
                entry
              )} rounded-xl p-6 transition-all hover:scale-[1.02] cursor-pointer relative overflow-hidden`}
            >
              {/* Badge utilisateur actuel */}
              {entry.id === profile?.id && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  {t("leaderboard.you")}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {/* Icône de rang */}
                  <div className="flex-shrink-0">{getRankIcon(index)}</div>

                  {/* Info joueur */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-800 truncate">
                      {entry.pseudo}
                    </h3>
                    <div className="flex items-center space-x-4 mt-1 flex-wrap">
                      <span className="text-sm text-gray-600 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {t("profile.level")} {entry.level}
                      </span>
                      {period === "monthly" && entry.games_played > 0 && (
                        <span className="text-sm text-gray-500">
                          {entry.games_played} {getGameText(entry.games_played)}
                        </span>
                      )}
                      {entry.top10_count > 0 && index < 10 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow">
                          <Crown className="w-3 h-3 mr-1" />
                          {entry.top10_count}x {t("leaderboard.top10")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right ml-4">
                  <p className="text-3xl font-bold text-emerald-600">
                    {entry.total_score.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {period === "monthly"
                      ? t("leaderboard.monthlyPoints")
                      : t("leaderboard.totalXP")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
