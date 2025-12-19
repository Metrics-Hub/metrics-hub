import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, UserCheck, Shield, UserCog, LogIn, Clock } from 'lucide-react';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { useUserStats } from '@/hooks/useUserStats';
import { usePresenceRealtime } from '@/hooks/usePresenceRealtime';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { motion } from 'framer-motion';

const getAvatarUrl = (email: string) => {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(email)}`;
};

export function UserStatsPanel() {
  const { onlineUsers, loading: loadingOnline } = useOnlineUsers();
  const { stats, loading: loadingStats } = useUserStats();
  
  // Habilitar notificações em tempo real para admins
  usePresenceRealtime();

  const statCards = [
    { label: 'Total Usuários', value: stats.totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Online Agora', value: onlineUsers.length, icon: UserCheck, color: 'text-success', badge: true },
    { label: 'Ativos', value: stats.activeUsers, icon: UserCog, color: 'text-muted-foreground' },
    { label: 'Admins', value: stats.adminCount, icon: Shield, color: 'text-warning' },
  ];

  const loginStats = [
    { label: 'Logins hoje', value: stats.loginsToday },
    { label: 'Logins esta semana', value: stats.loginsThisWeek },
    { label: 'Logins este mês', value: stats.loginsThisMonth },
    { label: 'Novos usuários (30 dias)', value: stats.newUsersLast30Days },
  ];

  if (loadingStats && loadingOnline) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards with Animated Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.badge && stat.value > 0 && (
                        <span className="inline-block w-2 h-2 rounded-full bg-success mr-2 animate-pulse" />
                      )}
                      <AnimatedCounter 
                        value={stat.value} 
                        delay={index * 100}
                        duration={800}
                      />
                    </p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-20 group-hover:opacity-40 transition-opacity`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Online Users */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Usuários Online Agora
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOnline ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : onlineUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum usuário online no momento
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {onlineUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="relative">
                              <Avatar className="h-8 w-8">
                                <AvatarImage 
                                  src={getAvatarUrl(user.user_email || 'user')} 
                                  alt={user.user_email || 'User'} 
                                />
                                <AvatarFallback>
                                  {user.user_email?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-background" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-medium">{user.user_email}</p>
                            <p className="text-muted-foreground">
                              Visto há {formatDistanceToNow(new Date(user.last_seen_at), {
                                addSuffix: false,
                                locale: ptBR,
                              })}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-sm truncate max-w-[150px]">
                        {user.user_email || 'Usuário'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(user.last_seen_at), {
                        addSuffix: false,
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Login Statistics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Estatísticas de Acesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loginStats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <span className="text-sm">{stat.label}</span>
                  <Badge variant="secondary" className="font-mono">
                    {stat.value}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
