import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadMessages: number;
  pendingDuels: number;
  pendingFriendRequests: number;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingDuels, setPendingDuels] = useState(0);
  const [pendingFriendRequests, setPendingFriendRequests] = useState(0);

  const refreshNotifications = async () => {
    if (!profile) return;

    const { count: messagesCount } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('to_user_id', profile.id)
      .eq('is_read', false);

    setUnreadMessages(messagesCount || 0);

    const { count: duelsCount } = await supabase
      .from('duels')
      .select('*', { count: 'exact', head: true })
      .eq('challenged_user_id', profile.id)
      .eq('status', 'pending');

    setPendingDuels(duelsCount || 0);

    const { count: friendRequestsCount } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('friend_id', profile.id)
      .eq('status', 'pending');

    setPendingFriendRequests(friendRequestsCount || 0);
  };

  useEffect(() => {
    if (!profile) return;

    refreshNotifications();

    const messagesSubscription = supabase
      .channel('notifications_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `to_user_id=eq.${profile.id}`,
        },
        () => {
          refreshNotifications();
        }
      )
      .subscribe();

    const duelsSubscription = supabase
      .channel('notifications_duels')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'duels',
          filter: `challenged_user_id=eq.${profile.id}`,
        },
        () => {
          refreshNotifications();
        }
      )
      .subscribe();

    const friendRequestsSubscription = supabase
      .channel('notifications_friend_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `friend_id=eq.${profile.id}`,
        },
        () => {
          refreshNotifications();
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      duelsSubscription.unsubscribe();
      friendRequestsSubscription.unsubscribe();
    };
  }, [profile]);

  return (
    <NotificationContext.Provider value={{ unreadMessages, pendingDuels, pendingFriendRequests, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
