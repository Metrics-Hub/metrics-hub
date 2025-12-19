import { WifiOff, Wifi, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface OfflineBannerProps {
  isOnline: boolean;
  wasOffline: boolean;
  onDismissReconnected: () => void;
}

export function OfflineBanner({ isOnline, wasOffline, onDismissReconnected }: OfflineBannerProps) {
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground px-4 py-3 flex items-center justify-center gap-3 shadow-lg"
        >
          <WifiOff className="h-5 w-5" />
          <span className="font-medium">
            Você está offline. Os dados em cache estão sendo exibidos.
          </span>
        </motion.div>
      )}

      {isOnline && wasOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-success text-success-foreground px-4 py-3 flex items-center justify-center gap-3 shadow-lg"
        >
          <Wifi className="h-5 w-5" />
          <span className="font-medium">
            Conexão restabelecida! Os dados serão atualizados.
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-success-foreground hover:bg-success-foreground/20"
            onClick={onDismissReconnected}
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
