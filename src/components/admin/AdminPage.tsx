import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Users, BookOpen, AlertTriangle, Award, Star, Tag, Target } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Quiz = Database['public']['Tables']['quizzes']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];

interface AdminPageProps {
  onNavigate?: (view: string, data?: any) => void;
}

export function AdminPage({ onNavigate }: AdminPageProps) {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    pendingReports: 0,
    totalBadges: 0,
  });
  const [users, setUsers] = useState<Profile[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [quizSearch, setQuizSearch] = useState('');
  const [quizSearchResults, setQuizSearchResults] = useState<Quiz[]>([]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadAdminData();
    }
  }, [profile]);

  const loadAdminData = async () => {
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: quizzesCount } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true });

    const { count: reportsCount } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: badgesCount } = await supabase
      .from('badges')
      .select('*', { count: 'exact', head: true });

    setStats({
      totalUsers: usersCount || 0,
      totalQuizzes: quizzesCount || 0,
      pendingReports: reportsCount || 0,
      totalBadges: badgesCount || 0,
    });

    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (usersData) setUsers(usersData);

    const { data: quizzesData } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (quizzesData) setQuizzes(quizzesData);

    const { data: reportsData } = await supabase
      .from('reports')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (reportsData) setReports(reportsData);
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    const { error, data } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error updating role:', error);
      alert(`Erreur lors de la modification du rôle: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      alert('Aucune ligne mise à jour. Vérifiez les permissions.');
      return;
    }

    alert(`Rôle mis à jour avec succès pour ${userId}`);
    loadAdminData();
  };

  const toggleUserBan = async (userId: string, isBanned: boolean) => {
    const confirmMessage = isBanned
      ? 'Voulez-vous vraiment débannir cet utilisateur ?'
      : 'Voulez-vous vraiment bannir cet utilisateur ?';

    if (!confirm(confirmMessage)) return;

    const reason = !isBanned ? prompt('Raison du ban (optionnel):') : null;

    const updateData = isBanned
      ? { is_banned: false, banned_at: null, ban_reason: null }
      : { is_banned: true, banned_at: new Date().toISOString(), ban_reason: reason || 'Non spécifié' };

    const { error, data } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error updating ban status:', error);
      alert(`Erreur lors de la modification du statut de ban: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      alert('Aucune ligne mise à jour. Vérifiez les permissions.');
      return;
    }

    alert(`Statut de ban mis à jour avec succès`);
    loadAdminData();
  };

  const searchQuizzes = async (query: string) => {
    if (query.trim().length < 2) {
      setQuizSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from('quizzes')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) setQuizSearchResults(data);
  };

  const deleteQuiz = async (quizId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce quiz?')) return;

    await supabase.from('quizzes').delete().eq('id', quizId);
    loadAdminData();
    if (quizSearch) searchQuizzes(quizSearch);
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès refusé</h2>
          <p className="text-gray-600">Vous devez être administrateur pour accéder à cette page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <Shield className="w-10 h-10 mr-3 text-emerald-600" />
          Administration
        </h1>
        <p className="text-gray-600">Gestion de la plateforme TerraCoast</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <Users className="w-10 h-10 mb-3" />
          <p className="text-blue-100 text-sm">Utilisateurs</p>
          <p className="text-4xl font-bold">{stats.totalUsers}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <BookOpen className="w-10 h-10 mb-3" />
          <p className="text-emerald-100 text-sm">Quiz</p>
          <p className="text-4xl font-bold">{stats.totalQuizzes}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
          <AlertTriangle className="w-10 h-10 mb-3" />
          <p className="text-amber-100 text-sm">Signalements</p>
          <p className="text-4xl font-bold">{stats.pendingReports}</p>
        </div>

        <button
          onClick={() => onNavigate?.('badge-management')}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <Award className="w-10 h-10 mb-3" />
          <p className="text-purple-100 text-sm">Badges</p>
          <p className="text-4xl font-bold mb-2">{stats.totalBadges}</p>
          <p className="text-xs text-purple-100">Cliquer pour gérer →</p>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <button
          onClick={() => onNavigate?.('quiz-validation')}
          className="bg-gradient-to-br from-teal-400 to-teal-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <BookOpen className="w-10 h-10 mb-3" />
          <p className="text-teal-100 text-sm">Validation des quiz</p>
          <p className="text-xs text-teal-100 mt-2">Approuver les quiz publics →</p>
        </button>

        <button
          onClick={() => onNavigate?.('title-management')}
          className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <Star className="w-10 h-10 mb-3" />
          <p className="text-amber-100 text-sm">Gestion des titres</p>
          <p className="text-xs text-amber-100 mt-2">Créer et gérer les titres →</p>
        </button>

        <button
          onClick={() => onNavigate?.('category-management')}
          className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <Tag className="w-10 h-10 mb-3" />
          <p className="text-blue-100 text-sm">Gestion des catégories</p>
          <p className="text-xs text-blue-100 mt-2">Gérer les catégories de quiz →</p>
        </button>

        <button
          onClick={() => onNavigate?.('difficulty-management')}
          className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <Target className="w-10 h-10 mb-3" />
          <p className="text-orange-100 text-sm">Gestion des difficultés</p>
          <p className="text-xs text-orange-100 mt-2">Gérer les niveaux de difficulté →</p>
        </button>

        <button
          onClick={() => onNavigate?.('warnings-management')}
          className="bg-gradient-to-br from-red-400 to-red-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <AlertTriangle className="w-10 h-10 mb-3" />
          <p className="text-red-100 text-sm">Gestion des signalements</p>
          <p className="text-xs text-red-100 mt-2">Traiter les avertissements →</p>
        </button>

        <button
          onClick={() => onNavigate?.('quiz-type-management')}
          className="bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <Tag className="w-10 h-10 mb-3" />
          <p className="text-indigo-100 text-sm">Types de quiz</p>
          <p className="text-xs text-indigo-100 mt-2">QCM, Texte, Mixte... →</p>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            Gestion des utilisateurs
          </h2>

          <div className="mb-4">
            <input
              type="text"
              value={userSearch}
              onChange={async (e) => {
                setUserSearch(e.target.value);
                if (e.target.value.trim().length >= 2) {
                  const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .ilike('pseudo', `%${e.target.value}%`)
                    .limit(10);
                  if (data) setSearchResults(data);
                } else {
                  setSearchResults([]);
                }
              }}
              placeholder="Rechercher un utilisateur..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="space-y-3">
            {(userSearch.trim().length >= 2 ? searchResults : users).map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{user.pseudo}</p>
                  <p className="text-sm text-gray-600">
                    Niveau {user.level} - {user.role}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </p>
                  {user.is_banned && (
                    <p className="text-xs text-red-600 font-medium mt-1">
                      ⛔ Banni - {user.ban_reason}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleUserRole(user.id, user.role)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {user.role === 'admin' ? 'Retirer admin' : 'Promouvoir admin'}
                  </button>
                  <button
                    onClick={() => toggleUserBan(user.id, user.is_banned || false)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      user.is_banned
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    }`}
                  >
                    {user.is_banned ? 'Débannir' : 'Bannir'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <BookOpen className="w-6 h-6 mr-2 text-emerald-600" />
            Quiz récents
          </h2>

          <div className="mb-4">
            <input
              type="text"
              value={quizSearch}
              onChange={(e) => {
                setQuizSearch(e.target.value);
                searchQuizzes(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setQuizSearch('');
                  setQuizSearchResults([]);
                }
              }}
              placeholder="Rechercher un quiz..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="space-y-3">
            {(quizSearch.trim().length >= 2 ? quizSearchResults : quizzes).map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{quiz.title}</p>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-xs text-gray-600">{quiz.category}</span>
                    <span className="text-xs text-gray-600">{quiz.difficulty}</span>
                    <span className="text-xs text-gray-600">
                      {quiz.total_plays} parties
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onNavigate?.(`edit-quiz`, { quizId: quiz.id })}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => deleteQuiz(quiz.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {reports.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2 text-amber-600" />
            Signalements en attente
          </h2>

          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 border-2 border-amber-200 bg-amber-50 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{report.reason}</p>
                    <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(report.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                      Résoudre
                    </button>
                    <button className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700">
                      Rejeter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
