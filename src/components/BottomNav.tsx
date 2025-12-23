import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Shield, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { VersionFooter } from "@/components/VersionFooter";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { path: "/", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { path: "/leads", label: "Leads", icon: <Users className="h-5 w-5" /> },
  { path: "/admin", label: "Admin", icon: <Shield className="h-5 w-5" />, adminOnly: true },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAdminCheck();

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-lg border-t border-border/50 shadow-lg safe-area-bottom"
    >
      <div className="flex items-center justify-around h-14 px-2">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full px-2 transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg",
                "min-w-[56px] active:scale-95",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="relative"
              >
                {item.icon}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.div>
              <span className={cn(
                "text-[10px] font-medium transition-all",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full px-2 transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg",
                "text-muted-foreground hover:text-foreground min-w-[56px] active:scale-95"
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium">Mais</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="w-48 mb-2 bg-popover border-border"
          >
            <DropdownMenuItem className="flex items-center justify-between py-3">
              <span>Tema</span>
              <ThemeToggle />
            </DropdownMenuItem>
            <div className="px-2 py-2 border-t border-border">
              <VersionFooter variant="badge" className="w-full justify-center" />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.nav>
  );
}
