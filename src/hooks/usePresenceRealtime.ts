import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAdminCheck } from '@/hooks/useAdminCheck';

export function usePresenceRealtime() {
  const { isAdmin } = useAdminCheck();
  const knownUsersRef = useRef<Map<string, { email: string; lastSeen: Date }>>(new Map());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isAdmin) return;

    // Carregar usuários online iniciais sem notificar
    const loadInitialUsers = async () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('user_presence')
        .select('*')
        .gte('last_seen_at', twoMinutesAgo);

      if (data) {
        data.forEach((record) => {
          knownUsersRef.current.set(record.user_id, {
            email: record.user_email || 'Usuário',
            lastSeen: new Date(record.last_seen_at || Date.now()),
          });
        });
      }
      initializedRef.current = true;
    };

    loadInitialUsers();

    const channel = supabase
      .channel('presence-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
        },
        (payload) => {
          if (!initializedRef.current) return;

          const newRecord = payload.new as {
            user_id: string;
            user_email: string | null;
            last_seen_at: string | null;
            is_online: boolean;
          };

          if (!newRecord?.user_id) return;

          const userId = newRecord.user_id;
          const userEmail = newRecord.user_email || 'Usuário';
          const lastSeen = new Date(newRecord.last_seen_at || Date.now());

          // Se is_online = false, notificar imediatamente e remover
          if (newRecord.is_online === false && knownUsersRef.current.has(userId)) {
            toast({
              title: '🔴 Usuário Offline',
              description: `${userEmail} desconectou`,
            });
            knownUsersRef.current.delete(userId);
            return;
          }

          // Se is_online = true, verificar se é novo ou estava offline
          if (newRecord.is_online === true) {
            const wasKnown = knownUsersRef.current.has(userId);
            const previousData = knownUsersRef.current.get(userId);

            // Usuário novo ou estava offline (>2 min)
            const wasOffline =
              previousData &&
              Date.now() - previousData.lastSeen.getTime() > 2 * 60 * 1000;

            if (!wasKnown || wasOffline) {
              toast({
                title: '🟢 Usuário Online',
                description: `${userEmail} acabou de conectar`,
              });
            }

            knownUsersRef.current.set(userId, { email: userEmail, lastSeen });
          }
        }
      )
      .subscribe();

    // Verificar periodicamente quem ficou offline
    const checkOffline = setInterval(() => {
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000;

      knownUsersRef.current.forEach((data, userId) => {
        if (data.lastSeen.getTime() < twoMinutesAgo) {
          toast({
            title: '🔴 Usuário Offline',
            description: `${data.email} desconectou`,
          });
          knownUsersRef.current.delete(userId);
        }
      });
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(checkOffline);
    };
  }, [isAdmin]);
}
