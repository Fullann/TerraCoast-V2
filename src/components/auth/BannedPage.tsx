import { useAuth } from '../../contexts/AuthContext';
import { ShieldOff, Clock, Ban } from 'lucide-react';

export function BannedPage() {
  const { profile, signOut } = useAuth();

  const isPermanentBan = !profile?.ban_until;
  const banUntil = profile?.ban_until ? new Date(profile.ban_until) : null;
  const now = new Date();
  const isStillBanned = banUntil ? banUntil > now : isPermanentBan;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTimeRemaining = () => {
    if (!banUntil) return '';

    const diff = banUntil.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} jour${days > 1 ? 's' : ''} et ${hours} heure${hours > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} heure${hours > 1 ? 's' : ''} et ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  if (!isStillBanned) {
    window.location.reload();
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        <div className="text-center mb-6">
          {isPermanentBan ? (
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-900/30 rounded-full mb-4">
              <Ban className="w-10 h-10 text-red-500" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-900/30 rounded-full mb-4">
              <ShieldOff className="w-10 h-10 text-orange-500" />
            </div>
          )}

          <h1 className="text-2xl font-bold text-white mb-2">
            {isPermanentBan ? 'Compte Désactivé' : 'Compte Temporairement Suspendu'}
          </h1>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-6 mb-6 border border-gray-700">
          {isPermanentBan ? (
            <div>
              <p className="text-gray-300 mb-4 text-center">
                Votre compte a été définitivement banni et ne peut plus être utilisé.
              </p>
              {profile?.ban_reason && (
                <div className="mt-4 p-4 bg-red-900/20 rounded-lg border border-red-800/30">
                  <p className="text-sm text-gray-400 mb-1">Raison :</p>
                  <p className="text-gray-200">{profile.ban_reason}</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-orange-400" />
                <p className="text-gray-300">Votre compte sera réactivé dans :</p>
              </div>

              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-orange-400 mb-2">
                  {getTimeRemaining()}
                </p>
                <p className="text-sm text-gray-400">
                  Date de fin : {banUntil && formatDate(banUntil)}
                </p>
              </div>

              {profile?.ban_reason && (
                <div className="mt-4 p-4 bg-orange-900/20 rounded-lg border border-orange-800/30">
                  <p className="text-sm text-gray-400 mb-1">Raison de la suspension :</p>
                  <p className="text-gray-200">{profile.ban_reason}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          {!isPermanentBan && (
            <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4">
              <p className="text-sm text-blue-300 text-center">
                Vous pourrez vous reconnecter automatiquement une fois la suspension levée.
              </p>
            </div>
          )}

          <button
            onClick={signOut}
            className="w-full py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            Se Déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
