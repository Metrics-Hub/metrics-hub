import { LayoutDashboard, FileSpreadsheet, Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { cn } from "@/lib/utils";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { ProjectSelector } from "@/components/ProjectSelector";
import { Project } from "@/hooks/useProjects";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { DataSources } from "@/components/DataSourceSelector";
import { useWhiteLabelContext } from "@/components/WhiteLabelProvider";
import { DashboardSectionToggles, SectionVisibility } from "@/components/DashboardSectionToggles";
import { VersionFooter } from "@/components/VersionFooter";

interface DashboardHeaderProps {
  projects?: Project[];
  activeProject?: Project | null;
  onSelectProject?: (project: Project) => void;
  projectsLoading?: boolean;
  dataSources?: DataSources;
  hasMetaAds?: boolean;
  hasGoogleAds?: boolean;
  sectionVisibility?: SectionVisibility;
  onSectionVisibilityChange?: (visibility: SectionVisibility) => void;
}

export function DashboardHeader({
  projects = [],
  activeProject = null,
  onSelectProject,
  projectsLoading = false,
  dataSources,
  hasMetaAds = false,
  hasGoogleAds = false,
  sectionVisibility,
  onSectionVisibilityChange,
}: DashboardHeaderProps) {
  const location = useLocation();
  const { isAdmin } = useAdminCheck();
  const { settings: whiteLabelSettings } = useWhiteLabelContext();
  const isMetaAds = location.pathname === "/" || location.pathname === "/meta-ads";
  const isLeads = location.pathname === "/leads";
  const isAdminPage = location.pathname === "/admin";

  return (
    <header className="sticky top-0 z-50 w-full glass-header">
      <div className="w-full flex h-14 md:h-16 items-center justify-between px-4">
        {/* Logo and Navigation */}
        <div className="flex items-center gap-2 md:gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            {whiteLabelSettings.logoUrl ? (
              <>
                <img
                  src={whiteLabelSettings.logoUrl}
                  alt={whiteLabelSettings.appName}
                  className="h-7 md:h-8 max-w-24 md:max-w-32 object-contain transition-transform group-hover:scale-105"
                />
                {!whiteLabelSettings.hideLogoIcon && (
                  <div className="relative hidden sm:block">
                    {isMetaAds ? (
                      <LayoutDashboard className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                    ) : (
                      <FileSpreadsheet className="h-5 w-5 text-success transition-transform group-hover:scale-110" />
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="relative">
                {isMetaAds ? (
                  <LayoutDashboard className="h-6 w-6 md:h-7 md:w-7 text-primary transition-transform group-hover:scale-110" />
                ) : (
                  <FileSpreadsheet className="h-6 w-6 md:h-7 md:w-7 text-success transition-transform group-hover:scale-110" />
                )}
                <div className="absolute inset-0 blur-lg bg-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
            <span className="text-lg md:text-xl font-bold hidden sm:inline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {whiteLabelSettings.appName}
            </span>
          </Link>

          {/* Data Source Badge - Hidden on mobile */}
          {dataSources && dataSources.length > 0 && (hasMetaAds || hasGoogleAds) && (
            <div className="hidden md:block">
              <DataSourceBadge
                dataSources={dataSources}
                hasMetaAds={hasMetaAds}
                hasGoogleAds={hasGoogleAds}
              />
            </div>
          )}

          {/* Project Selector - Hidden on mobile */}
          {onSelectProject && (
            <div className="hidden md:block">
              <ProjectSelector
                projects={projects}
                activeProject={activeProject}
                onSelectProject={onSelectProject}
                isLoading={projectsLoading}
              />
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/">
              <Button
                variant={isMetaAds ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "gap-2 transition-all",
                  isMetaAds && "shadow-sm"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link to="/leads">
              <Button
                variant={isLeads ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "gap-2 transition-all",
                  isLeads && "shadow-sm"
                )}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Leads
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/admin">
                <Button
                  variant={isAdminPage ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2 transition-all",
                    isAdminPage && "shadow-sm"
                  )}
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              </Link>
            )}
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Section Toggles - Admin only, Dashboard only */}
          {isAdmin && isMetaAds && sectionVisibility && onSectionVisibilityChange && (
            <DashboardSectionToggles
              visibility={sectionVisibility}
              onVisibilityChange={onSectionVisibilityChange}
            />
          )}
          <div className="hidden sm:block h-6 w-px bg-border/50" />
          <VersionFooter className="hidden md:flex" />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
