import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { MessageCircle, Send, ArrowLeft } from "lucide-react";
import type { Database } from "../../lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

interface MessageWithUser extends ChatMessage {
  from_profile: Profile | null;
}

interface ChatPageProps {
  friendId?: string;
  onNavigate: (view: string) => void;
}

export function ChatPage({ friendId, onNavigate }: ChatPageProps) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { refreshNotifications } = useNotifications();
  const [friends, setFriends] = useState<Profile[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFriends();

    if (!profile) return;

    const allMessagesSubscription = supabase
      .channel("all_messages_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `to_user_id=eq.${profile.id}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (selectedFriend?.id !== newMsg.from_user_id) {
            setUnreadCounts((prev) => ({
              ...prev,
              [newMsg.from_user_id]: (prev[newMsg.from_user_id] || 0) + 1,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      allMessagesSubscription.unsubscribe();
    };
  }, [profile, selectedFriend]);

  useEffect(() => {
    if (friendId) {
      const friend = friends.find((f) => f.id === friendId);
      if (friend) setSelectedFriend(friend);
    }
  }, [friendId, friends]);

  useEffect(() => {
    if (selectedFriend && profile) {
      loadMessages();
      markMessagesAsRead();

      const subscription = supabase
        .channel(`chat_${profile.id}_${selectedFriend.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
          },
          (payload) => {
            const newMsg = payload.new as ChatMessage;
            if (
              (newMsg.from_user_id === selectedFriend.id &&
                newMsg.to_user_id === profile.id) ||
              (newMsg.from_user_id === profile.id &&
                newMsg.to_user_id === selectedFriend.id)
            ) {
              loadMessages();
              if (newMsg.from_user_id === selectedFriend.id) {
                markMessagesAsRead();
              }
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedFriend, profile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadFriends = async () => {
    if (!profile) return;

    const { data: friendshipsAsSender } = await supabase
      .from("friendships")
      .select("friend_profile:profiles!friendships_friend_id_fkey(*)")
      .eq("user_id", profile.id)
      .eq("status", "accepted")
      .eq("friend_profile.is_banned", false);

    const { data: friendshipsAsReceiver } = await supabase
      .from("friendships")
      .select("user_profile:profiles!friendships_user_id_fkey(*)")
      .eq("friend_id", profile.id)
      .eq("status", "accepted")
      .eq("user_profile.is_banned", false);

    const allFriends: Profile[] = [
      ...(friendshipsAsSender
        ?.map((f: any) => f.friend_profile)
        .filter(Boolean) || []),
      ...(friendshipsAsReceiver
        ?.map((f: any) => f.user_profile)
        .filter(Boolean) || []),
    ];

    setFriends(allFriends);

    const counts: Record<string, number> = {};
    for (const friend of allFriends) {
      const { count } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("from_user_id", friend.id)
        .eq("to_user_id", profile.id)
        .eq("is_read", false);
      counts[friend.id] = count || 0;
    }
    setUnreadCounts(counts);
  };

  const loadMessages = async () => {
    if (!profile || !selectedFriend) return;

    const { data } = await supabase
      .from("chat_messages")
      .select("*, from_profile:profiles!chat_messages_from_user_id_fkey(*)")
      .or(
        `and(from_user_id.eq.${profile.id},to_user_id.eq.${selectedFriend.id}),and(from_user_id.eq.${selectedFriend.id},to_user_id.eq.${profile.id})`
      )
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data as MessageWithUser[]);
    }
  };

  const markMessagesAsRead = async () => {
    if (!profile || !selectedFriend) return;

    await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("to_user_id", profile.id)
      .eq("from_user_id", selectedFriend.id)
      .eq("is_read", false);

    setUnreadCounts((prev) => ({ ...prev, [selectedFriend.id]: 0 }));
    refreshNotifications();
  };

  const sendMessage = async () => {
    if (!profile || !selectedFriend || !newMessage.trim()) return;

    setLoading(true);

    try {
      await supabase.from("chat_messages").insert({
        from_user_id: profile.id,
        to_user_id: selectedFriend.id,
        message: newMessage.trim(),
      });

      setNewMessage("");
      loadMessages();
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => onNavigate("quizzes")}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t("chat.backToQuizzes")}
        </button>
      </div>

      <div
        className="bg-white rounded-xl shadow-md overflow-hidden"
        style={{ height: "70vh" }}
      >
        <div className="flex h-full">
          <div className="w-80 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 bg-emerald-600">
              <h2 className="text-xl font-bold text-white flex items-center">
                <MessageCircle className="w-6 h-6 mr-2" />
                {t("chat.messages")}
              </h2>
            </div>

            <div className="divide-y divide-gray-200">
              {friends.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">{t("chat.noFriends")}</p>
                </div>
              ) : (
                friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors relative ${
                      selectedFriend?.id === friend.id ? "bg-emerald-50" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center relative">
                        <span className="text-emerald-600 font-bold text-lg">
                          {friend.pseudo?.charAt(0).toUpperCase() || "?"}
                        </span>
                        {unreadCounts[friend.id] > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                            {unreadCounts[friend.id]}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {friend.pseudo || t("chat.user")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("profile.level")} {friend.level || 1}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {selectedFriend ? (
              <>
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div
                    className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() =>
                      onNavigate?.("view-profile", {
                        userId: selectedFriend.id,
                      })
                    }
                  >
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 font-bold">
                        {selectedFriend.pseudo?.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 hover:text-emerald-600 transition-colors">
                        {selectedFriend.pseudo || t("chat.user")}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {t("profile.level")} {selectedFriend.level || 1}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">{t("chat.noMessages")}</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.from_user_id === profile?.id;
                      const senderName =
                        message.from_profile?.pseudo || t("chat.deletedUser");

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwnMessage
                                ? "bg-emerald-600 text-white"
                                : "bg-white border border-gray-200 text-gray-800"
                            }`}
                          >
                            {!isOwnMessage && (
                              <p className="text-xs font-semibold mb-1 text-emerald-600">
                                {senderName}
                              </p>
                            )}
                            <p className="break-words">{message.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwnMessage
                                  ? "text-emerald-100"
                                  : "text-gray-500"
                              }`}
                            >
                              {new Date(message.created_at).toLocaleTimeString(
                                undefined,
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-200 bg-white">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex space-x-2"
                  >
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t("chat.typeMessage")}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || loading}
                      className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{t("chat.selectFriend")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
