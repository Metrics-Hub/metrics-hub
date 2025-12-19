import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { useNotifications } from '@/hooks/useNotifications';

export function InstallPWAPrompt() {
  const { canShowPrompt, install, dismiss } = usePWA();
  const { isSupported, isGranted, requestPermission } = useNotifications();

  const handleInstall = async () => {
    const installed = await install();
    if (installed && isSupported && !isGranted) {
      // Request notification permission after install
      await requestPermission();
    }
  };

  if (!canShowPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <div className="glass-card rounded-xl p-4 shadow-xl border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">Instalar Launx Metrics</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Adicione à sua tela inicial para acesso rápido e experiência fullscreen.
              </p>
              
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Instalar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={dismiss}
                >
                  Agora não
                </Button>
              </div>
            </div>

            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              onClick={dismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
