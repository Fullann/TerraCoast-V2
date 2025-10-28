import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Share2, X } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface ShareQuizModalProps {
  quizId: string;
  quizTitle: string;
  onClose: () => void;
}

export function ShareQuizModal({ quizId, quizTitle, onClose }: ShareQuizModalProps) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [friends, setFriends] = useState<Profile[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    if (!profile) return;

    // Charger les amitiés où l'utilisateur est l'expéditeur
    const { data: friendshipsAsSender } = await supabase
      .from('friendships')
      .select('friend_profile:profiles!friendships_friend_id_fkey(*)')
      .eq('user_id', profile.id)
      .eq('status', 'accepted')
      .eq('friend_profile.is_banned', false); // Filtrer les utilisateurs bannis

    // Charger les amitiés où l'utilisateur est le destinataire
    const { data: friendshipsAsReceiver } = await supabase
      .from('friendships')
      .select('user_profile:profiles!friendships_user_id_fkey(*)')
      .eq('friend_id', profile.id)
      .eq('status', 'accepted')
      .eq('user_profile.is_banned', false); // Filtrer les utilisateurs bannis

    // Combiner et filtrer les amis
    const allFriends: Profile[] = [
      ...(friendshipsAsSender?.map((f: any) => f.friend_profile).filter(Boolean) || []),
      ...(friendshipsAsReceiver?.map((f: any) => f.user_profile).filter(Boolean) || []),
    ];

    setFriends(allFriends);
  };

  const toggleFriend = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const shareQuiz = async () => {
    if (!profile || selectedFriends.length === 0) return;

    setLoading(true);

    try {
      const shares = selectedFriends.map(friendId => ({
        quiz_id: quizId,
        shared_by_user_id: profile.id,
        shared_with_user_id: friendId,
      }));

      await supabase.from('quiz_shares').insert(shares);
      setSuccess(true);

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error sharing quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Share2 className="w-6 h-6 mr-2 text-emerald-600" />
            {t('share.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t('share.success')}</h3>
            <p className="text-gray-600">{t('share.successMessage')}</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              {t('share.shareWith').replace('{title}', quizTitle)}
            </p>

            {friends.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('friends.noFriends')}</p>
              </div>
            ) : (
              <>
                <div className="max-h-64 overflow-y-auto mb-6 space-y-2">
                  {friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => toggleFriend(friend.id)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        selectedFriends.includes(friend.id)
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">{friend.pseudo}</p>
                          <p className="text-sm text-gray-600">{t('profile.level')} {friend.level}</p>
                        </div>
                        {selectedFriends.includes(friend.id) && (
                          <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={shareQuiz}
                    disabled={selectedFriends.length === 0 || loading}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t('share.sharing') : `${t('quiz.share')} (${selectedFriends.length})`}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
