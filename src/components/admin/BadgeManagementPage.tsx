import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Award, Plus, CreditCard as Edit, Trash2, Save, X } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Badge = Database['public']['Tables']['badges']['Row'];

interface BadgeFormData {
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
}

export function BadgeManagementPage() {
  const { profile } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<BadgeFormData>({
    name: '',
    description: '',
    icon: 'award',
    requirement_type: 'level',
    requirement_value: 1,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadBadges();
    }
  }, [profile]);

  const loadBadges = async () => {
    const { data } = await supabase
      .from('badges')
      .select('*')
      .order('requirement_value', { ascending: true });

    if (data) {
      setBadges(data);
    }
    setLoading(false);
  };

  const startCreating = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'award',
      requirement_type: 'level',
      requirement_value: 1,
    });
    setEditingBadge(null);
    setIsCreating(true);
  };

  const startEditing = (badge: Badge) => {
    setFormData({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      requirement_type: badge.requirement_type,
      requirement_value: badge.requirement_value,
    });
    setEditingBadge(badge);
    setIsCreating(true);
  };

  const cancelEditing = () => {
    setIsCreating(false);
    setEditingBadge(null);
    setFormData({
      name: '',
      description: '',
      icon: 'award',
      requirement_type: 'level',
      requirement_value: 1,
    });
  };

  const saveBadge = async () => {
    try {
      if (editingBadge) {
        await supabase
          .from('badges')
          .update({
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            requirement_type: formData.requirement_type,
            requirement_value: formData.requirement_value,
          })
          .eq('id', editingBadge.id);
      } else {
        await supabase.from('badges').insert({
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
          requirement_type: formData.requirement_type,
          requirement_value: formData.requirement_value,
        });
      }

      loadBadges();
      cancelEditing();
    } catch (error) {
      console.error('Error saving badge:', error);
      alert('Erreur lors de l\'enregistrement du badge');
    }
  };

  const deleteBadge = async (badgeId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce badge?')) return;

    try {
      await supabase.from('badges').delete().eq('id', badgeId);
      loadBadges();
    } catch (error) {
      console.error('Error deleting badge:', error);
      alert('Erreur lors de la suppression du badge');
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h2>
          <p className="text-gray-600">Seuls les administrateurs peuvent gérer les badges</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <Award className="w-10 h-10 mr-3 text-emerald-600" />
          Gestion des Badges
        </h1>
        <p className="text-gray-600">Créez et gérez les badges et leurs conditions</p>
      </div>

      {isCreating ? (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {editingBadge ? 'Modifier le badge' : 'Créer un badge'}
            </h2>
            <button
              onClick={cancelEditing}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du badge *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="Ex: Explorateur"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                rows={3}
                placeholder="Décrivez ce badge..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icône
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="award">Médaille (award)</option>
                  <option value="trophy">Trophée (trophy)</option>
                  <option value="star">Étoile (star)</option>
                  <option value="crown">Couronne (crown)</option>
                  <option value="shield">Bouclier (shield)</option>
                  <option value="target">Cible (target)</option>
                  <option value="zap">Éclair (zap)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de condition *
                </label>
                <select
                  value={formData.requirement_type}
                  onChange={(e) => setFormData({ ...formData, requirement_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="level">Niveau</option>
                  <option value="wins">Victoires</option>
                  <option value="quizzes_completed">Quiz complétés</option>
                  <option value="perfect_scores">Scores parfaits</option>
                  <option value="streak">Série de victoires</option>
                  <option value="total_points">Points totaux</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valeur requise *
                </label>
                <input
                  type="number"
                  value={formData.requirement_value}
                  onChange={(e) =>
                    setFormData({ ...formData, requirement_value: parseInt(e.target.value) || 1 })
                  }
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={cancelEditing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveBadge}
                disabled={!formData.name || !formData.description}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Save className="w-5 h-5 mr-2" />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <button
            onClick={startCreating}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Créer un badge
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des badges...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{badge.name}</h3>
                    <p className="text-xs text-gray-500">{badge.icon}</p>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">{badge.description}</p>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-600 font-medium mb-1">Condition</p>
                <p className="text-sm text-gray-800">
                  {badge.requirement_type === 'level' && `Niveau ${badge.requirement_value}`}
                  {badge.requirement_type === 'wins' && `${badge.requirement_value} victoires`}
                  {badge.requirement_type === 'quizzes_completed' && `${badge.requirement_value} quiz complétés`}
                  {badge.requirement_type === 'perfect_scores' && `${badge.requirement_value} scores parfaits`}
                  {badge.requirement_type === 'streak' && `Série de ${badge.requirement_value}`}
                  {badge.requirement_type === 'total_points' && `${badge.requirement_value} points`}
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => startEditing(badge)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </button>
                <button
                  onClick={() => deleteBadge(badge.id)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && badges.length === 0 && !isCreating && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun badge</h3>
          <p className="text-gray-500">Créez le premier badge pour commencer</p>
        </div>
      )}
    </div>
  );
}
