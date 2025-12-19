import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

const STORAGE_KEY = "launx_active_project_id";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const selectProject = useCallback((project: Project | null) => {
    setActiveProject(project);
    if (project) {
      localStorage.setItem(STORAGE_KEY, project.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setProjects(data || []);
      
      // Restore from localStorage or use first project
      if (!activeProject && data && data.length > 0) {
        const savedId = localStorage.getItem(STORAGE_KEY);
        const savedProject = savedId ? data.find(p => p.id === savedId) : null;
        setActiveProject(savedProject || data[0]);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      toast.error("Erro ao carregar projetos");
    } finally {
      setIsLoading(false);
    }
  }, [activeProject]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (name: string, description?: string, color?: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("projects")
        .insert({
          name,
          description: description || null,
          color: color || "#2563eb",
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Projeto criado com sucesso!");
      await fetchProjects();
      return data;
    } catch (err) {
      console.error("Error creating project:", err);
      toast.error("Erro ao criar projeto");
      throw err;
    }
  };

  const updateProject = async (id: string, updates: Partial<Pick<Project, "name" | "description" | "color" | "is_active">>) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Projeto atualizado!");
      await fetchProjects();
    } catch (err) {
      console.error("Error updating project:", err);
      toast.error("Erro ao atualizar projeto");
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Projeto excluído!");
      
      if (activeProject?.id === id) {
        setActiveProject(null);
      }
      
      await fetchProjects();
    } catch (err) {
      console.error("Error deleting project:", err);
      toast.error("Erro ao excluir projeto");
      throw err;
    }
  };

  return {
    projects,
    isLoading,
    activeProject,
    setActiveProject: selectProject,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
}
