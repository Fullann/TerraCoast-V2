import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  Users,
  UserPlus,
  UserCheck,
  X,
  MessageCircle,
  UserMinus,
  Sparkles,
} from "lucide-react";
import type { Database } from "../../lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Friendship = Database["public"]["Tables"]["friendships"]["Row"];

interface FriendData extends Friendship {
  friend_profile?: Profile;
  user_profile?: Profile;
}

interface FriendsPageProps {
  onNavigate?: (view: string, data?: any) => void;
}

export function FriendsPage({ onNavigate }: FriendsPageProps = {}) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [existingFriendIds, setExistingFriendIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    loadFriends();
    loadSuggestions();
  }, [profile]);

  const loadFriends = async () => {
    if (!profile) return;

    const { data: friendshipsAsSender } = await supabase
      .from("friendships")
      .select("*, friend_profile:profiles!friendships_friend_id_fkey(*)")
      .eq("user_id", profile.id)
      .eq("status", "accepted");

    const { data: friendshipsAsReceiver } = await supabase
      .from("friendships")
      .select("*, user_profile:profiles!friendships_user_id_fkey(*)")
      .eq("friend_id", profile.id)
      .eq("status", "accepted");

    const validFriendsAsSender = (friendshipsAsSender || []).filter(
      (f) => !f.friend_profile?.is_banned
    ) as FriendData[];

    const validFriendsAsReceiver = (friendshipsAsReceiver || []).filter(
      (f) => !f.user_profile?.is_banned
    ) as FriendData[];

    const allFriends = [...validFriendsAsSender, ...validFriendsAsReceiver];

    setFriends(allFriends);

    const { data: pending } = await supabase
      .from("friendships")
      .select("*, user_profile:profiles!friendships_user_id_fkey(*)")
      .eq("friend_id", profile.id)
      .eq("status", "pending");

    const validPending = (pending || []).filter(
      (p) => !p.user_profile?.is_banned
    ) as FriendData[];

    setPendingRequests(validPending);

    const friendIds = new Set<string>();
    allFriends.forEach((f) => {
      if (f.friend_profile) friendIds.add(f.friend_profile.id);
      if (f.user_profile) friendIds.add(f.user_profile.id);
    });
    validPending.forEach((p) => {
      if (p.user_profile) friendIds.add(p.user_profile.id);
    });
    setExistingFriendIds(friendIds);
  };

  const loadSuggestions = async () => {
    if (!profile) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", profile.id)
      .eq("is_banned", false)
      .limit(50);

    if (data) {
      const shuffled = data.sort(() => Math.random() - 0.5).slice(0, 4);
      setSuggestions(shuffled);
    }
  };

  const searchUsers = async () => {
    if (!searchTerm.trim() || !profile) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("pseudo", `%${searchTerm}%`)
      .neq("id", profile.id)
      .eq("is_banned", false)
      .limit(10);

    const filtered = (data || []).filter((u) => !existingFriendIds.has(u.id));
    setSearchResults(filtered);
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!profile) return;

    try {
      await supabase.from("friendships").insert({
        user_id: profile.id,
        friend_id: friendId,
        status: "pending",
      });

      alert(t("friends.requestSent"));
      setSearchResults([]);
      setSearchTerm("");
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    await supabase
      .from("friendships")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", friendshipId);

    loadFriends();
  };

  const rejectFriendRequest = async (friendshipId: string) => {
    await supabase.from("friendships").delete().eq("id", friendshipId);

    loadFriends();
  };

  const removeFriend = async (friendshipId: string, friendName: string) => {
    if (!confirm(t("friends.confirmRemove").replace("{name}", friendName)))
      return;

    await supabase.from("friendships").delete().eq("id", friendshipId);

    loadFriends();
    loadSuggestions();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <Users className="w-10 h-10 mr-3 text-emerald-600" />
          {t("friends.title")}
        </h1>
        <p className="text-gray-600">{t("friends.subtitle")}</p>
      </div>

      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {t("friends.pendingRequests")} ({pendingRequests.length})
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between bg-white p-4 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {request.user_profile?.pseudo}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("profile.level")} {request.user_profile?.level}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => acceptFriendRequest(request.id)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    title={t("friends.accept")}
                  >
                    <UserCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => rejectFriendRequest(request.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    title={t("friends.reject")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-amber-500" />
            {t("friends.suggestions")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {suggestions
              .filter((s) => !existingFriendIds.has(s.id))
              .map((user) => (
                <div
                  key={user.id}
                  className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors text-center"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold text-xl">
                      {user.pseudo.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-800 truncate">
                    {user.pseudo}
                  </p>
                  <p className="text-xs text-gray-600 mb-3">
                    {t("profile.level")} {user.level}
                  </p>
                  <button
                    onClick={() => {
                      sendFriendRequest(user.id);
                      setSuggestions((prev) =>
                        prev.filter((s) => s.id !== user.id)
                      );
                    }}
                    className="w-full px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    {t("friends.add")}
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {t("friends.searchTitle")}
        </h2>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder={t("friends.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchUsers()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          />
          <button
            onClick={searchUsers}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {t("common.search")}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{user.pseudo}</p>
                    <p className="text-sm text-gray-600">
                      {t("profile.level")} {user.level}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => sendFriendRequest(user.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t("friends.add")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {t("friends.myFriendsTitle")} ({friends.length})
        </h2>

        {friends.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t("friends.noFriends")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map((friendship) => {
              const friendProfile =
                friendship.friend_profile || friendship.user_profile;
              if (!friendProfile) return null;

              return (
                <div
                  key={friendship.id}
                  className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-emerald-300 transition-colors"
                >
                  <div
                    className="flex items-center space-x-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() =>
                      onNavigate?.("view-profile", { userId: friendProfile.id })
                    }
                  >
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 font-bold text-lg">
                        {friendProfile.pseudo.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 hover:text-emerald-600 transition-colors">
                        {friendProfile.pseudo}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("profile.level")} {friendProfile.level}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        onNavigate?.("chat", { friendId: friendProfile.id })
                      }
                      className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      title={t("friends.sendMessage")}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        removeFriend(friendship.id, friendProfile.pseudo)
                      }
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      title={t("friends.removeFriend")}
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
