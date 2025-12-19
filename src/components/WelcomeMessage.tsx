import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Sunrise, Sunset, Zap, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface WelcomeMessageProps {
  className?: string;
  leadsToday?: number;
  alertsCount?: number;
}

export function WelcomeMessage({ className, leadsToday, alertsCount }: WelcomeMessageProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const { greeting, Icon } = useMemo(() => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return { greeting: "Bom dia", Icon: Sunrise };
    } else if (hour >= 12 && hour < 18) {
      return { greeting: "Boa tarde", Icon: Sun };
    } else if (hour >= 18 && hour < 21) {
      return { greeting: "Boa noite", Icon: Sunset };
    } else {
      return { greeting: "Boa noite", Icon: Moon };
    }
  }, []);

  const userName = useMemo(() => {
    if (!user?.email) return "";
    const namePart = user.email.split("@")[0];
    // Capitalize first letter
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  }, [user?.email]);

  if (!userName) return null;

  // Compact version for mobile
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn("flex items-center gap-2", className)}
      >
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {greeting}, {userName}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("flex items-center gap-4", className)}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <span className="text-lg font-medium text-foreground">
          {greeting}, <span className="text-primary">{userName}</span>!
        </span>
      </div>

      {(leadsToday !== undefined || alertsCount !== undefined) && (
        <div className="flex items-center gap-2">
          {leadsToday !== undefined && leadsToday > 0 && (
            <Badge variant="secondary" className="gap-1 bg-success/10 text-success border-success/20">
              <Zap className="h-3 w-3" />
              {leadsToday} leads hoje
            </Badge>
          )}
          {alertsCount !== undefined && alertsCount > 0 && (
            <Badge variant="secondary" className="gap-1 bg-warning/10 text-warning border-warning/20">
              <AlertTriangle className="h-3 w-3" />
              {alertsCount} alertas
            </Badge>
          )}
        </div>
      )}
    </motion.div>
  );
}
