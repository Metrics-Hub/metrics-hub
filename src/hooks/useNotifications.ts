import { useState, useEffect, useCallback } from 'react';

type NotificationPermission = 'default' | 'granted' | 'denied';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  onClick?: () => void;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback(
    ({ title, body, icon = '/icons/icon-192x192.png', tag, requireInteraction = false, onClick }: NotificationOptions) => {
      if (!isSupported || permission !== 'granted') {
        console.log('Notifications not available or not permitted');
        return null;
      }

      try {
        const notification = new Notification(title, {
          body,
          icon,
          tag,
          requireInteraction,
          badge: '/icons/icon-72x72.png',
        });

        if (onClick) {
          notification.onclick = () => {
            onClick();
            notification.close();
            window.focus();
          };
        }

        return notification;
      } catch (error) {
        console.error('Error showing notification:', error);
        return null;
      }
    },
    [isSupported, permission]
  );

  // Notification helpers for specific alerts
  const notifyCPLAlert = useCallback(
    (currentCPL: number, maxCPL: number) => {
      showNotification({
        title: '⚠️ Alerta de CPL',
        body: `CPL atual (R$ ${currentCPL.toFixed(2)}) está acima do limite (R$ ${maxCPL.toFixed(2)})`,
        tag: 'cpl-alert',
        requireInteraction: true,
        onClick: () => {
          window.location.href = '/';
        },
      });
    },
    [showNotification]
  );

  const notifyLeadGoalAlert = useCallback(
    (current: number, goal: number, daysRemaining: number) => {
      const percentage = ((current / goal) * 100).toFixed(1);
      showNotification({
        title: '📊 Meta de Leads em Risco',
        body: `${percentage}% da meta alcançada. Faltam ${goal - current} leads em ${daysRemaining} dias.`,
        tag: 'lead-goal-alert',
        requireInteraction: true,
        onClick: () => {
          window.location.href = '/';
        },
      });
    },
    [showNotification]
  );

  const notifyBudgetAlert = useCallback(
    (currentSpend: number, budget: number) => {
      const percentage = ((currentSpend / budget) * 100).toFixed(1);
      showNotification({
        title: '💰 Alerta de Orçamento',
        body: `${percentage}% do orçamento utilizado (R$ ${currentSpend.toFixed(2)} de R$ ${budget.toFixed(2)})`,
        tag: 'budget-alert',
        requireInteraction: true,
        onClick: () => {
          window.location.href = '/';
        },
      });
    },
    [showNotification]
  );

  const notifySuccess = useCallback(
    (message: string) => {
      showNotification({
        title: '✅ Sucesso',
        body: message,
        tag: 'success',
      });
    },
    [showNotification]
  );

  return {
    isSupported,
    permission,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    requestPermission,
    showNotification,
    notifyCPLAlert,
    notifyLeadGoalAlert,
    notifyBudgetAlert,
    notifySuccess,
  };
}
