import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { languageNames, Language } from '../../i18n/translations';
import { Settings, Mail, Lock, User, Trash2, ArrowLeft, Globe } from 'lucide-react';

interface SettingsPageProps {
  onNavigate: (view: string) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const { profile, user, refreshProfile } = useAuth();
  const { language, setLanguage, showAllLanguages, setShowAllLanguages } = useLanguage();
  const [pseudo, setPseudo] = useState(profile?.pseudo || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const updatePseudo = async () => {
    if (!pseudo.trim()) {
      setError('Le pseudo ne peut pas être vide');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ pseudo: pseudo.trim() })
      .eq('id', profile?.id);

    if (updateError) {
      setError('Erreur lors de la mise à jour du pseudo');
    } else {
      setMessage('Pseudo mis à jour avec succès');
      await refreshProfile();
    }

    setLoading(false);
  };

  const updateEmail = async () => {
    if (!email.trim() || !currentPassword.trim()) {
      setError('Email et mot de passe actuel requis');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: currentPassword,
    });

    if (authError) {
      setError('Mot de passe incorrect');
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      email: email.trim(),
    });

    if (updateError) {
      setError('Erreur lors de la mise à jour de l\'email');
    } else {
      setMessage('Un email de confirmation a été envoyé à ta nouvelle adresse');
      setCurrentPassword('');
    }

    setLoading(false);
  };

  const updatePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('Tous les champs sont requis');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: currentPassword,
    });

    if (authError) {
      setError('Mot de passe actuel incorrect');
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError('Erreur lors de la mise à jour du mot de passe');
    } else {
      setMessage('Mot de passe mis à jour avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    setLoading(false);
  };

  const deleteAccount = async () => {
    const confirmation = prompt(
      'Cette action est irréversible. Tape "SUPPRIMER" pour confirmer :'
    );

    if (confirmation !== 'SUPPRIMER') {
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabase.rpc('delete_user_account', {
      user_id: profile?.id,
    });

    if (error) {
      setError('Erreur lors de la suppression du compte');
      setLoading(false);
    } else {
      await supabase.auth.signOut();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => onNavigate('profile')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour au profil
        </button>
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <Settings className="w-10 h-10 mr-3 text-gray-700" />
          Paramètres du compte
        </h1>
        <p className="text-gray-600">Gère tes informations personnelles</p>
      </div>

      {message && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <p className="text-green-700">{message}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-4">
            <Globe className="w-6 h-6 text-emerald-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">Langue et préférences</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Langue de l'interface
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                {Object.entries(languageNames).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="showAllLanguages"
                checked={showAllLanguages}
                onChange={(e) => setShowAllLanguages(e.target.checked)}
                className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="showAllLanguages" className="ml-2 text-sm text-gray-700">
                Afficher tous les quiz dans toutes les langues (sinon, uniquement les quiz dans ma langue)
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-4">
            <User className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">Pseudo</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau pseudo
              </label>
              <input
                type="text"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Ton pseudo"
              />
            </div>

            <button
              onClick={updatePseudo}
              disabled={loading || !pseudo.trim() || pseudo === profile?.pseudo}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mettre à jour le pseudo
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-4">
            <Mail className="w-6 h-6 text-emerald-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">Adresse email</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouvelle adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="nouvelle@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe actuel
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              onClick={updateEmail}
              disabled={loading || !email.trim() || !currentPassword.trim()}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mettre à jour l'email
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-4">
            <Lock className="w-6 h-6 text-amber-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">Mot de passe</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe actuel
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              onClick={updatePassword}
              disabled={loading || !currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()}
              className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mettre à jour le mot de passe
            </button>
          </div>
        </div>

        <div className="bg-red-50 rounded-xl shadow-md p-6 border-2 border-red-200">
          <div className="flex items-center mb-4">
            <Trash2 className="w-6 h-6 text-red-600 mr-2" />
            <h2 className="text-2xl font-bold text-red-800">Zone de danger</h2>
          </div>

          <p className="text-gray-700 mb-4">
            Supprimer ton compte est une action irréversible. Toutes tes données seront perdues.
          </p>

          <button
            onClick={deleteAccount}
            disabled={loading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Supprimer mon compte
          </button>
        </div>
      </div>
    </div>
  );
}
