import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { detectUserLanguage } from '../../i18n/translations';
import { supabase } from '../../lib/supabase';
import { UserPlus } from 'lucide-react';

export function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { signUp } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (pseudo.length < 3) {
      setError(t('auth.pseudoTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      const detectedLang = detectUserLanguage();
      await signUp(email, password, pseudo);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ language: detectedLang })
          .eq('id', user.id);
      }
    } catch (err: any) {
      if (err.message.includes('already registered')) {
        setError(t('auth.emailAlreadyUsed'));
      } else if (err.message.includes('duplicate key')) {
        setError(t('auth.pseudoAlreadyTaken'));
      } else {
        setError(err.message || t('auth.registrationError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-center justify-center mb-6">
        <UserPlus className="w-8 h-8 text-emerald-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800">{t('auth.register')}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="pseudo" className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth.pseudo')}
          </label>
          <input
            id="pseudo"
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            required
            minLength={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            placeholder={t('auth.pseudoPlaceholder')}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth.email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            placeholder={t('auth.emailPlaceholder')}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth.password')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            placeholder={t('auth.passwordPlaceholder')}
          />
          <p className="text-xs text-gray-500 mt-1">{t('auth.passwordMinLength')}</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth.confirmPassword')}
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            placeholder={t('auth.passwordPlaceholder')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? t('common.loading') : t('auth.signUp')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={onSwitchToLogin}
          className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
        >
          {t('auth.alreadyAccount')} {t('auth.signIn')}
        </button>
      </div>
    </div>
  );
}
