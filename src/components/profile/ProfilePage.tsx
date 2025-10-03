import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Award, Trophy, Star, Calendar, TrendingUp } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Badge = Database['public']['Tables']['badges']['Row'];
type UserBadge = Database['public']['Tables']['user_badges']['Row'] & { badges: Badge };
type Title = Database['public']['Tables']['titles']['Row'];
type UserTitle = Database['public']['Tables']['user_titles']['Row'] & { titles: Title };
type GameSession = Database['public']['Tables']['game_sessions']['Row'];

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [titles, setTitles] = useState<UserTitle[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    winRate: 0,
    averageScore: 0,
  });

  useEffect(() => {
    loadProfileData();
  }, [profile]);

  const loadProfileData = async () => {
    if (!profile) return;

    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', profile.id);

    if (userBadges) setBadges(userBadges as UserBadge[]);

    const { data: userTitles } = await supabase
      .from('user_titles')
      .select('*, titles(*)')
      .eq('user_id', profile.id);

    if (userTitles) setTitles(userTitles as UserTitle[]);

    const { data: gameSessions } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('player_id', profile.id)
      .eq('completed', true)
      .order('completed_at', { ascending: false });

    if (gameSessions) {
      setSessions(gameSessions);
      const totalGames = gameSessions.length;
      const totalScore = gameSessions.reduce((sum, s) => sum + s.score, 0);
      const averageScore = totalGames > 0 ? totalScore / totalGames : 0;
      const winRate = totalGames > 0 ? (gameSessions.filter(s => s.accuracy_percentage >= 70).length / totalGames) * 100 : 0;

      setStats({ totalGames, winRate, averageScore });
    }
  };

  const activeTitle = titles.find(t => t.is_active);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{profile?.pseudo}</h1>
            {activeTitle && (
              <div className="flex items-center space-x-2 mb-4">
                <Star className="w-5 h-5 text-yellow-300" />
                <span className="text-lg text-yellow-100">{activeTitle.titles.name}</span>
              </div>
            )}
            <div className="flex items-center space-x-6 mt-4">
              <div>
                <p className="text-emerald-100 text-sm">Niveau</p>
                <p className="text-3xl font-bold">{profile?.level}</p>
              </div>
              <div>
                <p className="text-emerald-100 text-sm">XP</p>
                <p className="text-2xl font-bold">{profile?.experience_points}</p>
              </div>
              <div>
                <p className="text-emerald-100 text-sm">Quiz publiés</p>
                <p className="text-2xl font-bold">{profile?.published_quiz_count} / 10</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white/20 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex justify-between items-center text-sm">
            <span>Progression niveau {profile?.level}</span>
            <span>{profile?.experience_points % 1000} / 1000 XP</span>
          </div>
          <div className="mt-2 bg-white/30 rounded-full h-3 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${((profile?.experience_points || 0) % 1000) / 10}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Trophy className="w-8 h-8 text-emerald-600" />
            <div>
              <p className="text-sm text-gray-600">Parties jouées</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalGames}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Score moyen</p>
              <p className="text-2xl font-bold text-gray-800">{Math.round(stats.averageScore)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Star className="w-8 h-8 text-amber-600" />
            <div>
              <p className="text-sm text-gray-600">Taux de réussite</p>
              <p className="text-2xl font-bold text-gray-800">{Math.round(stats.winRate)}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Award className="w-6 h-6 mr-2 text-emerald-600" />
            Badges
          </h2>

          {badges.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun badge obtenu</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {badges.map((userBadge) => (
                <div
                  key={userBadge.id}
                  className="p-4 border-2 border-emerald-200 rounded-lg bg-emerald-50"
                >
                  <Award className="w-8 h-8 text-emerald-600 mb-2" />
                  <h3 className="font-semibold text-gray-800">{userBadge.badges.name}</h3>
                  <p className="text-sm text-gray-600">{userBadge.badges.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(userBadge.earned_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Star className="w-6 h-6 mr-2 text-amber-600" />
            Titres
          </h2>

          {titles.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun titre obtenu</p>
          ) : (
            <div className="space-y-3">
              {titles.map((userTitle) => (
                <div
                  key={userTitle.id}
                  className={`p-4 border-2 rounded-lg ${
                    userTitle.is_active
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 flex items-center">
                        {userTitle.titles.name}
                        {userTitle.titles.is_special && (
                          <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full">
                            Spécial
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">{userTitle.titles.description}</p>
                    </div>
                    {userTitle.is_active && (
                      <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Calendar className="w-6 h-6 mr-2 text-blue-600" />
          Historique des parties
        </h2>

        {sessions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune partie jouée</p>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 10).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {session.mode === 'solo' ? 'Solo' : 'Duel'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(session.completed_at || session.started_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">{session.score} pts</p>
                  <p className="text-sm text-gray-600">{Math.round(session.accuracy_percentage)}% précision</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
