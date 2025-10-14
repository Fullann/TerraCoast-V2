import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface LeaderboardEntry extends Profile {
  total_score: number;
  games_played: number;
}

interface LeaderboardPageProps {
  onNavigate?: (view: string, data?: any) => void;
}

export function LeaderboardPage({ onNavigate }: LeaderboardPageProps = {}) {
  const { profile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'global' | 'friends'>('global');
  const [period, setPeriod] = useState<'monthly' | 'alltime'>('monthly');

  useEffect(() => {
    loadLeaderboard();
  }, [view, period]);

  const loadLeaderboard = async () => {
    setLoading(true);

    let profiles: Profile[] = [];

    if (view === 'global') {
      const orderBy = period === 'monthly' ? 'monthly_score' : 'experience_points';
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_banned', false)
        .order(orderBy, { ascending: false })
        .limit(100);

      profiles = data || [];
    } else if (view === 'friends' && profile) {
      const { data: friendshipsAsSender } = await supabase
        .from('friendships')
        .select('friend_profile:profiles!friendships_friend_id_fkey(*)')
        .eq('user_id', profile.id)
        .eq('status', 'accepted')
        .eq('friend_profile.is_banned', false);

      const { data: friendshipsAsReceiver } = await supabase
        .from('friendships')
        .select('user_profile:profiles!friendships_user_id_fkey(*)')
        .eq('friend_id', profile.id)
        .eq('status', 'accepted')
        .eq('user_profile.is_banned', false);

      const friendProfiles: Profile[] = [
        ...(friendshipsAsSender?.map((f: any) => f.friend_profile) || []),
        ...(friendshipsAsReceiver?.map((f: any) => f.user_profile) || []),
      ];

      profiles = [profile, ...friendProfiles];
    }

    if (profiles.length > 0) {
      const enrichedData = await Promise.all(
        profiles.map(async (p) => {
          if (period === 'monthly') {
            return {
              ...p,
              total_score: p.monthly_score || 0,
              games_played: p.monthly_games_played || 0,
            };
          } else {
            const { data: sessions } = await supabase
              .from('game_sessions')
              .select('score')
              .eq('player_id', p.id)
              .eq('completed', true);

            const total_score = sessions?.reduce((sum, s) => sum + s.score, 0) || 0;
            const games_played = sessions?.length || 0;

            return {
              ...p,
              total_score,
              games_played,
            };
          }
        })
      );

      enrichedData.sort((a, b) => b.total_score - a.total_score);
      setLeaderboard(enrichedData);
    } else {
      setLeaderboard([]);
    }

    setLoading(false);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) {
      return <Crown className="w-6 h-6 text-yellow-500" />;
    }
    if (index === 1) {
      return (
        <div className="relative">
          <Medal className="w-6 h-6 text-gray-400" />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">2</span>
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="relative">
          <Medal className="w-6 h-6 text-amber-600" />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-amber-800">3</span>
        </div>
      );
    }
    return <span className="text-gray-500 font-semibold">{index + 1}</span>;
  };

  const getRankBackground = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300';
    if (index === 1) return 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300';
    if (index === 2) return 'bg-gradient-to-r from-amber-50 to-orange-100 border-amber-300';
    if (index < 10 && period === 'monthly') return 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300';
    return 'bg-white border-gray-200';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <Trophy className="w-10 h-10 mr-3 text-emerald-600" />
          Classement
        </h1>
        <p className="text-gray-600">Les meilleurs joueurs de TerraCoast</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setView('global')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              view === 'global'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Classement mondial
          </button>
          <button
            onClick={() => setView('friends')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              view === 'friends'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Trophy className="w-4 h-4 inline mr-2" />
            Entre amis
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex space-x-2">
          <button
            onClick={() => setPeriod('monthly')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              period === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Ce mois-ci
          </button>
          <button
            onClick={() => setPeriod('alltime')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              period === 'alltime'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tous les temps
          </button>
        </div>
        {period === 'monthly' && (
          <p className="text-sm text-gray-500 mt-3 text-center">
            Les scores sont réinitialisés chaque mois. Top 10 reçoivent un titre !
          </p>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du classement...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun joueur</h3>
          <p className="text-gray-500">Le classement est vide pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.id}
              onClick={() => onNavigate?.('view-profile', { userId: entry.id })}
              className={`${getRankBackground(index)} rounded-xl border-2 p-6 transition-all hover:shadow-lg cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 flex items-center justify-center">
                    {getRankIcon(index)}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{entry.pseudo}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-600">
                        Niveau {entry.level}
                      </span>
                      <span className="text-sm text-gray-500">
                        {entry.games_played} {entry.games_played <= 1 ? 'partie' : 'parties'} {period === 'monthly' ? 'ce mois' : ''}
                      </span>
                      {entry.top_10_count > 0 && index < 10 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-amber-500 text-white">
                          <Crown className="w-3 h-3 mr-1" />
                          {entry.top_10_count}x Top 10
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-bold text-emerald-600">
                    {entry.total_score.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">points totaux</p>
                  <p className="text-sm font-semibold text-gray-700 mt-1">
                    {entry.experience_points.toLocaleString()} XP
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
