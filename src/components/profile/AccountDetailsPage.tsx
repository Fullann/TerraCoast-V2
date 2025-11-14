import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  Clock,
  Activity,
  Database,
  User,
  Key,
  AlertTriangle,
} from "lucide-react";

interface AccountDetailsPageProps {
  onNavigate: (view: string, data?: any) => void;
  userId?: string; // ID du profil à afficher
}

export function AccountDetailsPage({ onNavigate, userId }: AccountDetailsPageProps) {
  const { profile: currentUserProfile } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [chargement, setChargement] = useState(true);

  // Si aucun userId n'est fourni, utiliser celui de l'utilisateur connecté
  const targetUserId = userId || currentUserProfile?.id;

  useEffect(() => {
    if (targetUserId) {
      chargerProfil();
    }
  }, [targetUserId]);

  const chargerProfil = async () => {
    if (!targetUserId) return;
    
    setChargement(true);
    console.log("🔍 Chargement du profil pour:", targetUserId); // Debug
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .single();

    console.log("📊 Profil chargé:", data); // Debug
    console.log("❌ Erreur:", error); // Debug
    
    setProfile(data);
    setChargement(false);
  };

  if (chargement) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

 

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => onNavigate("profile", { userId })}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour au profil
        </button>

        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
          <Shield className="w-8 h-8 mr-3 text-emerald-600" />
          Détails du compte utilisateur
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informations principales */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Informations principales
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Pseudo</p>
                  <p className="font-medium text-gray-800">{profile.pseudo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Key className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">ID utilisateur</p>
                  <p className="font-mono text-xs text-gray-600">{profile.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dates importantes */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
              Dates importantes
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Création du compte</p>
                  <p className="font-medium text-gray-800">
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    }) : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Dernière modification</p>
                  <p className="font-medium text-gray-800">
                    {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    }) : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2 text-purple-600" />
              Statistiques
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Niveau</span>
                <span className="font-bold text-purple-600">{profile.level || 1}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">XP accumulée</span>
                <span className="font-bold text-emerald-600">{profile.experience_points || 0} XP</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Score mensuel</span>
                <span className="font-bold text-blue-600">{profile.monthly_score || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Parties sur le mois</span>
                <span className="font-bold text-orange-600">{profile.monthly_games_played || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Série actuelle</span>
                <span className="font-bold text-orange-500">{profile.current_streak || 0} jours</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Meilleure série</span>
                <span className="font-bold text-yellow-600">{profile.longest_streak || 0} jours</span>
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-red-600" />
              Sécurité
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Shield className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Rôle</p>
                  <p className="font-medium text-gray-800 capitalize">
                    {profile.role === "admin" ? "Administrateur" : "Utilisateur"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Activity className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Statut du compte</p>
                  <p className={`font-medium ${profile.is_banned ? "text-red-600" : "text-green-600"}`}>
                    {profile.is_banned ? "Banni" : "Actif"}
                  </p>
                </div>
              </div>
              {profile.is_banned && profile.ban_reason && (
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-red-600 font-semibold mb-1">Raison du ban</p>
                    <p className="text-sm text-red-700">{profile.ban_reason}</p>
                    {profile.ban_until && (
                      <p className="text-xs text-red-600 mt-2">
                        Jusqu'au : {new Date(profile.ban_until).toLocaleString("fr-FR")}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
