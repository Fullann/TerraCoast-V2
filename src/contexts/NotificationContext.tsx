import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

interface DuelNotification {
  type: "invitation" | "accepted" | "completed";
  from: string;
  quizTitle: string;
  result?: "won" | "lost" | "draw";
}

interface MessageNotification {
  from: string;
  message: string;
}

interface FriendRequestNotification {
  from: string;
}

interface NotificationContextType {
  unreadMessages: number;
  pendingDuels: number;
  pendingFriendRequests: number;
  duelNotification: DuelNotification | null;
  messageNotification: MessageNotification | null;
  friendRequestNotification: FriendRequestNotification | null;
  clearDuelNotification: () => void;
  clearMessageNotification: () => void;
  clearFriendRequestNotification: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingDuels, setPendingDuels] = useState(0);
  const [pendingFriendRequests, setPendingFriendRequests] = useState(0);
  const [duelNotification, setDuelNotification] =
    useState<DuelNotification | null>(null);
  const [messageNotification, setMessageNotification] =
    useState<MessageNotification | null>(null);
  const [friendRequestNotification, setFriendRequestNotification] =
    useState<FriendRequestNotification | null>(null);

  const refreshNotifications = async () => {
    if (!profile) return;

    const { count: messagesCount } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("to_user_id", profile.id)
      .eq("is_read", false);

    setUnreadMessages(messagesCount || 0);

    const { count: duelsCount } = await supabase
      .from("duel_invitations")
      .select("*", { count: "exact", head: true })
      .eq("to_user_id", profile.id)
      .eq("status", "pending");

    setPendingDuels(duelsCount || 0);

    const { count: friendRequestsCount } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("friend_id", profile.id)
      .eq("status", "pending");

    setPendingFriendRequests(friendRequestsCount || 0);
  };

  const clearDuelNotification = () => setDuelNotification(null);
  const clearMessageNotification = () => setMessageNotification(null);
  const clearFriendRequestNotification = () =>
    setFriendRequestNotification(null);

  useEffect(() => {
    if (!profile) return;

    refreshNotifications();

    const messagesSubscription = supabase
      .channel("notifications_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `to_user_id=eq.${profile.id}`,
        },
        async (payload) => {
          console.log("💬 Nouveau message reçu:", payload);

          const newMessage = payload.new as any;

          const { data: fromUser } = await supabase
            .from("profiles")
            .select("pseudo")
            .eq("id", newMessage.from_user_id)
            .single();

          if (fromUser) {
            setMessageNotification({
              from: fromUser.pseudo,
              message: newMessage.message,
            });

            setUnreadMessages((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    const friendRequestsSubscription = supabase
      .channel("notifications_friend_requests")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "friendships",
          filter: `friend_id=eq.${profile.id}`,
        },
        async (payload) => {
          console.log("👥 Nouvelle demande d'ami reçue:", payload);

          const newRequest = payload.new as any;

          const { data: fromUser } = await supabase
            .from("profiles")
            .select("pseudo")
            .eq("id", newRequest.user_id)
            .single();

          if (fromUser) {
            setFriendRequestNotification({
              from: fromUser.pseudo,
            });

            setPendingFriendRequests((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    const duelInvitationsSubscription = supabase
      .channel("notifications_duel_invitations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "duel_invitations",
          filter: `to_user_id=eq.${profile.id}`,
        },
        async (payload) => {
          console.log("📨 Nouvelle invitation de duel:", payload);

          const newInvitation = payload.new as any;

          const { data: fromUser } = await supabase
            .from("profiles")
            .select("pseudo")
            .eq("id", newInvitation.from_user_id)
            .single();

          const { data: quiz } = await supabase
            .from("quizzes")
            .select("title")
            .eq("id", newInvitation.quiz_id)
            .single();

          if (fromUser && quiz) {
            setDuelNotification({
              type: "invitation",
              from: fromUser.pseudo,
              quizTitle: quiz.title,
            });

            setPendingDuels((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    const duelAcceptedSubscription = supabase
      .channel("notifications_duel_accepted")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "duel_invitations",
          filter: `from_user_id=eq.${profile.id}`,
        },
        async (payload) => {
          const updatedInvitation = payload.new as any;

          if (updatedInvitation.status === "accepted") {
            console.log("✅ Invitation acceptée:", payload);

            const { data: toUser } = await supabase
              .from("profiles")
              .select("pseudo")
              .eq("id", updatedInvitation.to_user_id)
              .single();

            const { data: quiz } = await supabase
              .from("quizzes")
              .select("title")
              .eq("id", updatedInvitation.quiz_id)
              .single();

            if (toUser && quiz) {
              setDuelNotification({
                type: "accepted",
                from: toUser.pseudo,
                quizTitle: quiz.title,
              });
            }
          }
        }
      )
      .subscribe();

    const duelsCompletedSubscription = supabase
      .channel("notifications_duels_completed")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "duels",
          filter: `status=eq.completed`,
        },
        async (payload) => {
          const completedDuel = payload.new as any;

          if (
            completedDuel.player1_id !== profile.id &&
            completedDuel.player2_id !== profile.id
          ) {
            return;
          }

          console.log("🏁 Duel terminé:", payload);

          const opponentId =
            completedDuel.player1_id === profile.id
              ? completedDuel.player2_id
              : completedDuel.player1_id;

          const { data: opponent } = await supabase
            .from("profiles")
            .select("pseudo")
            .eq("id", opponentId)
            .single();

          const { data: quiz } = await supabase
            .from("quizzes")
            .select("title")
            .eq("id", completedDuel.quiz_id)
            .single();

          if (opponent && quiz) {
            let result: "won" | "lost" | "draw" = "draw";
            if (completedDuel.winner_id === profile.id) {
              result = "won";
            } else if (completedDuel.winner_id === opponentId) {
              result = "lost";
            }

            setDuelNotification({
              type: "completed",
              from: opponent.pseudo,
              quizTitle: quiz.title,
              result,
            });
          }
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      friendRequestsSubscription.unsubscribe();
      duelInvitationsSubscription.unsubscribe();
      duelAcceptedSubscription.unsubscribe();
      duelsCompletedSubscription.unsubscribe();
    };
  }, [profile]);

  return (
    <NotificationContext.Provider
      value={{
        unreadMessages,
        pendingDuels,
        pendingFriendRequests,
        duelNotification,
        messageNotification,
        friendRequestNotification,
        clearDuelNotification,
        clearMessageNotification,
        clearFriendRequestNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
}
