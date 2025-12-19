import { motion } from "framer-motion";
import { LucideIcon, FileQuestion, Database, Search, AlertCircle, Users, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  type?: "no-data" | "no-results" | "error" | "no-users" | "no-charts";
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

const defaultConfig = {
  "no-data": {
    icon: Database,
    title: "Nenhum dado encontrado",
    description: "Ainda não há dados disponíveis para exibição.",
  },
  "no-results": {
    icon: Search,
    title: "Nenhum resultado",
    description: "Não encontramos resultados para sua busca. Tente ajustar os filtros.",
  },
  "error": {
    icon: AlertCircle,
    title: "Erro ao carregar",
    description: "Ocorreu um erro ao carregar os dados. Tente novamente.",
  },
  "no-users": {
    icon: Users,
    title: "Nenhum usuário",
    description: "Não há usuários cadastrados no sistema.",
  },
  "no-charts": {
    icon: BarChart3,
    title: "Sem dados para gráficos",
    description: "Não há dados suficientes para exibir os gráficos.",
  },
};

export function EmptyState({
  type = "no-data",
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  const config = defaultConfig[type];
  const Icon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {/* Illustrated Icon Container */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative mb-6"
      >
        {/* Background decorative circles */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-24 rounded-full bg-primary/5 animate-pulse" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-primary/10" />
        </div>
        
        {/* Main icon */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
          <Icon className="h-10 w-10 text-primary/70" strokeWidth={1.5} />
        </div>
        
        {/* Decorative dots */}
        <motion.div
          animate={{ 
            y: [0, -4, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary/40"
        />
        <motion.div
          animate={{ 
            y: [0, 4, 0],
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute -bottom-2 -left-2 h-2 w-2 rounded-full bg-primary/30"
        />
      </motion.div>

      {/* Text content */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-foreground mb-2"
      >
        {displayTitle}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground max-w-sm"
      >
        {displayDescription}
      </motion.p>

      {/* Optional action */}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}
