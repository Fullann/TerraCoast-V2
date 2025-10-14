import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, Check, X, Eye, Ban, AlertOctagon } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Warning = Database['public']['Tables']['warnings']['Row'] & {
  reported_user?: { pseudo: string };
  reporter_user?: { pseudo: string };
};

export function WarningsManagementPage() {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');
  const [selectedWarning, setSelectedWarning] = useState<Warning | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionTaken, setActionTaken] = useState<'none' | 'warning' | 'temporary_ban' | 'permanent_ban' | 'force_username_change'>('none');
  const [tempBanUntil, setTempBanUntil] = useState('');
  const [banReason, setBanReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedUserHistory, setSelectedUserHistory] = useState<Warning[]>([]);

  useEffect(() => {
    loadWarnings();
  }, [filter]);

  const loadWarnings = async () => {
    let query = supabase
      .from('warnings')
      .select(`
        *,
        reported_user:profiles!warnings_reported_user_id_fkey(pseudo),
        reporter_user:profiles!warnings_reporter_user_id_fkey(pseudo)
      `)
      .order('created_at', { ascending: false });

    if (filter === 'pending') {
      query = query.eq('status', 'pending');
    } else if (filter === 'reviewed') {
      query = query.in('status', ['reviewed', 'action_taken', 'dismissed']);
    }

    const { data } = await query;
    if (data) setWarnings(data as Warning[]);
  };

  const loadUserHistory = async (userId: string) => {
    const { data } = await supabase
      .from('warnings')
      .select(`
        *,
        reported_user:profiles!warnings_reported_user_id_fkey(pseudo),
        reporter_user:profiles!warnings_reporter_user_id_fkey(pseudo)
      `)
      .eq('reported_user_id', userId)
      .order('created_at', { ascending: false });

    if (data) {
      setSelectedUserHistory(data as Warning[]);
      setShowHistory(true);
    }
  };

  const handleReviewWarning = async (warningId: string, status: string, action: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (action === 'temporary_ban' && !tempBanUntil) {
      alert('Veuillez sélectionner une date d\'expiration pour le bannissement temporaire');
      return;
    }

    if ((action === 'temporary_ban' || action === 'permanent_ban') && !banReason.trim()) {
      alert('Veuillez indiquer une raison pour le bannissement');
      return;
    }

    const updateData: any = {
      status,
      action_taken: action,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    };

    if (adminNotes.trim()) {
      updateData.admin_notes = adminNotes;
    }

    if (action === 'temporary_ban' && tempBanUntil) {
      updateData.temp_ban_until = new Date(tempBanUntil).toISOString();
    }

    const { error } = await supabase
      .from('warnings')
      .update(updateData)
      .eq('id', warningId);

    if (error) {
      alert('Erreur lors de la mise à jour');
      return;
    }

    if (action !== 'none' && selectedWarning?.reported_user_id) {
      const profileUpdate: any = {};

      if (action === 'temporary_ban') {
        profileUpdate.is_banned = true;
        profileUpdate.ban_until = new Date(tempBanUntil).toISOString();
        profileUpdate.ban_reason = banReason.trim();
      } else if (action === 'permanent_ban') {
        profileUpdate.is_banned = true;
        profileUpdate.ban_until = null;
        profileUpdate.ban_reason = banReason.trim();
      } else if (action === 'force_username_change') {
        profileUpdate.force_username_change = true;
      }

      if (Object.keys(profileUpdate).length > 0) {
        await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', selectedWarning.reported_user_id);
      }
    }

    alert('Signalement traité avec succès');
    setSelectedWarning(null);
    setAdminNotes('');
    setActionTaken('none');
    setTempBanUntil('');
    setBanReason('');
    loadWarnings();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      action_taken: 'bg-red-100 text-red-800',
      dismissed: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getActionBadge = (action: string) => {
    const styles = {
      none: 'bg-gray-100 text-gray-800',
      warning: 'bg-yellow-100 text-yellow-800',
      temporary_ban: 'bg-orange-100 text-orange-800',
      permanent_ban: 'bg-red-100 text-red-800',
    };
    return styles[action as keyof typeof styles] || styles.none;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <AlertTriangle className="w-10 h-10 mr-3 text-red-600" />
          Gestion des signalements
        </h1>
        <p className="text-gray-600">Examinez et traitez les signalements d'utilisateurs</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-100 text-yellow-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            En attente ({warnings.filter(w => w.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('reviewed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'reviewed'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Traités
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Tous
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {warnings.map((warning) => (
          <div key={warning.id} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-800">
                    Utilisateur signalé: {warning.reported_user?.pseudo || 'Inconnu'}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(warning.status)}`}>
                    {warning.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionBadge(warning.action_taken)}`}>
                    {warning.action_taken}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Signalé par: <span className="font-medium">{warning.reporter_user?.pseudo || 'Inconnu'}</span>
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  Date: {new Date(warning.created_at).toLocaleString()}
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Raison:</p>
                  <p className="text-gray-800">{warning.reason}</p>
                </div>
                {warning.admin_notes && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-700 mb-1">Notes admin:</p>
                    <p className="text-blue-900">{warning.admin_notes}</p>
                  </div>
                )}
              </div>

              <div className="ml-4 flex flex-col space-y-2">
                <button
                  onClick={() => loadUserHistory(warning.reported_user_id)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center"
                  title="Voir l'historique"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Historique
                </button>
                {warning.status === 'pending' && (
                  <button
                    onClick={() => {
                      setSelectedWarning(warning);
                      setAdminNotes(warning.admin_notes || '');
                      setActionTaken(warning.action_taken as any);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Traiter
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {warnings.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Aucun signalement à afficher</p>
          </div>
        )}
      </div>

      {selectedWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Traiter le signalement
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Utilisateur signalé</p>
              <p className="text-lg font-bold text-gray-800">{selectedWarning.reported_user?.pseudo}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Raison</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-800">{selectedWarning.reason}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action à prendre
              </label>
              <select
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="none">Aucune action</option>
                <option value="warning">Avertissement</option>
                <option value="temporary_ban">Bannissement temporaire</option>
                <option value="permanent_ban">Bannissement permanent</option>
                <option value="force_username_change">Changement de pseudo forcé</option>
              </select>
            </div>

            {(actionTaken === 'temporary_ban' || actionTaken === 'permanent_ban') && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du bannissement *
                </label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Cette raison sera affichée au joueur..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            )}

            {actionTaken === 'temporary_ban' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'expiration du ban *
                </label>
                <input
                  type="datetime-local"
                  value={tempBanUntil}
                  onChange={(e) => setTempBanUntil(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Le joueur sera automatiquement débanni à cette date
                </p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes admin (optionnel)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Ajoutez des notes sur votre décision..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedWarning(null);
                  setAdminNotes('');
                  setActionTaken('none');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors flex items-center justify-center"
              >
                <X className="w-5 h-5 mr-2" />
                Annuler
              </button>
              <button
                onClick={() => handleReviewWarning(selectedWarning.id, 'dismissed', 'none')}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                <AlertOctagon className="w-5 h-5 mr-2" />
                Rejeter
              </button>
              <button
                onClick={() => handleReviewWarning(
                  selectedWarning.id,
                  actionTaken === 'none' ? 'reviewed' : 'action_taken',
                  actionTaken
                )}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                <Check className="w-5 h-5 mr-2" />
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Historique des avertissements
              </h3>
              <button
                onClick={() => {
                  setShowHistory(false);
                  setSelectedUserHistory([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {selectedUserHistory.length === 0 ? (
              <p className="text-center text-gray-600 py-8">Aucun avertissement trouvé</p>
            ) : (
              <div className="space-y-4">
                {selectedUserHistory.map((warning, index) => (
                  <div key={warning.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-700">#{index + 1}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(warning.status)}`}>
                          {warning.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionBadge(warning.action_taken)}`}>
                          {warning.action_taken}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(warning.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Signalé par: <span className="font-medium">{warning.reporter_user?.pseudo || 'Inconnu'}</span>
                    </p>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-xs font-medium text-gray-600 mb-1">Raison:</p>
                      <p className="text-sm text-gray-800">{warning.reason}</p>
                    </div>
                    {warning.admin_notes && (
                      <div className="bg-blue-50 rounded p-3 mt-2">
                        <p className="text-xs font-medium text-blue-700 mb-1">Notes admin:</p>
                        <p className="text-sm text-blue-900">{warning.admin_notes}</p>
                      </div>
                    )}
                    {warning.temp_ban_until && (
                      <div className="bg-red-50 rounded p-3 mt-2">
                        <p className="text-xs font-medium text-red-700">
                          Ban temporaire jusqu'au: {new Date(warning.temp_ban_until).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setShowHistory(false);
                setSelectedUserHistory([]);
              }}
              className="w-full mt-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
