import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Tag, Plus, CreditCard as Edit, Trash2, Save, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  label: string;
}

interface CategoryFormData {
  name: string;
  label: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'flags', name: 'flags', label: 'Drapeaux' },
  { id: 'capitals', name: 'capitals', label: 'Capitales' },
  { id: 'maps', name: 'maps', label: 'Cartes' },
  { id: 'borders', name: 'borders', label: 'Frontières' },
  { id: 'regions', name: 'regions', label: 'Régions' },
  { id: 'mixed', name: 'mixed', label: 'Mixte' },
];

export function CategoryManagementPage() {
  const { profile } = useAuth();
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    label: '',
  });

  const startCreating = () => {
    setFormData({
      name: '',
      label: '',
    });
    setEditingCategory(null);
    setIsCreating(true);
  };

  const startEditing = (category: Category) => {
    setFormData({
      name: category.name,
      label: category.label,
    });
    setEditingCategory(category);
    setIsCreating(true);
  };

  const cancelEditing = () => {
    setIsCreating(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      label: '',
    });
  };

  const saveCategory = () => {
    if (editingCategory) {
      setCategories(categories.map(cat =>
        cat.id === editingCategory.id
          ? { ...cat, name: formData.name, label: formData.label }
          : cat
      ));
    } else {
      const newCategory: Category = {
        id: formData.name.toLowerCase().replace(/\s+/g, '_'),
        name: formData.name.toLowerCase().replace(/\s+/g, '_'),
        label: formData.label,
      };
      setCategories([...categories, newCategory]);
    }

    cancelEditing();
  };

  const deleteCategory = (categoryId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette catégorie?')) return;
    setCategories(categories.filter(cat => cat.id !== categoryId));
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h2>
          <p className="text-gray-600">Seuls les administrateurs peuvent gérer les catégories</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <Tag className="w-10 h-10 mr-3 text-blue-600" />
          Gestion des Catégories
        </h1>
        <p className="text-gray-600">Gérez les catégories de quiz disponibles</p>
      </div>

      {isCreating ? (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {editingCategory ? 'Modifier la catégorie' : 'Créer une catégorie'}
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
                Nom de la catégorie *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Ex: flags"
                disabled={!!editingCategory}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Ex: Drapeaux"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={cancelEditing}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveCategory}
                disabled={!formData.name || !formData.label}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Créer une catégorie
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Tag className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{category.label}</h3>
                  <p className="text-xs text-gray-500">{category.name}</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => startEditing(category)}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Edit className="w-4 h-4 mr-1" />
                Modifier
              </button>
              <button
                onClick={() => deleteCategory(category.id)}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!isCreating && categories.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune catégorie</h3>
          <p className="text-gray-500">Créez la première catégorie pour commencer</p>
        </div>
      )}
    </div>
  );
}
