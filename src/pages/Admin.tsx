import { Navigate, useNavigate } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2, Shield, Users, Settings, Target, Bell, FileText, Link2, Palette, ClipboardList, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { NavLink } from "@/components/NavLink";
import { UsersTab, SettingsTab, IntegrationsTab, AuditLogsTab, LeadScoringTab, AlertsTab, ReportsTab, WhiteLabelTab, SyncConfigTab } from "@/components/admin";

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { projects, activeProject, setActiveProject, isLoading: projectsLoading } = useProjects();
  const { 
    users, 
    loading: usersLoading, 
    error, 
    stats,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    refetch, 
    updateUserRole, 
    toggleUserActive,
    inviteUser,
    createUser,
    deleteUser,
    getUserLoginHistory,
  } = useAdminUsers();
  const { 
    settings, 
    loading: settingsLoading, 
    updateLeadGoal,
    updatePeriodGoals,
    updateProgressAlerts,
    updateAppPreferences
  } = useAppSettings(activeProject?.id);

  if (adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background bg-mesh">
      {/* Header */}
      <header className="glass-header sticky top-0 z-50 px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/")}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Admin</h1>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              <NavLink to="/">Dashboard</NavLink>
              <NavLink to="/leads">Leads</NavLink>
              <NavLink to="/admin">Admin</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9 lg:w-auto lg:inline-grid">
              <TabsTrigger value="users" className="gap-1.5">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Usuários</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Config</span>
              </TabsTrigger>
              <TabsTrigger value="scoring" className="gap-1.5">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Scoring</span>
              </TabsTrigger>
              <TabsTrigger value="alerts" className="gap-1.5">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Alertas</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-1.5">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Relatórios</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="gap-1.5">
                <Link2 className="h-4 w-4" />
                <span className="hidden sm:inline">Integrações</span>
              </TabsTrigger>
              <TabsTrigger value="sync" className="gap-1.5">
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Sync</span>
              </TabsTrigger>
              <TabsTrigger value="whitelabel" className="gap-1.5">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">White Label</span>
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-1.5">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Logs</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <UsersTab
                users={users}
                loading={usersLoading}
                error={error}
                currentUserId={user?.id}
                stats={stats}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                roleFilter={roleFilter}
                setRoleFilter={setRoleFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                onRefetch={refetch}
                onUpdateRole={updateUserRole}
                onToggleActive={toggleUserActive}
                onInviteUser={inviteUser}
                onCreateUser={createUser}
                onDeleteUser={deleteUser}
                onGetLoginHistory={getUserLoginHistory}
              />
            </TabsContent>

            <TabsContent value="settings">
              <SettingsTab
                settings={settings}
                loading={settingsLoading || projectsLoading}
                projects={projects}
                activeProject={activeProject}
                onSelectProject={setActiveProject}
                onUpdateLeadGoal={updateLeadGoal}
                onUpdatePeriodGoals={updatePeriodGoals}
                onUpdateProgressAlerts={updateProgressAlerts}
                onUpdateAppPreferences={updateAppPreferences}
              />
            </TabsContent>

            <TabsContent value="scoring">
              <LeadScoringTab />
            </TabsContent>

            <TabsContent value="alerts">
              <AlertsTab />
            </TabsContent>

            <TabsContent value="reports">
              <ReportsTab />
            </TabsContent>

            <TabsContent value="integrations">
              <IntegrationsTab />
            </TabsContent>

            <TabsContent value="sync">
              <SyncConfigTab />
            </TabsContent>

            <TabsContent value="whitelabel">
              <WhiteLabelTab />
            </TabsContent>

            <TabsContent value="logs">
              <AuditLogsTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
