import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { Star, Plus, CreditCard as Edit, Trash2, Save, X } from "lucide-react";
import type { Database } from "../../lib/database.types";

type Title = Database["public"]["Tables"]["titles"]["Row"];

interface TitleFormData {
  name: string;
  description: string;
  requirement_type: string;
  requirement_value: number;
  is_special: boolean;
}

export function TitleManagementPage() {
  const { profile } = useAuth();
  const [titles, setTitles] = useState<Title[]>([]);
  const [editingTitle, setEditingTitle] = useState<Title | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<TitleFormData>({
    name: "",
    description: "",
    requirement_type: "level",
    requirement_value: 1,
    is_special: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === "admin") {
      loadTitles();
    }
  }, [profile]);

  const loadTitles = async () => {
    const { data } = await supabase
      .from("titles")
      .select("*")
      .order("is_special", { ascending: false });

    if (data) {
      setTitles(data);
    }
    setLoading(false);
  };

  const startCreating = () => {
    setFormData({
      name: "",
      description: "",
      requirement_type: "level",
      requirement_value: 1,
      is_special: false,
    });
    setEditingTitle(null);
    setIsCreating(true);
  };

  const startEditing = (title: Title) => {
    setFormData({
      name: title.name,
      description: title.description,
      requirement_type: title.requirement_type,
      requirement_value: title.requirement_value,
      is_special: title.is_special,
    });
    setEditingTitle(title);
    setIsCreating(true);
  };

  const cancelEditing = () => {
    setIsCreating(false);
    setEditingTitle(null);
    setFormData({
      name: "",
      description: "",
      requirement_type: "level",
      requirement_value: 1,
      is_special: false,
    });
  };

  const saveTitle = async () => {
    try {
      if (editingTitle) {
        await supabase
          .from("titles")
          .update({
            name: formData.name,
            description: formData.description,
            requirement_type: formData.requirement_type,
            requirement_value: formData.requirement_value,
            is_special: formData.is_special,
          })
          .eq("id", editingTitle.id);
      } else {
        await supabase.from("titles").insert({
          name: formData.name,
          description: formData.description,
          requirement_type: formData.requirement_type,
          requirement_value: formData.requirement_value,
          is_special: formData.is_special,
        });
      }

      loadTitles();
      cancelEditing();
    } catch (error) {
      console.error("Error saving title:", error);
      alert("Erreur lors de l'enregistrement du titre");
    }
  };

  const deleteTitle = async (titleId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce titre?")) return;

    try {
      await supabase.from("titles").delete().eq("id", titleId);
      loadTitles();
    } catch (error) {
      console.error("Error deleting title:", error);
      alert("Erreur lors de la suppression du titre");
    }
  };

  if (profile?.role !== "admin") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Accès refusé
          </h2>
          <p className="text-gray-600">
            Seuls les administrateurs peuvent gérer les titres
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
              <Star className="w-10 h-10 mr-3 text-amber-600" />
              Gestion des Titres
            </h1>
            <p className="text-gray-600">
              Créez et gérez les titres et leurs conditions
            </p>
          </div>
          <button
            onClick={async () => {
              if (
                !confirm(
                  "Attribuer tous les titres mérités à tous les utilisateurs ? Cela peut prendre du temps."
                )
              )
                return;
              const { error } = await supabase.rpc(
                "assign_titles_to_all_users"
              );
              if (error) {
                alert("Erreur: " + error.message);
              } else {
                alert("Titres attribués avec succès !");
              }
            }}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            Attribuer les titres à tous
          </button>
        </div>
      </div>

      {isCreating ? (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {editingTitle ? "Modifier le titre" : "Créer un titre"}
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
                Nom du titre *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                placeholder="Ex: Maître Géographe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                rows={3}
                placeholder="Décrivez ce titre..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de condition *
                </label>
                <select
                  value={formData.requirement_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requirement_type: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                >
                  <option value="level">Niveau</option>
                  <option value="first_place">Première place</option>
                  <option value="account_age_days">
                    Âge du compte (jours)
                  </option>
                  <option value="wins">Victoires</option>
                  <option value="quizzes_completed">Quiz complétés</option>
                  <option value="perfect_scores">Scores parfaits</option>
                  <option value="published_quizzes">Quiz publiés</option>
                  <option value="monthly_rank">
                    Classement mensuel (top X)
                  </option>
                  <option value="badges_earned">Badges gagnés</option>
                  <option value="total_score">Score total</option>
                  <option value="friends_count">Nombre d'amis</option>
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
                    setFormData({
                      ...formData,
                      requirement_value: parseInt(e.target.value) || 1,
                    })
                  }
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="is_special"
                  checked={formData.is_special}
                  onChange={(e) =>
                    setFormData({ ...formData, is_special: e.target.checked })
                  }
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label
                  htmlFor="is_special"
                  className="ml-2 text-sm text-gray-700"
                >
                  Titre spécial
                </label>
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
                onClick={saveTitle}
                disabled={!formData.name || !formData.description}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Créer un titre
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des titres...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {titles.map((title) => (
            <div
              key={title.id}
              className={`rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow ${
                title.is_special
                  ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300"
                  : "bg-white"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      title.is_special ? "bg-amber-200" : "bg-amber-100"
                    }`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        title.is_special
                          ? "text-amber-700 fill-amber-700"
                          : "text-amber-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{title.name}</h3>
                    {title.is_special && (
                      <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full">
                        Spécial
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">{title.description}</p>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-600 font-medium mb-1">
                  Condition
                </p>
                <p className="text-sm text-gray-800">
                  {title.requirement_type === "level" &&
                    `Niveau ${title.requirement_value}`}
                  {title.requirement_type === "first_place" &&
                    `${title.requirement_value} première place(s)`}
                  {title.requirement_type === "account_age_days" &&
                    `Compte de ${title.requirement_value} jour(s)`}
                  {title.requirement_type === "wins" &&
                    `${title.requirement_value} victoire(s)`}
                  {title.requirement_type === "quizzes_completed" &&
                    `${title.requirement_value} quiz complété(s)`}
                  {title.requirement_type === "perfect_scores" &&
                    `${title.requirement_value} score(s) parfait(s)`}
                  {title.requirement_type === "published_quizzes" &&
                    `${title.requirement_value} quiz publié(s)`}
                  {title.requirement_type === "monthly_rank" &&
                    `Top ${title.requirement_value} du classement mensuel`}
                  {title.requirement_type === "badges_earned" &&
                    `${title.requirement_value} badge(s) gagné(s)`}
                  {title.requirement_type === "total_score" &&
                    `Score total de ${title.requirement_value}`}
                  {title.requirement_type === "friends_count" &&
                    `${title.requirement_value} ami(s)`}
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => startEditing(title)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </button>
                <button
                  onClick={() => deleteTitle(title.id)}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && titles.length === 0 && !isCreating && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Aucun titre
          </h3>
          <p className="text-gray-500">Créez le premier titre pour commencer</p>
        </div>
      )}
    </div>
  );
}
