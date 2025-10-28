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
  const { language, setLanguage, showAllLanguages, setShowAllLanguages, t } = useLanguage();
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
      setError(t('settings.pseudoRequired'));
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
      setError(t('settings.pseudoUpdateError'));
    } else {
      setMessage(t('settings.pseudoUpdateSuccess'));
      await refreshProfile();
    }

    setLoading(false);
  };

  const updateEmail = async () => {
    if (!email.trim() || !currentPassword.trim()) {
      setError(t('settings.emailPasswordRequired'));
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
      setError(t('settings.incorrectPassword'));
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      email: email.trim(),
    });

    if (updateError) {
      setError(t('settings.emailUpdateError'));
    } else {
      setMessage(t('settings.emailConfirmationSent'));
      setCurrentPassword('');
    }

    setLoading(false);
  };

  const updatePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError(t('settings.allFieldsRequired'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('settings.passwordsMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('settings.passwordTooShort'));
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
      setError(t('settings.currentPasswordIncorrect'));
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(t('settings.passwordUpdateError'));
    } else {
      setMessage(t('settings.passwordUpdateSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    setLoading(false);
  };

  const deleteAccount = async () => {
    const confirmation = prompt(
      t('settings.deleteConfirmation')
    );

    if (confirmation !== t('settings.deleteKeyword')) {
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await supabase.rpc('delete_user_account', {
      user_id: profile?.id,
    });

    if (error) {
      setError(t('settings.deleteAccountError'));
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
          {t('settings.backToProfile')}
        </button>
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <Settings className="w-10 h-10 mr-3 text-gray-700" />
          {t('settings.accountSettings')}
        </h1>
        <p className="text-gray-600">{t('settings.manageInfo')}</p>
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
            <h2 className="text-2xl font-bold text-gray-800">{t('settings.languagePreferences')}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.interfaceLanguage')}
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
                {t('settings.showAllLanguagesDescription')}
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-4">
            <User className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">{t('settings.username')}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.newUsername')}
              </label>
              <input
                type="text"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder={t('settings.yourUsername')}
              />
            </div>

            <button
              onClick={updatePseudo}
              disabled={loading || !pseudo.trim() || pseudo === profile?.pseudo}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('settings.updateUsername')}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-4">
            <Mail className="w-6 h-6 text-emerald-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">{t('settings.emailAddress')}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.newEmail')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder={t('settings.newEmailPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.currentPassword')}
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
              {t('settings.updateEmail')}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-4">
            <Lock className="w-6 h-6 text-amber-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">{t('settings.password')}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.currentPassword')}
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
                {t('settings.newPassword')}
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
                {t('settings.confirmNewPassword')}
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
              {t('settings.updatePassword')}
            </button>
          </div>
        </div>

        <div className="bg-red-50 rounded-xl shadow-md p-6 border-2 border-red-200">
          <div className="flex items-center mb-4">
            <Trash2 className="w-6 h-6 text-red-600 mr-2" />
            <h2 className="text-2xl font-bold text-red-800">{t('settings.dangerZone')}</h2>
          </div>

          <p className="text-gray-700 mb-4">
            {t('settings.deleteWarning')}
          </p>

          <button
            onClick={deleteAccount}
            disabled={loading}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('settings.deleteAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}
