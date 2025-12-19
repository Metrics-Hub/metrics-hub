import { lazy, Suspense, ComponentType } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WhiteLabelProvider } from "@/components/WhiteLabelProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InstallPWAPrompt } from "@/components/InstallPWAPrompt";
import { NotificationPermissionBanner } from "@/components/NotificationPermissionBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useUserPresence } from "@/hooks/useUserPresence";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/BottomNav";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SkipToContent } from "@/components/SkipToContent";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";

// Helper function to retry lazy imports with automatic reload on failure
const lazyWithRetry = <T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error('Failed to load module, reloading page...', error);
      window.location.reload();
      return { default: (() => null) as unknown as T };
    }
  });

// Lazy load pages with retry for better resilience
const Index = lazyWithRetry(() => import("./pages/Index"));
const Leads = lazyWithRetry(() => import("./pages/Leads"));
const Admin = lazyWithRetry(() => import("./pages/Admin"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Page loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="space-y-4 w-full max-w-md p-8">
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

const AppContent = () => {
  const { isOnline, wasOffline, dismissReconnected } = useOnlineStatus();
  
  // Track user presence for online status
  useUserPresence();

  return (
    <>
      {/* Skip to Content - Accessibility */}
      <SkipToContent />

      {/* Offline Banner */}
      <OfflineBanner
        isOnline={isOnline}
        wasOffline={wasOffline}
        onDismissReconnected={dismissReconnected}
      />

      {/* Background Mesh */}
      <div className="fixed inset-0 bg-mesh pointer-events-none" />
      
      {/* Decorative Blobs */}
      <div className="blob blob-primary w-[500px] h-[500px] -top-48 -right-48 opacity-30" />
      <div className="blob blob-accent w-[400px] h-[400px] top-1/3 -left-48 opacity-20" />
      <div className="blob blob-success w-[350px] h-[350px] bottom-0 right-1/4 opacity-20" />
      
      {/* PWA Components */}
      <InstallPWAPrompt />
      <NotificationPermissionBanner />
      
      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp />
      
      <div id="main-content" className="relative z-10 pb-16 md:pb-0">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads"
              element={
                <ProtectedRoute>
                  <Leads />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
      
      {/* Scroll to Top Button */}
      <ScrollToTop />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="launx-theme">
      <WhiteLabelProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </WhiteLabelProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
