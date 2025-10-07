import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Target, Plus, CreditCard as Edit, Trash2, Save, X } from 'lucide-react';

interface Difficulty {
  id: string;
  name: string;
  label: string;
  color: string;
}

interface DifficultyFormData {
  name: string;
  label: string;
  color: string;
}

export function DifficultyManagementPage() {
  const { profile } = useAuth();
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [editingDifficulty, setEditingDifficulty] = useState<Difficulty | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<DifficultyFormData>({
    name: '',
    label: '',
    color: 'gray',
  });

  const startCreating = () => {
    setFormData({
      name: '',
      label: '',
      color: 'gray',
    });
    setEditingDifficulty(null);
    setIsCreating(true);
  };

  const startEditing = (difficulty: Difficulty) => {
    setFormData({
      name: difficulty.name,
      label: difficulty.label,
      color: difficulty.color,
    });
    setEditingDifficulty(difficulty);
    setIsCreating(true);
  };

  useEffect(() => {
    loadDifficulties();
  }, []);

  const loadDifficulties = async () => {
    const { data } = await supabase
      .from('difficulties')
      .select('*')
      .order('created_at', { ascending: true });

    if (data) {
      setDifficulties(data);
    }
  };

  const cancelEditing = () => {
    setIsCreating(false);
    setEditingDifficulty(null);
    setFormData({
      name: '',
      label: '',
      color: 'gray',
    });
  };

  const saveDifficulty = async () => {
    if (editingDifficulty) {
      const { error } = await supabase
        .from('difficulties')
        .update({
          name: formData.name.toLowerCase().replace(/\s+/g, '_'),
          label: formData.label,
          color: formData.color,
        })
        .eq('id', editingDifficulty.id);

      if (!error) {
        await loadDifficulties();
      }
    } else {
      const { error } = await supabase
        .from('difficulties')
        .insert({
          name: formData.name.toLowerCase().replace(/\s+/g, '_'),
          label: formData.label,
          color: formData.color,
        });

      if (!error) {
        await loadDifficulties();
      }
    }

    cancelEditing();
  };

  const deleteDifficulty = async (difficultyId: string) => {
    if (!confirm('Veux-tu vraiment supprimer cette difficulté?')) return;

    const { error } = await supabase
      .from('difficulties')
      .delete()
      .eq('id', difficultyId);

    if (!error) {
      await loadDifficulties();
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; badge: string }> = {
      green: { bg: 'bg-green-100', text: 'text-green-600', badge: 'bg-green-100 text-green-700' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
      red: { bg: 'bg-red-100', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
      gray: { bg: 'bg-gray-100', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-700' },
    };
    return colorMap[color] || colorMap.gray;
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h2>
          <p className="text-gray-600">Seuls les administrateurs peuvent gérer les difficultés</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <Target className="w-10 h-10 mr-3 text-orange-600" />
          Gestion des Difficultés
        </h1>
        <p className="text-gray-600">Gérez les niveaux de difficulté des quiz</p>
      </div>

      {isCreating ? (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {editingDifficulty ? 'Modifier la difficulté' : 'Créer une difficulté'}
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
                Nom de la difficulté *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="Ex: easy"
              />
              <p className="text-xs text-gray-500 mt-1">
                Utilisé dans le code (minuscules, sans espaces)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Libellé affiché *
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="Ex: Facile"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['green', 'yellow', 'red', 'blue', 'purple', 'orange', 'gray'].map((color) => {
                  const colors = getColorClasses(color);
                  return (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.color === color
                          ? 'border-orange-500 ring-2 ring-orange-200'
                          : 'border-gray-200 hover:border-orange-300'
                      } ${colors.bg}`}
                    >
                      <div className={`w-6 h-6 rounded-full ${colors.text} mx-auto`}>
                        <Target className="w-6 h-6" />
                      </div>
                      <p className="text-xs mt-2 text-gray-600 capitalize">{color}</p>
                    </button>
                  );
                })}
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
                onClick={saveDifficulty}
                disabled={!formData.name || !formData.label}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Créer une difficulté
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {difficulties.map((difficulty) => {
          const colors = getColorClasses(difficulty.color);
          return (
            <div
              key={difficulty.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colors.bg}`}>
                    <Target className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{difficulty.label}</h3>
                    <p className="text-xs text-gray-500">{difficulty.name}</p>
                    <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${colors.badge}`}>
                      {difficulty.color}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => startEditing(difficulty)}
                  className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </button>
                <button
                  onClick={() => deleteDifficulty(difficulty.id)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!isCreating && difficulties.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune difficulté</h3>
          <p className="text-gray-500">Créez la première difficulté pour commencer</p>
        </div>
      )}
    </div>
  );
}
