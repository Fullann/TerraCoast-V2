import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';
import { Award, Trophy, Star, Calendar, TrendingUp, AlertTriangle, Settings, ArrowLeft, Flame, UserPlus, UserCheck, Clock } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Badge = Database['public']['Tables']['badges']['Row'];
type UserBadge = Database['public']['Tables']['user_badges']['Row'] & { badges: Badge };
type Title = Database['public']['Tables']['titles']['Row'];
type UserTitle = Database['public']['Tables']['user_titles']['Row'] & { titles: Title };
type GameSession = Database['public']['Tables']['game_sessions']['Row'];

interface ProfilePageProps {
  userId?: string;
  onNavigate: (view: string, data?: any) => void;
}

export function ProfilePage({ userId, onNavigate }: ProfilePageProps) {
  const { profile: currentUserProfile } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [titles, setTitles] = useState<UserTitle[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    winRate: 0,
    averageScore: 0,
  });
  const [dailyStats, setDailyStats] = useState<{ date: string; points: number }[]>([]);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [warnReason, setWarnReason] = useState('');
  const [sending, setSending] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending' | 'friends' | 'blocked'>('none');

  const isOwnProfile = !userId || userId === currentUserProfile?.id;
  const targetUserId = userId || currentUserProfile?.id;

  useEffect(() => {
    loadProfileData();
  }, [targetUserId]);

  const loadProfileData = async () => {
    if (!targetUserId) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (profileData) setProfile(profileData);

    if (!isOwnProfile && currentUserProfile) {
      await loadFriendshipStatus();
    }

    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', targetUserId);

    if (userBadges) setBadges(userBadges as UserBadge[]);

    const { data: userTitles } = await supabase
      .from('user_titles')
      .select('*, titles(*)')
      .eq('user_id', targetUserId);

    if (userTitles) setTitles(userTitles as UserTitle[]);

    const { data: gameSessions } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('player_id', targetUserId)
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

    const { data: last7DaysData } = await supabase
      .from('game_sessions')
      .select('score, completed_at')
      .eq('player_id', targetUserId)
      .eq('completed', true)
      .gte('completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('completed_at', { ascending: true });

    if (last7DaysData) {
      const dailyPointsMap = new Map<string, number>();
      last7DaysData.forEach((session) => {
        const date = new Date(session.completed_at!).toLocaleDateString();
        dailyPointsMap.set(date, (dailyPointsMap.get(date) || 0) + session.score);
      });
      const dailyStatsArray = Array.from(dailyPointsMap.entries()).map(([date, points]) => ({
        date,
        points,
      }));
      setDailyStats(dailyStatsArray);
    }
  };

  const loadFriendshipStatus = async () => {
    if (!currentUserProfile || !targetUserId) return;

    const { data: friendship } = await supabase
      .from('friendships')
      .select('status')
      .or(`and(user1_id.eq.${currentUserProfile.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${currentUserProfile.id})`)
      .maybeSingle();

    if (friendship) {
      setFriendshipStatus(friendship.status as any);
    } else {
      setFriendshipStatus('none');
    }
  };

  const sendFriendRequest = async () => {
    if (!currentUserProfile || !targetUserId) return;

    const { error } = await supabase
      .from('friendships')
      .insert({
        user1_id: currentUserProfile.id,
        user2_id: targetUserId,
        status: 'pending',
      });

    if (error) {
      alert('Erreur lors de l\'envoi de la demande');
      return;
    }

    alert('Demande d\'ami envoyée !');
    setFriendshipStatus('pending');
  };

  const handleSendWarning = async () => {
    if (!warnReason.trim() || !currentUserProfile || !targetUserId) return;

    setSending(true);

    const { error } = await supabase
      .from('warnings')
      .insert({
        reported_user_id: targetUserId,
        reporter_user_id: currentUserProfile.id,
        reason: warnReason.trim(),
      });

    setSending(false);

    if (error) {
      alert('Erreur lors de l\'envoi du signalement');
      return;
    }

    alert('Signalement envoyé avec succès');
    setShowWarnModal(false);
    setWarnReason('');
  };

  if (!profile) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Chargement...</div>
      </div>
    );
  }

  const activeTitle = titles.find(t => t.is_active)?.titles;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {!isOwnProfile && (
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('common.back')}
        </button>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {profile.pseudo.charAt(0).toUpperCase()}
              </span>
            </div>

            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{profile.pseudo}</h1>
              {activeTitle && (
                <p className="text-lg text-emerald-600 font-medium mb-2">
                  {activeTitle.emoji} {activeTitle.name}
                </p>
              )}
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center">
                  <Trophy className="w-5 h-5 mr-1 text-yellow-500" />
                  <span className="font-medium">{t('profile.level')} {profile.level}</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-5 h-5 mr-1 text-emerald-500" />
                  <span className="font-medium">{profile.xp} {t('profile.xp')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            {isOwnProfile && (
              <button
                onClick={() => onNavigate('settings')}
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 mr-2" />
                {t('nav.settings')}
              </button>
            )}

            {!isOwnProfile && friendshipStatus === 'none' && (
              <button
                onClick={sendFriendRequest}
                className="flex items-center px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Ajouter en ami
              </button>
            )}

            {!isOwnProfile && friendshipStatus === 'pending' && (
              <button
                disabled
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
              >
                <Clock className="w-5 h-5 mr-2" />
                Demande envoyée
              </button>
            )}

            {!isOwnProfile && friendshipStatus === 'accepted' && (
              <button
                disabled
                className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg cursor-not-allowed"
              >
                <UserCheck className="w-5 h-5 mr-2" />
                Ami
              </button>
            )}

            {!isOwnProfile && (
              <button
                onClick={() => setShowWarnModal(true)}
                className="flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              >
                <AlertTriangle className="w-5 h-5 mr-2" />
                Signaler
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-blue-900">Parties jouées</h3>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">{stats.totalGames}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-green-900">Taux de réussite</h3>
              <Trophy className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">{stats.winRate.toFixed(1)}%</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-100 p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-orange-900">Série en cours</h3>
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-3xl font-bold text-orange-900">{profile?.current_streak || 0}</p>
              <Flame className={`w-8 h-8 ${(profile?.current_streak || 0) > 0 ? 'text-orange-500 animate-pulse' : 'text-gray-400'}`} />
            </div>
            <p className="text-xs text-orange-700 mt-1">Record: {profile?.longest_streak || 0} jours</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Star className="w-6 h-6 mr-2 text-amber-500" />
            Titres ({titles.length})
          </h2>
          <div className="space-y-2">
            {titles.map((userTitle) => (
              <div
                key={userTitle.id}
                className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                  userTitle.is_active
                    ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{userTitle.titles.emoji}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{userTitle.titles.name}</p>
                    <p className="text-xs text-gray-600">{userTitle.titles.description}</p>
                  </div>
                </div>
                {userTitle.is_active && (
                  <span className="px-2 py-1 bg-amber-500 text-white text-xs rounded-full font-medium">
                    Actif
                  </span>
                )}
              </div>
            ))}
            {titles.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Aucun titre obtenu
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-blue-500" />
            Points des 7 derniers jours
          </h2>
          <div className="space-y-2">
            {dailyStats.length > 0 ? (
              <>
                {dailyStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{stat.date}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min((stat.points / Math.max(...dailyStats.map(s => s.points))) * 100, 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-800 w-16 text-right">
                        {stat.points} pts
                      </span>
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {dailyStats.reduce((sum, stat) => sum + stat.points, 0)} pts
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 py-8">
                Aucune partie jouée cette semaine
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Award className="w-6 h-6 mr-2 text-yellow-500" />
            {t('profile.badges')} ({badges.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {badges.map((userBadge) => (
              <div
                key={userBadge.id}
                className="flex flex-col items-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200"
              >
                <span className="text-4xl mb-2">{userBadge.badges.emoji}</span>
                <p className="text-xs font-medium text-gray-700 text-center">
                  {userBadge.badges.name}
                </p>
              </div>
            ))}
            {badges.length === 0 && (
              <p className="col-span-3 text-center text-gray-500 py-8">
                Aucun badge obtenu
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-emerald-500" />
            Dernières parties
          </h2>
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">
                      Score: {session.score} pts
                    </p>
                    <p className="text-sm text-gray-600">
                      Précision: {session.accuracy_percentage.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(session.completed_at!).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Aucune partie jouée
              </p>
            )}
          </div>
        </div>
      </div>

      {showWarnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-2 text-red-600" />
              Signaler {profile.pseudo}
            </h3>

            <p className="text-gray-600 mb-4">
              Décrivez la raison de votre signalement. Un administrateur examinera votre demande.
            </p>

            <textarea
              value={warnReason}
              onChange={(e) => setWarnReason(e.target.value)}
              placeholder="Raison du signalement..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"
            />

            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowWarnModal(false);
                  setWarnReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                disabled={sending}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSendWarning}
                disabled={!warnReason.trim() || sending}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
