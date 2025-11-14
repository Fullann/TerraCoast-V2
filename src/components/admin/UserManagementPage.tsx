import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  Users,
  Search,
  ArrowLeft,
  RotateCcw,
  Trash2,
  Shield,
  AlertTriangle,
  UserX,
  Edit2,
  Ban,
} from "lucide-react";
import type { Database } from "../../lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface UserManagementPageProps {
  onNavigate?: (view: string, data?: any) => void;
}

export function UserManagementPage({ onNavigate }: UserManagementPageProps) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"level" | "xp" | "created" | "games">(
    "created"
  );
  const [filterBanned, setFilterBanned] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [banType, setBanType] = useState<"temporary" | "permanent">(
    "temporary"
  );
  const [banReason, setBanReason] = useState("");
  const [banUntilDate, setBanUntilDate] = useState("");
  const [newNickname, setNewNickname] = useState("");

  useEffect(() => {
    loadUsers();
  }, [sortBy, filterBanned]);

  const loadUsers = async () => {
    setLoading(true);
    let query = supabase.from("profiles").select("*");

    if (filterBanned) {
      query = query.eq("is_banned", true);
    }

    const { data, error } = await query
      .order(
        sortBy === "created"
          ? "created_at"
          : sortBy === "level"
          ? "level"
          : sortBy === "xp"
          ? "experience_points"
          : "level",
        { ascending: false }
      )
      .limit(100);

    if (data) setUsers(data);
    setLoading(false);
  };

  const searchUsers = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("pseudo", `%${query}%`)
      .limit(20);

    if (data) setSearchResults(data);
  };

  const forceNicknameChange = async () => {
    if (!selectedUser) return;

    if (newNickname.trim().length < 3) {
      alert("Le pseudo doit contenir au moins 3 caractères");
      return;
    }

    // Vérifier que le pseudo n'existe pas déjà
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("pseudo", newNickname.trim())
      .single();

    if (existingUser) {
      alert("Ce pseudo existe déjà");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ pseudo: newNickname.trim() })
      .eq("id", selectedUser.id);

    if (error) {
      alert(`Erreur: ${error.message}`);
      return;
    }

    // Créer une notification
    await supabase.from("notifications").insert({
      user_id: selectedUser.id,
      type: "warning",
      message: `Ton pseudo a été forcément changé en: ${newNickname.trim()}`,
    });

    alert(`Pseudo changé en ${newNickname.trim()} !`);
    setShowNicknameModal(false);
    setNewNickname("");
    setSelectedUser(null);
    loadUsers();
  };

  const applyBan = async () => {
    if (!selectedUser) return;

    if (!banReason.trim()) {
      alert("Tu dois indiquer une raison");
      return;
    }

    if (banType === "temporary" && !banUntilDate) {
      alert("Tu dois sélectionner une date d'expiration");
      return;
    }

    const updateData: any = {
      is_banned: true,
      ban_reason: banReason.trim(),
      banned_at: new Date().toISOString(),
    };

    if (banType === "temporary") {
      updateData.ban_until = new Date(banUntilDate).toISOString();
    } else {
      updateData.ban_until = null;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", selectedUser.id);

    if (error) {
      alert(`Erreur: ${error.message}`);
      return;
    }

    // Créer une notification
    let notificationMessage = "";
    if (banType === "temporary") {
      notificationMessage = `Ton compte a été banni temporairement jusqu'au ${new Date(
        banUntilDate
      ).toLocaleString()}. Raison: ${banReason.trim()}`;
    } else {
      notificationMessage = `Ton compte a été banni de manière permanente. Raison: ${banReason.trim()}`;
    }

    await supabase.from("notifications").insert({
      user_id: selectedUser.id,
      type: "warning",
      message: notificationMessage,
    });

    alert(
      banType === "temporary"
        ? "Utilisateur banni temporairement !"
        : "Utilisateur banni définitivement !"
    );
    setShowBanModal(false);
    setBanReason("");
    setBanUntilDate("");
    setBanType("temporary");
    setSelectedUser(null);
    loadUsers();
  };

  const toggleUserBan = async (userId: string, isBanned: boolean) => {
    if (isBanned) {
      // Débannir
      if (!confirm("Es-tu sûr de vouloir débannir cet utilisateur ?")) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          is_banned: false,
          ban_reason: null,
          ban_until: null,
          banned_at: null,
        })
        .eq("id", userId);

      if (error) {
        alert(`Erreur: ${error.message}`);
        return;
      }

      // Créer une notification
      const user = users.find((u) => u.id === userId);
      if (user) {
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "info",
          message:
            "Ton compte a été débanni ! Tu peux à nouveau accéder à la plateforme.",
        });
      }

      alert("Utilisateur débanni !");
    } else {
      // Bannir - ouvrir le modal
      const user = users.find((u) => u.id === userId);
      if (user) {
        setSelectedUser(user);
        setBanType("permanent");
        setBanReason("");
        setBanUntilDate("");
        setShowBanModal(true);
      }
    }

    loadUsers();
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";

    if (!confirm(`Changer le rôle à ${newRole} ?`)) return;

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      alert(`Erreur: ${error.message}`);
      return;
    }

    alert(`Rôle changé à ${newRole} !`);
    loadUsers();
  };

  const resetUserStats = async (userId: string, userName: string) => {
    if (!confirm(`Réinitialiser les stats (XP et score) pour ${userName} ?`))
      return;

    const { error } = await supabase
      .from("profiles")
      .update({
        experience_points: 0,
        level: 1,
        monthly_score: 0,
        monthly_games_played: 0,
        current_streak: 0,
      })
      .eq("id", userId);

    if (error) {
      alert(`Erreur: ${error.message}`);
      return;
    }

    alert(`Stats réinitialisées pour ${userName} !`);
    loadUsers();
  };

  const deleteUserAccount = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Es-tu sûr de vouloir SUPPRIMER le compte de ${userName} ? Cette action est irréversible !`
      )
    )
      return;

    const confirmDelete = prompt(
      `Tape "${userName}" pour confirmer la suppression:`
    );
    if (confirmDelete !== userName) {
      alert("Suppression annulée");
      return;
    }

    try {
      console.log("Début suppression pour user:", userId);

      // Supprimer toutes les données associées à l'utilisateur
      console.log("Suppression user_badges...");
      await supabase.from("user_badges").delete().eq("user_id", userId);

      console.log("Suppression user_titles...");
      await supabase.from("user_titles").delete().eq("user_id", userId);

      console.log("Suppression game_sessions...");
      await supabase.from("game_sessions").delete().eq("player_id", userId);

      console.log("Suppression quiz_shares...");
      await supabase
        .from("quiz_shares")
        .delete()
        .eq("shared_with_user_id", userId);

      console.log("Suppression friendships...");
      await supabase
        .from("friendships")
        .delete()
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

      console.log("Suppression warnings...");
      await supabase
        .from("warnings")
        .delete()
        .or(`reported_user_id.eq.${userId},reporter_user_id.eq.${userId}`);

      console.log("Suppression notifications...");
      await supabase.from("notifications").delete().eq("user_id", userId);

      console.log("Suppression chat_messages...");
      await supabase
        .from("chat_messages")
        .delete()
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      console.log("Suppression monthly_rankings_history...");
      await supabase
        .from("monthly_rankings_history")
        .delete()
        .eq("user_id", userId);

      // Supprimer les quiz créés par l'utilisateur
      console.log("Récupération des quiz...");
      const { data: userQuizzes, error: quizzesError } = await supabase
        .from("quizzes")
        .select("id")
        .eq("creator_id", userId);

      if (quizzesError) {
        console.error("Erreur récupération quiz:", quizzesError);
      }

      if (userQuizzes && userQuizzes.length > 0) {
        console.log(`Suppression de ${userQuizzes.length} quiz...`);
        for (const quiz of userQuizzes) {
          // Supprimer les questions du quiz
          await supabase.from("questions").delete().eq("quiz_id", quiz.id);
          // Supprimer le quiz
          await supabase.from("quizzes").delete().eq("id", quiz.id);
        }
      }

      // Supprimer le profil
      console.log("Suppression du profil...");
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileError) {
        console.error("Erreur suppression profil:", profileError);
        alert(`Erreur: ${profileError.message}`);
        return;
      }

      console.log("Suppression complétée avec succès");
      alert(`Compte de ${userName} supprimé avec succès !`);
      loadUsers();
    } catch (error: any) {
      console.error("Erreur complète:", error);
      alert(`Erreur lors de la suppression: ${error.message}`);
    }
  };

  if (profile?.role !== "admin") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Accès refusé
          </h2>
          <p className="text-gray-600">
            Tu dois être administrateur pour accéder à cette page
          </p>
        </div>
      </div>
    );
  }

  const displayUsers = searchTerm.trim().length >= 2 ? searchResults : users;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <Users className="w-10 h-10 mr-3 text-emerald-600" />
          Gestion des utilisateurs
        </h1>
        <p className="text-gray-600">
          Gère les utilisateurs, leurs statistiques et permissions
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher un utilisateur
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cherche par pseudo..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchUsers(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="created">Date de création</option>
                <option value="level">Niveau</option>
                <option value="xp">Expérience</option>
                <option value="games">Parties jouées</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterBanned}
                  onChange={(e) => setFilterBanned(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Montrer que les bannis
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : displayUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucun utilisateur trouvé
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Pseudo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Niveau
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    XP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          onNavigate?.("view-profile", { userId: user.id })
                        }
                        className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        {user.pseudo}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-emerald-600">
                        {user.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600">
                        {user.experience_points}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {user.role === "admin" ? "Admin" : "Utilisateur"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_banned ? (
                        <div>
                          <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 mb-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Banni</span>
                          </span>
                          {user.ban_until && (
                            <p className="text-xs text-gray-500 mt-1">
                              Jusqu'au:{" "}
                              {new Date(user.ban_until).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <span>✓</span>
                          <span>Actif</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">

                        {/* Bouton Rôle */}
                        <button
                          onClick={() => toggleUserRole(user.id, user.role)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.role === "admin"
                              ? "text-red-600 hover:bg-red-50"
                              : "text-blue-600 hover:bg-blue-50"
                          }`}
                          title={
                            user.role === "admin"
                              ? "Retirer admin"
                              : "Promouvoir admin"
                          }
                        >
                          <Shield className="w-4 h-4" />
                        </button>

                        {/* Bouton Changer pseudo */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setNewNickname("");
                            setShowNicknameModal(true);
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Forcer changement de pseudo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Bouton Reset Stats */}
                        <button
                          onClick={() => resetUserStats(user.id, user.pseudo)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Réinitialiser XP et Score"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        {/* Bouton Ban */}
                        <button
                          onClick={() =>
                            toggleUserBan(user.id, user.is_banned || false)
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            user.is_banned
                              ? "text-green-600 hover:bg-green-50"
                              : "text-orange-600 hover:bg-orange-50"
                          }`}
                          title={user.is_banned ? "Débannir" : "Bannir"}
                        >
                          {user.is_banned ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <Ban className="w-4 h-4" />
                          )}
                        </button>
                        {/* Bouton Supprimer */}
                        <button
                          onClick={() =>
                            deleteUserAccount(user.id, user.pseudo)
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer le compte"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Ban */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Bannir {selectedUser.pseudo}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de ban
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="temporary"
                      checked={banType === "temporary"}
                      onChange={() => setBanType("temporary")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">
                      Ban temporaire
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="permanent"
                      checked={banType === "permanent"}
                      onChange={() => setBanType("permanent")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Ban permanent</span>
                  </label>
                </div>
              </div>

              {banType === "temporary" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration
                  </label>
                  <input
                    type="datetime-local"
                    value={banUntilDate}
                    onChange={(e) => setBanUntilDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du ban
                </label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Ex: Spam dans le chat..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason("");
                  setBanUntilDate("");
                  setBanType("temporary");
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={applyBan}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Bannir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Changement Pseudo */}
      {showNicknameModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Changer le pseudo
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Pseudo actuel:{" "}
              <span className="font-semibold">{selectedUser.pseudo}</span>
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau pseudo
              </label>
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="Nouveau pseudo..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-2">Minimum 3 caractères</p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowNicknameModal(false);
                  setNewNickname("");
                  setSelectedUser(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={forceNicknameChange}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Changer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
