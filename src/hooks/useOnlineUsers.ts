import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnlineUser {
  id: string;
  user_id: string;
  user_email: string | null;
  last_seen_at: string;
  is_online: boolean;
}

export function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOnlineUsers = useCallback(async () => {
    try {
      // Usuário online = is_online true E ativo nos últimos 3 minutos
      const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('is_online', true)
        .gte('last_seen_at', threeMinutesAgo)
        .order('last_seen_at', { ascending: false });

      if (error) {
        console.error('Error fetching online users:', error);
        return;
      }

      setOnlineUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch online users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnlineUsers();

    // Escutar mudanças em tempo real
    const channel = supabase
      .channel('online-users-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_presence' },
        () => {
          fetchOnlineUsers();
        }
      )
      .subscribe();

    // Manter polling como fallback (menos frequente)
    const interval = setInterval(fetchOnlineUsers, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchOnlineUsers]);

  return { onlineUsers, loading, refetch: fetchOnlineUsers };
}
