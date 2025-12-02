import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { supabase } from "../../lib/supabase";
import { UserCog, AlertCircle } from "lucide-react";

export function ForceUsernamePage() {
  const { profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [newUsername, setNewUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newUsername.trim()) {
      setError(t("forceUsername.errorEmpty"));
      return;
    }

    if (newUsername.length < 3 || newUsername.length > 20) {
      setError(t("forceUsername.errorLength"));
      return;
    }

    if (!/^[a-zA-Z0-9_\s]+$/.test(newUsername)) {
      setError(t("forceUsername.errorInvalid"));
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("pseudo", newUsername.trim())
        .maybeSingle();

      if (existing) {
        setError(t("forceUsername.errorTaken"));
        setIsSubmitting(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          pseudo: newUsername.trim(),
          force_username_change: false,
        })
        .eq("id", profile?.id);

      if (updateError) {
        console.error("Error updating username:", updateError);
        setError(t("forceUsername.errorUpdate"));
        setIsSubmitting(false);
        return;
      }

      await refreshProfile();
      window.location.reload();
    } catch (err) {
      console.error("Error:", err);
      setError(t("forceUsername.errorGeneric"));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-900/30 rounded-full mb-4">
            <UserCog className="w-10 h-10 text-blue-500" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            {t("forceUsername.title")}
          </h1>
          <p className="text-gray-400">{t("forceUsername.subtitle")}</p>
        </div>

        <div className="bg-orange-900/20 border border-orange-800/30 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-orange-300 mb-1 font-medium">
                {t("forceUsername.flaggedTitle")}
              </p>
              <p className="text-xs text-gray-400">
                {t("forceUsername.flaggedDesc")}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t("forceUsername.currentPseudo")}
            </label>
            <div className="px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg">
              <p className="text-gray-400 line-through">{profile?.pseudo}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t("forceUsername.newPseudo")}
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder={t("forceUsername.placeholder")}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("forceUsername.rules")}
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !newUsername.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? t("forceUsername.updating")
              : t("forceUsername.confirm")}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            {t("forceUsername.notice")}
          </p>
        </div>
      </div>
    </div>
  );
}
