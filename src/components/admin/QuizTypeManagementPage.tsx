import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Tag, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type QuizType = Database['public']['Tables']['quiz_types']['Row'];

export function QuizTypeManagementPage() {
  const [quizTypes, setQuizTypes] = useState<QuizType[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingType, setEditingType] = useState<QuizType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });

  useEffect(() => {
    loadQuizTypes();
  }, []);

  const loadQuizTypes = async () => {
    const { data } = await supabase
      .from('quiz_types')
      .select('*')
      .order('name');

    if (data) setQuizTypes(data);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Le nom est requis');
      return;
    }

    const { error } = await supabase
      .from('quiz_types')
      .insert({
        name: formData.name,
        description: formData.description || null,
        color: formData.color,
      });

    if (error) {
      alert('Erreur lors de la création');
      return;
    }

    setFormData({ name: '', description: '', color: '#3B82F6' });
    setShowCreateModal(false);
    loadQuizTypes();
  };

  const handleUpdate = async () => {
    if (!editingType) return;

    const { error } = await supabase
      .from('quiz_types')
      .update({
        name: formData.name,
        description: formData.description || null,
        color: formData.color,
      })
      .eq('id', editingType.id);

    if (error) {
      alert('Erreur lors de la mise à jour');
      return;
    }

    setEditingType(null);
    setFormData({ name: '', description: '', color: '#3B82F6' });
    loadQuizTypes();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le type "${name}" ?`)) return;

    const { error } = await supabase
      .from('quiz_types')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Erreur lors de la suppression');
      return;
    }

    loadQuizTypes();
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('quiz_types')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      alert('Erreur lors de la mise à jour');
      return;
    }

    loadQuizTypes();
  };

  const openEditModal = (type: QuizType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      color: type.color,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <Tag className="w-10 h-10 mr-3 text-blue-600" />
          Gestion des types de quiz
        </h1>
        <p className="text-gray-600">Créez et gérez les types de quiz (QCM, Texte, Mixte, etc.)</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouveau type de quiz
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizTypes.map((type) => (
          <div
            key={type.id}
            className={`bg-white rounded-xl shadow-md p-6 border-2 ${
              type.is_active ? 'border-gray-200' : 'border-gray-300 opacity-50'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="px-4 py-2 rounded-lg font-bold text-lg"
                style={{
                  backgroundColor: `${type.color}20`,
                  color: type.color,
                }}
              >
                {type.name}
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => openEditModal(type)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Modifier"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(type.id, type.name)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {type.description && (
              <p className="text-sm text-gray-600 mb-4">{type.description}</p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-xs text-gray-500">Couleur: {type.color}</span>
              <button
                onClick={() => toggleActive(type.id, type.is_active)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  type.is_active
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.is_active ? 'Actif' : 'Inactif'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {quizTypes.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Aucun type de quiz créé</p>
        </div>
      )}

      {(showCreateModal || editingType) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {editingType ? 'Modifier le type' : 'Nouveau type de quiz'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="QCM, Texte, Mixte..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du type..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Couleur
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div
                  className="mt-2 px-4 py-2 rounded-lg text-center font-medium"
                  style={{
                    backgroundColor: `${formData.color}20`,
                    color: formData.color,
                  }}
                >
                  Aperçu: {formData.name || 'Nom du type'}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingType(null);
                  setFormData({ name: '', description: '', color: '#3B82F6' });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors flex items-center justify-center"
              >
                <X className="w-5 h-5 mr-2" />
                Annuler
              </button>
              <button
                onClick={editingType ? handleUpdate : handleCreate}
                disabled={!formData.name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Check className="w-5 h-5 mr-2" />
                {editingType ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
