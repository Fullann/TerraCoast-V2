import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  Shield,
  Users,
  BookOpen,
  AlertTriangle,
  Award,
  Star,
  Tag,
  Target,
} from "lucide-react";
import type { Database } from "../../lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type Report = Database["public"]["Tables"]["reports"]["Row"];

interface AdminPageProps {
  onNavigate?: (view: string, data?: any) => void;
}

export function AdminPage({ onNavigate }: AdminPageProps) {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    pendingReports: 0,
    totalBadges: 0,
  });
  const [users, setUsers] = useState<Profile[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [quizSearch, setQuizSearch] = useState("");
  const [quizSearchResults, setQuizSearchResults] = useState<Quiz[]>([]);

  useEffect(() => {
    if (profile?.role === "admin") {
      loadAdminData();
    }
  }, [profile]);

  const loadAdminData = async () => {
    const { count: usersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: quizzesCount } = await supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true });

    const { count: warningsCount } = await supabase
      .from("warnings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: badgesCount } = await supabase
      .from("badges")
      .select("*", { count: "exact", head: true });

    setStats({
      totalUsers: usersCount || 0,
      totalQuizzes: quizzesCount || 0,
      pendingReports: warningsCount || 0,
      totalBadges: badgesCount || 0,
    });

    const { data: usersData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (usersData) setUsers(usersData);

    const { data: quizzesData } = await supabase
      .from("quizzes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (quizzesData) setQuizzes(quizzesData);

    const { data: reportsData } = await supabase
      .from("reports")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (reportsData) setReports(reportsData);
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";

    const { error, data } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId)
      .select();

    if (error) {
      console.error("Error updating role:", error);
      alert(`Erreur lors de la modification du rôle: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      alert("Aucune ligne mise à jour. Vérifiez les permissions.");
      return;
    }

    alert(`Rôle mis à jour avec succès pour ${userId}`);
    loadAdminData();
  };

  const toggleUserBan = async (userId: string, isBanned: boolean) => {
    const confirmMessage = isBanned
      ? "Voulez-vous vraiment débannir cet utilisateur ?"
      : "Voulez-vous vraiment bannir cet utilisateur ?";

    if (!confirm(confirmMessage)) return;

    const reason = !isBanned ? prompt("Raison du ban (optionnel):") : null;

    const updateData = isBanned
      ? { is_banned: false, banned_at: null, ban_reason: null }
      : {
          is_banned: true,
          banned_at: new Date().toISOString(),
          ban_reason: reason || "Non spécifié",
        };

    const { error, data } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select();

    if (error) {
      console.error("Error updating ban status:", error);
      alert(
        `Erreur lors de la modification du statut de ban: ${error.message}`
      );
      return;
    }

    if (!data || data.length === 0) {
      alert("Aucune ligne mise à jour. Vérifiez les permissions.");
      return;
    }

    alert(`Statut de ban mis à jour avec succès`);
    loadAdminData();
  };

  const searchQuizzes = async (query: string) => {
    if (query.trim().length < 2) {
      setQuizSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from("quizzes")
      .select("*")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) setQuizSearchResults(data);
  };

  const deleteQuiz = async (quizId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce quiz?")) return;

    await supabase.from("quizzes").delete().eq("id", quizId);
    loadAdminData();
    if (quizSearch) searchQuizzes(quizSearch);
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
            Vous devez être administrateur pour accéder à cette page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <Shield className="w-10 h-10 mr-3 text-emerald-600" />
          Administration
        </h1>
        <p className="text-gray-600">Gestion de la plateforme TerraCoast</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <button
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
          onClick={() => onNavigate?.("user-management")}
        >
          <Users className="w-10 h-10 mb-3" />
          <p className="text-blue-100 text-sm">Utilisateurs</p>
          <p className="text-4xl font-bold">{stats.totalUsers}</p>
          <p className="text-amber-100 text-xs">Cliquez pour traiter</p>
        </button>

        <button
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
          onClick={() => onNavigate?.("quiz-management")}
        >
          <BookOpen className="w-10 h-10 mb-3" />
          <p className="text-blue-100 text-sm">Quiz</p>
          <p className="text-4xl font-bold">{stats.totalQuizzes}</p>
          <p className="text-amber-100 text-xs">Cliquez pour traiter</p>
        </button>

        <button
          onClick={() => onNavigate?.("warnings-management")}
          className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <AlertTriangle className="w-10 h-10 mb-3" />
          <p className="text-amber-100 text-sm">Signalements en attente</p>
          <p className="text-4xl font-bold mb-2">{stats.pendingReports}</p>
          <p className="text-amber-100 text-xs">Cliquez pour traiter</p>
        </button>

        <button
          onClick={() => onNavigate?.("badge-management")}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <Award className="w-10 h-10 mb-3" />
          <p className="text-purple-100 text-sm">Badges</p>
          <p className="text-4xl font-bold mb-2">{stats.totalBadges}</p>
          <p className="text-xs text-purple-100">Cliquer pour gérer →</p>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <button
          onClick={() => onNavigate?.("quiz-validation")}
          className="bg-gradient-to-br from-teal-400 to-teal-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <BookOpen className="w-10 h-10 mb-3" />
          <p className="text-teal-100 text-sm">Validation des quiz</p>
          <p className="text-xs text-teal-100 mt-2">
            Approuver les quiz publics →
          </p>
        </button>

        <button
          onClick={() => onNavigate?.("title-management")}
          className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <Star className="w-10 h-10 mb-3" />
          <p className="text-amber-100 text-sm">Gestion des titres</p>
          <p className="text-xs text-amber-100 mt-2">
            Créer et gérer les titres →
          </p>
        </button>

        <button
          onClick={() => onNavigate?.("category-management")}
          className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <Tag className="w-10 h-10 mb-3" />
          <p className="text-blue-100 text-sm">Gestion des catégories</p>
          <p className="text-xs text-blue-100 mt-2">
            Gérer les catégories de quiz →
          </p>
        </button>

        <button
          onClick={() => onNavigate?.("difficulty-management")}
          className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <Target className="w-10 h-10 mb-3" />
          <p className="text-orange-100 text-sm">Gestion des difficultés</p>
          <p className="text-xs text-orange-100 mt-2">
            Gérer les niveaux de difficulté →
          </p>
        </button>

        <button
          onClick={() => onNavigate?.("quiz-type-management")}
          className="bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <Tag className="w-10 h-10 mb-3" />
          <p className="text-indigo-100 text-sm">Types de quiz</p>
          <p className="text-xs text-indigo-100 mt-2">QCM, Texte, Mixte... →</p>
        </button>
      </div>
    </div>
  );
}
