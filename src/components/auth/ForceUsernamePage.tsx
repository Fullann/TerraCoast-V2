import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { UserCog, AlertCircle } from 'lucide-react';

export function ForceUsernamePage() {
  const { profile, refreshProfile } = useAuth();
  const [newUsername, setNewUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newUsername.trim()) {
      setError('Veuillez entrer un nouveau pseudo');
      return;
    }

    if (newUsername.length < 3 || newUsername.length > 20) {
      setError('Le pseudo doit contenir entre 3 et 20 caractères');
      return;
    }

    if (!/^[a-zA-Z0-9_\s]+$/.test(newUsername)) {
      setError('Le pseudo ne peut contenir que des lettres, chiffres, underscores et espaces');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('pseudo', newUsername.trim())
        .maybeSingle();

      if (existing) {
        setError('Ce pseudo est déjà pris');
        setIsSubmitting(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          pseudo: newUsername.trim(),
          force_username_change: false,
        })
        .eq('id', profile?.id);

      if (updateError) {
        console.error('Error updating username:', updateError);
        setError('Erreur lors de la mise à jour du pseudo');
        setIsSubmitting(false);
        return;
      }

      await refreshProfile();
      window.location.reload();
    } catch (err) {
      console.error('Error:', err);
      setError('Une erreur est survenue');
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
            Changement de Pseudo Requis
          </h1>
          <p className="text-gray-400">
            Vous devez choisir un nouveau pseudo pour continuer
          </p>
        </div>

        <div className="bg-orange-900/20 border border-orange-800/30 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-orange-300 mb-1 font-medium">
                Votre pseudo actuel a été signalé
              </p>
              <p className="text-xs text-gray-400">
                Un administrateur vous demande de choisir un nouveau pseudo approprié.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pseudo Actuel
            </label>
            <div className="px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg">
              <p className="text-gray-400 line-through">{profile?.pseudo}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nouveau Pseudo
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Entrez votre nouveau pseudo"
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">
              3-20 caractères, lettres, chiffres, underscores et espaces uniquement
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
            {isSubmitting ? 'Mise à jour...' : 'Confirmer le Nouveau Pseudo'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Vous ne pourrez pas accéder à l'application tant que vous n'aurez pas choisi un nouveau pseudo approprié.
          </p>
        </div>
      </div>
    </div>
  );
}
