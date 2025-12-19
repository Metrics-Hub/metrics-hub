import { useState } from "react";
import { Check, ChevronDown, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Project } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectSelectorProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  isLoading?: boolean;
}

export function ProjectSelector({
  projects,
  activeProject,
  onSelectProject,
  isLoading = false,
}: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-9 w-[140px]" />;
  }

  if (projects.length === 0) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 min-w-[140px] justify-between hover:border-primary/50"
        >
          <div className="flex items-center gap-2 truncate">
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: activeProject?.color || "#2563eb" }}
            />
            <span className="truncate max-w-[100px]">
              {activeProject?.name || "Selecionar projeto"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => {
              onSelectProject(project);
              setOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: project.color || "#2563eb" }}
            />
            <span className="truncate flex-1">{project.name}</span>
            {activeProject?.id === project.id && (
              <Check className="h-4 w-4 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
