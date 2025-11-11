import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useNotifications } from "../../contexts/NotificationContext";
import {
  Swords,
  Trophy,
  Clock,
  Users,
  Plus,
  Target,
  Zap,
  Award,
  TrendingUp,
  Crown,
} from "lucide-react";
import type { Database } from "../../lib/database.types";

type Duel = Database["public"]["Tables"]["duels"]["Row"];
type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type DuelInvitation = Database["public"]["Tables"]["duel_invitations"]["Row"];

interface DuelWithDetails extends Duel {
  quizzes: Quiz;
  player1: Profile;
  player2: Profile;
  player1_session?: {
    score: number;
    correct_answers: number;
    total_questions: number;
  };
  player2_session?: {
    score: number;
    correct_answers: number;
    total_questions: number;
  };
}

interface InvitationWithDetails extends DuelInvitation {
  from_user: Profile;
  to_user: Profile;
  quizzes: Quiz;
}

interface DuelsPageProps {
  onNavigate: (view: string, data?: any) => void;
}

export function DuelsPage({ onNavigate }: DuelsPageProps) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { refreshNotifications } = useNotifications();
  const [activeDuels, setActiveDuels] = useState<DuelWithDetails[]>([]);
  const [completedDuels, setCompletedDuels] = useState<DuelWithDetails[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    InvitationWithDetails[]
  >([]);
  const [sentInvitations, setSentInvitations] = useState<
    InvitationWithDetails[]
  >([]);
  const [activeTab, setActiveTab] = useState<
    "active" | "completed" | "invitations"
  >("active");
  const [showCreateInvitation, setShowCreateInvitation] = useState(false);

  useEffect(() => {
    loadDuels();
    loadInvitations();

    const subscription = supabase
      .channel("duel_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "duels" },
        () => {
          loadDuels();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "duel_invitations" },
        () => {
          loadInvitations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profile]);

  const loadDuels = async () => {
    if (!profile) return;

    const { data: active } = await supabase
      .from("duels")
      .select(
        "*, quizzes(*), player1:profiles!duels_player1_id_fkey(*), player2:profiles!duels_player2_id_fkey(*)"
      )
      .or(`player1_id.eq.${profile.id},player2_id.eq.${profile.id}`)
      .in("status", ["pending", "in_progress"])
      .order("created_at", { ascending: false });

    // ✅ Filtrer les duels avec des joueurs bannis
    const filteredActive = active?.filter(
      (duel: any) => !duel.player1?.is_banned && !duel.player2?.is_banned
    );

    if (filteredActive) setActiveDuels(filteredActive as DuelWithDetails[]);

    const { data: completed } = await supabase
      .from("duels")
      .select(
        "*, quizzes(*), player1:profiles!duels_player1_id_fkey(*), player2:profiles!duels_player2_id_fkey(*)"
      )
      .or(`player1_id.eq.${profile.id},player2_id.eq.${profile.id}`)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(10);

    if (completed) {
      // ✅ Filtrer les duels complétés avec des joueurs bannis
      const filteredCompleted = completed.filter(
        (duel: any) => !duel.player1?.is_banned && !duel.player2?.is_banned
      );

      const enrichedDuels = await Promise.all(
        filteredCompleted.map(async (duel) => {
          const { data: p1Session } = await supabase
            .from("game_sessions")
            .select("score, correct_answers, total_questions")
            .eq("id", duel.player1_session_id)
            .maybeSingle();

          const { data: p2Session } = await supabase
            .from("game_sessions")
            .select("score, correct_answers, total_questions")
            .eq("id", duel.player2_session_id)
            .maybeSingle();

          return {
            ...duel,
            player1_session: p1Session || undefined,
            player2_session: p2Session || undefined,
          };
        })
      );
      setCompletedDuels(enrichedDuels as DuelWithDetails[]);
    }
  };

  const loadInvitations = async () => {
    if (!profile) return;

    const { data: pending } = await supabase
      .from("duel_invitations")
      .select(
        "*, from_user:profiles!duel_invitations_from_user_id_fkey(*), to_user:profiles!duel_invitations_to_user_id_fkey(*), quizzes(*)"
      )
      .eq("to_user_id", profile.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    const filteredPending = pending?.filter(
      (inv: any) => !inv.from_user?.is_banned && !inv.to_user?.is_banned
    );

    if (filteredPending)
      setPendingInvitations(filteredPending as InvitationWithDetails[]);

    const { data: sent } = await supabase
      .from("duel_invitations")
      .select(
        "*, from_user:profiles!duel_invitations_from_user_id_fkey(*), to_user:profiles!duel_invitations_to_user_id_fkey(*), quizzes(*)"
      )
      .eq("from_user_id", profile.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    const filteredSent = sent?.filter(
      (inv: any) => !inv.from_user?.is_banned && !inv.to_user?.is_banned
    );

    if (filteredSent)
      setSentInvitations(filteredSent as InvitationWithDetails[]);
  };

  const acceptInvitation = async (invitation: InvitationWithDetails) => {
    refreshNotifications();
    if (!profile) return;

    const { data: duel, error: duelError } = await supabase
      .from("duels")
      .insert({
        quiz_id: invitation.quiz_id,
        player1_id: invitation.from_user_id,
        player2_id: invitation.to_user_id,
        status: "in_progress",
      })
      .select()
      .single();

    if (duelError) {
      console.error("Error creating duel:", duelError);
      return;
    }

    await supabase
      .from("duel_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    // ✅ Recharger les données
    loadDuels();
    loadInvitations();

    if (duel) {
      onNavigate("play-duel", {
        duelId: duel.id,
        quizId: invitation.quiz_id,
      });
    }
  };

  const declineInvitation = async (invitationId: string) => {
    refreshNotifications();
    await supabase
      .from("duel_invitations")
      .update({ status: "declined" })
      .eq("id", invitationId);

    loadInvitations();
  };

  const joinDuel = async (duel: DuelWithDetails) => {
    onNavigate("play-duel", { duelId: duel.id, quizId: duel.quiz_id });
  };

  const getDuelStatus = (duel: DuelWithDetails) => {
    if (duel.status === "completed") {
      if (!duel.winner_id) return t("duels.draw");
      if (duel.winner_id === profile?.id) return t("duels.victory");
      return t("duels.defeat");
    }
    if (duel.status === "in_progress") return t("duels.inProgress");
    return t("duels.waiting");
  };

  const getOpponent = (duel: DuelWithDetails) => {
    return duel.player1_id === profile?.id ? duel.player2 : duel.player1;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
              <Swords className="w-10 h-10 mr-3 text-emerald-600" />
              {t("duels.title")}
            </h1>
            <p className="text-gray-600">{t("duels.subtitle")}</p>
          </div>
          <button
            onClick={() => setShowCreateInvitation(true)}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            {t("duels.createDuel")}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "active"
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Swords className="w-4 h-4 inline mr-2" />
            {t("duels.activeDuels")} ({activeDuels.length})
          </button>
          <button
            onClick={() => setActiveTab("invitations")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "invitations"
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            {t("duels.invitations")} ({pendingInvitations.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "completed"
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            {t("duels.history")}
          </button>
        </div>
      </div>

      {activeTab === "active" && (
        <div className="space-y-4">
          {activeDuels.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Swords className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {t("duels.noActiveDuels")}
              </h3>
              <p className="text-gray-500">{t("duels.createOrAccept")}</p>
            </div>
          ) : (
            activeDuels.map((duel) => {
              const opponent = getOpponent(duel);
              const isPlayer1 = duel.player1_id === profile?.id;
              const hasPlayed = isPlayer1
                ? !!duel.player1_session_id
                : !!duel.player2_session_id;
              const opponentHasPlayed = isPlayer1
                ? !!duel.player2_session_id
                : !!duel.player1_session_id;

              return (
                <div
                  key={duel.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {duel.quizzes.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {t("duels.vs")} {opponent.pseudo}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(duel.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div
                          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                            hasPlayed
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              hasPlayed ? "bg-green-500" : "bg-amber-500"
                            }`}
                          />
                          <span>
                            {hasPlayed
                              ? t("duels.youPlayed")
                              : t("duels.waiting")}
                          </span>
                        </div>
                        <div
                          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                            opponentHasPlayed
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              opponentHasPlayed ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                          <span>
                            {opponent.pseudo}{" "}
                            {opponentHasPlayed
                              ? t("duels.hasPlayed")
                              : t("duels.hasNotPlayed")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => joinDuel(duel)}
                      disabled={hasPlayed}
                      className={`px-6 py-3 rounded-lg transition-colors font-medium ${
                        hasPlayed
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {hasPlayed ? t("duels.alreadyPlayed") : t("quiz.play")}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "invitations" && (
        <div className="space-y-6">
          {pendingInvitations.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {t("duels.receivedInvitations")}
              </h2>
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-800 mb-1">
                          {invitation.from_user.pseudo}{" "}
                          {t("duels.challengesYou")}
                        </p>
                        <p className="text-gray-600 mb-2">
                          {invitation.quizzes.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(invitation.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => acceptInvitation(invitation)}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          {t("friends.accept")}
                        </button>
                        <button
                          onClick={() => declineInvitation(invitation.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          {t("friends.reject")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sentInvitations.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {t("duels.sentInvitations")}
              </h2>
              <div className="space-y-3">
                {sentInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="bg-white rounded-xl shadow-md p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-800 mb-1">
                          {t("duels.invitationTo")} {invitation.to_user.pseudo}
                        </p>
                        <p className="text-gray-600 mb-2">
                          {invitation.quizzes.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(invitation.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">
                        {t("duels.waiting")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingInvitations.length === 0 && sentInvitations.length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {t("duels.noInvitations")}
              </h3>
              <p className="text-gray-500">{t("duels.createToChallenge")}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "completed" && (
        <div className="space-y-4">
          {completedDuels.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {t("duels.noCompletedDuels")}
              </h3>
              <p className="text-gray-500">{t("duels.historyAppears")}</p>
            </div>
          ) : (
            completedDuels.map((duel) => {
              const opponent = getOpponent(duel);
              const status = getDuelStatus(duel);
              const isPlayer1 = duel.player1_id === profile?.id;
              const mySession = isPlayer1
                ? duel.player1_session
                : duel.player2_session;
              const opponentSession = isPlayer1
                ? duel.player2_session
                : duel.player1_session;
              const myProfile = isPlayer1 ? duel.player1 : duel.player2;
              const winner = duel.winner_id
                ? duel.winner_id === profile?.id
                  ? myProfile
                  : opponent
                : null;

              return (
                <div
                  key={duel.id}
                  className={`rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                    status === t("duels.victory")
                      ? "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400"
                      : status === t("duels.defeat")
                      ? "bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-400"
                      : "bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-400"
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-2xl font-bold text-gray-800">
                            {duel.quizzes.title}
                          </h3>
                          {status === t("duels.victory") && (
                            <Crown className="w-6 h-6 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {duel.completed_at &&
                            new Date(duel.completed_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-4 py-2 rounded-lg font-bold text-xl shadow-md ${
                            status === t("duels.victory")
                              ? "bg-green-600 text-white"
                              : status === t("duels.defeat")
                              ? "bg-red-600 text-white"
                              : "bg-gray-600 text-white"
                          }`}
                        >
                          {status === t("duels.victory") && (
                            <Trophy className="w-5 h-5 mr-2" />
                          )}
                          {status}
                        </span>
                      </div>
                    </div>

                    {winner && (
                      <div className="mb-4 p-4 bg-white/60 backdrop-blur rounded-lg border-2 border-yellow-300">
                        <div className="flex items-center justify-center space-x-3">
                          <Crown className="w-8 h-8 text-yellow-500" />
                          <div className="text-center">
                            <p className="text-sm text-gray-600 font-medium">
                              {t("duels.winner")}
                            </p>
                            <p className="text-2xl font-bold text-gray-800">
                              {winner.pseudo}
                            </p>
                          </div>
                          <Crown className="w-8 h-8 text-yellow-500" />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div
                        className={`p-4 rounded-lg ${
                          status === t("duels.victory")
                            ? "bg-green-100/70"
                            : "bg-white/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-gray-700">
                            {t("duels.you")}
                          </p>
                          {status === t("duels.victory") && (
                            <Award className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {myProfile.pseudo}
                        </p>
                        {mySession && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">
                                {t("duels.score")}
                              </span>
                              <span className="text-lg font-bold text-emerald-600">
                                {mySession.score}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">
                                {t("duels.accuracy")}
                              </span>
                              <span className="text-sm font-semibold text-gray-700">
                                {mySession.correct_answers}/
                                {mySession.total_questions}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">
                                {t("duels.rate")}
                              </span>
                              <span className="text-sm font-semibold text-gray-700">
                                {(
                                  (mySession.correct_answers /
                                    mySession.total_questions) *
                                  100
                                ).toFixed(0)}
                                %
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div
                        className={`p-4 rounded-lg ${
                          status === t("duels.defeat")
                            ? "bg-red-100/70"
                            : "bg-white/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-gray-700">
                            {t("duels.opponent")}
                          </p>
                          {status === t("duels.defeat") && (
                            <Award className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {opponent.pseudo}
                        </p>
                        {opponentSession && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">
                                {t("duels.score")}
                              </span>
                              <span className="text-lg font-bold text-emerald-600">
                                {opponentSession.score}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">
                                {t("duels.accuracy")}
                              </span>
                              <span className="text-sm font-semibold text-gray-700">
                                {opponentSession.correct_answers}/
                                {opponentSession.total_questions}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">
                                {t("duels.rate")}
                              </span>
                              <span className="text-sm font-semibold text-gray-700">
                                {(
                                  (opponentSession.correct_answers /
                                    opponentSession.total_questions) *
                                  100
                                ).toFixed(0)}
                                %
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {mySession && opponentSession && (
                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-300">
                        <div className="text-center p-3 bg-white/40 rounded-lg">
                          <Target className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                          <p className="text-xs text-gray-600 mb-1">
                            {t("duels.gap")}
                          </p>
                          <p className="text-lg font-bold text-gray-800">
                            {Math.abs(mySession.score - opponentSession.score)}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-white/40 rounded-lg">
                          <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
                          <p className="text-xs text-gray-600 mb-1">
                            {t("duels.yourScore")}
                          </p>
                          <p className="text-lg font-bold text-emerald-600">
                            {mySession.score}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-white/40 rounded-lg">
                          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                          <p className="text-xs text-gray-600 mb-1">
                            {t("quiz.questions")}
                          </p>
                          <p className="text-lg font-bold text-gray-800">
                            {mySession.total_questions}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {showCreateInvitation && (
        <CreateDuelInvitation
          onClose={() => setShowCreateInvitation(false)}
          onCreated={() => {
            setShowCreateInvitation(false);
            loadInvitations();
          }}
        />
      )}
    </div>
  );
}

function CreateDuelInvitation({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [friends, setFriends] = useState<Profile[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedFriend, setSelectedFriend] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFriendsAndQuizzes();
  }, []);

  const loadFriendsAndQuizzes = async () => {
    if (!profile) return;

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

    const allFriends: Profile[] = [
      ...(friendshipsAsSender?.map((f: any) => f.friend_profile) || []),
      ...(friendshipsAsReceiver?.map((f: any) => f.user_profile) || []),
    ].filter((friend) => friend && !friend.is_banned);

    setFriends(allFriends);

    const { data: quizzesData } = await supabase
      .from("quizzes")
      .select("*")
      .or("is_public.eq.true,is_global.eq.true")
      .order("total_plays", { ascending: false })
      .limit(50);

    if (quizzesData) setQuizzes(quizzesData);
  };

  const createInvitation = async () => {
    if (!profile || !selectedFriend || !selectedQuiz) return;

    setLoading(true);

    try {
      await supabase.from("duel_invitations").insert({
        from_user_id: profile.id,
        to_user_id: selectedFriend,
        quiz_id: selectedQuiz,
        status: "pending",
      });

      onCreated();
    } catch (error) {
      console.error("Error creating invitation:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {t("duels.createDuel")}
        </h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("duels.chooseFriend")}
            </label>
            <select
              value={selectedFriend}
              onChange={(e) => setSelectedFriend(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
              <option value="">{t("duels.selectFriend")}</option>
              {friends.map((friend) => (
                <option key={friend.id} value={friend.id}>
                  {friend.pseudo} ({t("profile.level")} {friend.level})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("duels.chooseQuiz")}
            </label>
            <select
              value={selectedQuiz}
              onChange={(e) => setSelectedQuiz(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
              <option value="">{t("duels.selectQuiz")}</option>
              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title} ({quiz.difficulty})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={createInvitation}
            disabled={!selectedFriend || !selectedQuiz || loading}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("duels.sending") : t("chat.send")}
          </button>
        </div>
      </div>
    </div>
  );
}
