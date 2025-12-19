import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, startOfWeek, startOfMonth, subDays } from 'date-fns';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  adminCount: number;
  moderatorCount: number;
  userCount: number;
  loginsToday: number;
  loginsThisWeek: number;
  loginsThisMonth: number;
  newUsersLast30Days: number;
}

export function useUserStats() {
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    adminCount: 0,
    moderatorCount: 0,
    userCount: 0,
    loginsToday: 0,
    loginsThisWeek: 0,
    loginsThisMonth: 0,
    newUsersLast30Days: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 0 }).toISOString();
      const monthStart = startOfMonth(now).toISOString();
      const thirtyDaysAgo = subDays(now, 30).toISOString();

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, is_active');

      if (rolesError) {
        setLoading(false);
        return;
      }

      const totalUsers = rolesData?.length || 0;
      const activeUsers = rolesData?.filter(r => r.is_active).length || 0;
      const adminCount = rolesData?.filter(r => r.role === 'admin').length || 0;
      const moderatorCount = rolesData?.filter(r => r.role === 'moderator').length || 0;
      const userCount = rolesData?.filter(r => r.role === 'user').length || 0;

      const [todayLogins, weekLogins, monthLogins] = await Promise.all([
        supabase
          .from('login_history')
          .select('id', { count: 'exact', head: true })
          .gte('login_at', todayStart)
          .eq('success', true),
        supabase
          .from('login_history')
          .select('id', { count: 'exact', head: true })
          .gte('login_at', weekStart)
          .eq('success', true),
        supabase
          .from('login_history')
          .select('id', { count: 'exact', head: true })
          .gte('login_at', monthStart)
          .eq('success', true),
      ]);

      const { count: newUsersCount } = await supabase
        .from('user_roles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo);

      setStats({
        totalUsers,
        activeUsers,
        adminCount,
        moderatorCount,
        userCount,
        loginsToday: todayLogins.count || 0,
        loginsThisWeek: weekLogins.count || 0,
        loginsThisMonth: monthLogins.count || 0,
        newUsersLast30Days: newUsersCount || 0,
      });
    } catch (err) {
      console.error('Error fetching user stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
