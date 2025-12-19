import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUserPresence() {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;

    const updatePresence = async () => {
      try {
        const { error } = await supabase
          .from('user_presence')
          .upsert({
            user_id: user.id,
            user_email: user.email,
            last_seen_at: new Date().toISOString(),
            is_online: true
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          console.error('Error updating presence:', error);
        }
      } catch (err) {
        console.error('Failed to update presence:', err);
      }
    };

    // Marcar offline quando fechar aba/janela (mais confiável que cleanup do React)
    const handleBeforeUnload = () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_presence?user_id=eq.${user.id}`;
      
      // Usar fetch com keepalive para garantir que o request complete mesmo fechando a aba
      // (sendBeacon não suporta headers customizados)
      fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ 
          is_online: false, 
          last_seen_at: new Date().toISOString() 
        }),
        keepalive: true
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Update immediately on mount
    updatePresence();

    // Update every 30 seconds
    intervalRef.current = setInterval(updatePresence, 30000);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Mark offline (fire and forget) - fallback para navegação SPA
      supabase
        .from('user_presence')
        .update({ is_online: false, last_seen_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .then(() => {});
    };
  }, [user]);
}
