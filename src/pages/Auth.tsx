import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Facebook, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useWhiteLabelContext } from "@/components/WhiteLabelProvider";

const authSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  
  const { user, signIn, loading } = useAuth();
  const navigate = useNavigate();
  const { settings } = useWhiteLabelContext();

  // Force dark mode on auth page
  useEffect(() => {
    const root = document.documentElement;
    // Read the actual theme preference from localStorage, not from current DOM state
    const savedTheme = localStorage.getItem('launx-theme') || 'light';
    const resolvedPreviousTheme = savedTheme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : savedTheme;
    
    root.classList.remove('light', 'dark');
    root.classList.add('dark');
    
    return () => {
      root.classList.remove('dark', 'light');
      root.classList.add(resolvedPreviousTheme);
    };
  }, []);

  useEffect(() => {
    if (user && !loading) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("E-mail ou senha incorretos");
      } else {
        toast.error("Erro ao fazer login. Tente novamente.");
      }
    } else {
      toast.success("Login realizado com sucesso!");
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background bg-mesh">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background bg-mesh auth-blobs overflow-hidden">
      
      <main className="flex flex-1 items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              {settings.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={settings.appName} 
                  className="h-10 w-auto" 
                />
              ) : !settings.hideLogoIcon && (
                <div className="relative">
                  <Facebook className="h-10 w-10 text-primary" />
                  <div className="absolute inset-0 blur-xl bg-primary/40" />
                </div>
              )}
              <span className="text-3xl font-bold text-foreground">{settings.appName}</span>
            </div>
            <p className="text-muted-foreground text-lg">
              {settings.appTagline}
            </p>
          </div>

          <Card variant="glass" className="shadow-2xl border-0">
            <CardHeader className="text-center pb-2">
              <h2 className="text-xl font-semibold text-foreground">Entrar</h2>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email-login" className="text-sm font-medium">E-mail</Label>
                  <Input
                    id="email-login"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-login" className="text-sm font-medium">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password-login"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
                <Button
                  type="submit" 
                  className="w-full h-11 font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
