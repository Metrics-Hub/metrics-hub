import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

interface BreadcrumbConfig {
  label: string;
  icon?: React.ReactNode;
}

const routeLabels: Record<string, BreadcrumbConfig> = {
  "/": { label: "Dashboard", icon: <Home className="h-3.5 w-3.5" /> },
  "/leads": { label: "Leads" },
  "/admin": { label: "Administração" },
};

// Admin tab labels for internal navigation
const adminTabs: Record<string, string> = {
  usuarios: "Usuários",
  configuracoes: "Configurações",
  scoring: "Lead Scoring",
  alertas: "Alertas",
  relatorios: "Relatórios",
  integracoes: "Integrações",
  whitelabel: "White Label",
  auditoria: "Auditoria",
};

interface BreadcrumbsProps {
  activeTab?: string;
}

export function Breadcrumbs({ activeTab }: BreadcrumbsProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const currentRoute = routeLabels[currentPath];

  // Don't show breadcrumbs on home
  if (currentPath === "/") return null;

  const items: { label: string; path?: string; icon?: React.ReactNode }[] = [
    { label: "Home", path: "/", icon: <Home className="h-3.5 w-3.5" /> },
  ];

  // Add current page
  if (currentRoute) {
    items.push({
      label: currentRoute.label,
      path: activeTab ? currentPath : undefined,
      icon: currentRoute.icon,
    });
  }

  // Add active tab if on admin page
  if (currentPath === "/admin" && activeTab && adminTabs[activeTab]) {
    items.push({ label: adminTabs[activeTab] });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="py-2"
    >
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => (
            <BreadcrumbItem key={index}>
              {index > 0 && (
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3.5 w-3.5" />
                </BreadcrumbSeparator>
              )}
              {item.path ? (
                <BreadcrumbLink asChild>
                  <Link 
                    to={item.path}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="flex items-center gap-1.5 font-medium">
                  {item.icon}
                  {item.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </motion.div>
  );
}
