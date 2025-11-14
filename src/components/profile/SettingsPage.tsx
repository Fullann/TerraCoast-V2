import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { languageNames, Language } from "../../i18n/translations";
import {
  Settings,
  Mail,
  Lock,
  User,
  Trash2,
  ArrowLeft,
  Globe,
  LogOut,
  Save,
  Shield,
} from "lucide-react";

interface SettingsPageProps {
  onNavigate: (view: string) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const { profile, user, refreshProfile } = useAuth();
  const { language, setLanguage, showAllLanguages, setShowAllLanguages, t } =
    useLanguage();
  const [pseudo, setPseudo] = useState(profile?.pseudo || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updatePseudo = async () => {
    if (!pseudo.trim()) {
      setError(t("settings.pseudoRequired"));
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ pseudo: pseudo.trim() })
      .eq("id", profile?.id);

    if (updateError) {
      setError(t("settings.pseudoUpdateError"));
    } else {
      setMessage(t("settings.pseudoUpdateSuccess"));
      await refreshProfile();
    }

    setLoading(false);
  };

  const updateEmail = async () => {
    if (!email.trim() || !currentPassword.trim()) {
      setError(t("settings.emailPasswordRequired"));
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user?.email || "",
      password: currentPassword,
    });

    if (authError) {
      setError(t("settings.incorrectPassword"));
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      email: email.trim(),
    });

    if (updateError) {
      setError(t("settings.emailUpdateError"));
    } else {
      setMessage(t("settings.emailConfirmationSent"));
      setCurrentPassword("");
    }

    setLoading(false);
  };

  const updatePassword = async () => {
    if (
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !confirmPassword.trim()
    ) {
      setError(t("settings.allFieldsRequired"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("settings.passwordsMismatch"));
      return;
    }

    if (newPassword.length < 6) {
      setError(t("settings.passwordTooShort"));
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user?.email || "",
      password: currentPassword,
    });

    if (authError) {
      setError(t("settings.currentPasswordIncorrect"));
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(t("settings.passwordUpdateError"));
    } else {
      setMessage(t("settings.passwordUpdateSuccess"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setLoading(false);
  };

  // ✅ FONCTION DE DÉCONNEXION
  const handleLogout = async () => {
    const confirmLogout = window.confirm(
      t("settings.logoutConfirmation") ||
        "Êtes-vous sûr de vouloir vous déconnecter ?"
    );

    if (!confirmLogout) return;

    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(t("settings.logoutError") || "Erreur lors de la déconnexion");
      setLoading(false);
    }
    // L'utilisateur sera automatiquement redirigé vers la page de connexion
  };

  const deleteAccount = async () => {
    const confirmation = prompt(t("settings.deleteConfirmation"));

    if (confirmation !== t("settings.deleteKeyword")) {
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase.rpc("delete_user_account", {
      user_id: profile?.id,
    });

    if (error) {
      setError(t("settings.deleteAccountError"));
      setLoading(false);
    } else {
      await supabase.auth.signOut();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ✅ HEADER FIXE AVEC NAVIGATION ET DÉCONNEXION */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigate("profile")}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">
                {t("settings.backToProfile")}
              </span>
            </button>

            <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center">
              <Settings className="w-6 h-6 md:w-7 md:h-7 mr-2 text-emerald-600" />
              <span className="hidden sm:inline">
                {t("settings.accountSettings")}
              </span>
            </h1>

            {/* ✅ BOUTON DÉCONNEXION */}
            <button
              onClick={handleLogout}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">
                {t("settings.logout") || "Déconnexion"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ✅ CONTENU PRINCIPAL */}
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* Messages de succès/erreur */}
        {message && (
          <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-4 mb-6 animate-fade-in">
            <p className="text-green-700 font-medium">{message}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 mb-6 animate-fade-in">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* ✅ GRILLE RESPONSIVE POUR CARTES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CARTE LANGUE */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Globe className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 ml-3">
                {t("settings.languagePreferences")}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("settings.interfaceLanguage")}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                >
                  {Object.entries(languageNames).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-start p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="showAllLanguages"
                  checked={showAllLanguages}
                  onChange={(e) => setShowAllLanguages(e.target.checked)}
                  className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label
                  htmlFor="showAllLanguages"
                  className="ml-3 text-sm text-gray-700"
                >
                  {t("settings.showAllLanguagesDescription")}
                </label>
              </div>
            </div>
          </div>

          {/* CARTE NOM D'UTILISATEUR */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 ml-3">
                {t("settings.username")}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("settings.newUsername")}
                </label>
                <input
                  type="text"
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder={t("settings.yourUsername")}
                />
              </div>

              <button
                onClick={updatePseudo}
                disabled={
                  loading || !pseudo.trim() || pseudo === profile?.pseudo
                }
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                <Save className="w-4 h-4" />
                {t("settings.updateUsername")}
              </button>
            </div>
          </div>

          {/* CARTE EMAIL */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Mail className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 ml-3">
                {t("settings.emailAddress")}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("settings.newEmail")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder={t("settings.newEmailPlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("settings.currentPassword")}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                onClick={updateEmail}
                disabled={loading || !email.trim() || !currentPassword.trim()}
                className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                <Save className="w-4 h-4" />
                {t("settings.updateEmail")}
              </button>
            </div>
          </div>

          {/* CARTE MOT DE PASSE */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Lock className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 ml-3">
                {t("settings.password")}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("settings.currentPassword")}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("settings.newPassword")}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("settings.confirmNewPassword")}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                onClick={updatePassword}
                disabled={
                  loading ||
                  !currentPassword.trim() ||
                  !newPassword.trim() ||
                  !confirmPassword.trim()
                }
                className="w-full px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                <Shield className="w-4 h-4" />
                {t("settings.updatePassword")}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gradient-to-r from-red-50 to-red-100 rounded-xl shadow-md border-2 border-red-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-red-200 rounded-lg">
              <Trash2 className="w-6 h-6 text-red-700" />
            </div>
            <h2 className="text-xl font-bold text-red-800 ml-3">
              {t("settings.dangerZone")}
            </h2>
          </div>

          <p className="text-gray-700 mb-4">{t("settings.deleteWarning")}</p>

          <button
            onClick={deleteAccount}
            disabled={loading}
            className="w-full md:w-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            <Trash2 className="w-4 h-4" />
            {t("settings.deleteAccount")}
          </button>
        </div>
      </div>
    </div>
  );
}
