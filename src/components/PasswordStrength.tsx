import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const analysis = useMemo(() => {
    const requirements: Requirement[] = [
      { label: "Mínimo 6 caracteres", met: password.length >= 6 },
      { label: "Letra maiúscula", met: /[A-Z]/.test(password) },
      { label: "Letra minúscula", met: /[a-z]/.test(password) },
      { label: "Número", met: /[0-9]/.test(password) },
      { label: "Caractere especial", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];

    const score = requirements.filter(r => r.met).length;
    
    let strength: { label: string; color: string; bgColor: string };
    if (score <= 1) {
      strength = { label: "Fraca", color: "text-destructive", bgColor: "bg-destructive" };
    } else if (score <= 2) {
      strength = { label: "Razoável", color: "text-orange-500", bgColor: "bg-orange-500" };
    } else if (score <= 3) {
      strength = { label: "Boa", color: "text-warning", bgColor: "bg-warning" };
    } else if (score <= 4) {
      strength = { label: "Forte", color: "text-success", bgColor: "bg-success" };
    } else {
      strength = { label: "Muito forte", color: "text-success", bgColor: "bg-success" };
    }

    return { requirements, score, strength, percentage: (score / 5) * 100 };
  }, [password]);

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("space-y-3", className)}
    >
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Força da senha</span>
          <span className={cn("font-medium", analysis.strength.color)}>
            {analysis.strength.label}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${analysis.percentage}%` }}
            transition={{ duration: 0.3 }}
            className={cn("h-full rounded-full transition-all", analysis.strength.bgColor)}
          />
        </div>
      </div>

      {/* Requirements */}
      <div className="grid grid-cols-2 gap-1.5 text-xs">
        {analysis.requirements.map((req, index) => (
          <motion.div
            key={req.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className={cn(
              "flex items-center gap-1.5",
              req.met ? "text-success" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            <span>{req.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
