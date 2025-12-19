import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role: "admin" | "moderator" | "user";
  is_active?: boolean;
  last_login?: string;
}

interface LoginHistoryEntry {
  id: string;
  login_at: string;
  user_agent: string | null;
  ip_address: string | null;
  success: boolean;
}

export function useAdminUsers() {
  const { session, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchUsers = async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.functions.invoke(
        "get-users-with-roles",
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setUsers(data.users || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar usuários";
      setError(message);
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const createAuditLog = async (
    action: string,
    entityType: string,
    entityId: string,
    oldValue?: unknown,
    newValue?: unknown
  ) => {
    try {
      await supabase.functions.invoke("create-audit-log", {
        body: {
          userId: currentUser?.id,
          action,
          entityType,
          entityId,
          oldValue,
          newValue,
          userAgent: navigator.userAgent,
        },
      });
    } catch (error) {
      console.error("Error creating audit log:", error);
    }
  };

  const updateUserRole = async (userId: string, newRole: "admin" | "moderator" | "user") => {
    const targetUser = users.find((u) => u.id === userId);
    const oldRole = targetUser?.role;

    try {
      const { error: upsertError } = await supabase
        .from("user_roles")
        .upsert(
          { user_id: userId, role: newRole } as any,
          { onConflict: "user_id" }
        );

      if (upsertError) {
        throw upsertError;
      }

      // Create audit log
      await createAuditLog(
        "UPDATE_ROLE",
        "user",
        userId,
        { role: oldRole, email: targetUser?.email },
        { role: newRole, email: targetUser?.email }
      );

      await fetchUsers();
      toast.success("Role atualizado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar role";
      toast.error(message);
      console.error("Error updating role:", err);
    }
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    const targetUser = users.find((u) => u.id === userId);

    try {
      const { error: updateError } = await supabase
        .from("user_roles")
        .update({ is_active: isActive } as any)
        .eq("user_id", userId);

      if (updateError) {
        throw updateError;
      }

      // Create audit log
      await createAuditLog(
        isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
        "user",
        userId,
        { is_active: !isActive, email: targetUser?.email },
        { is_active: isActive, email: targetUser?.email }
      );

      await fetchUsers();
      toast.success(isActive ? "Usuário ativado" : "Usuário desativado");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar status";
      toast.error(message);
      console.error("Error toggling user active:", err);
    }
  };

  const inviteUser = async (email: string, role: "admin" | "moderator" | "user" = "user") => {
    if (!session) {
      toast.error("Sessão expirada");
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email, role },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Create audit log
      await createAuditLog(
        "INVITE_USER",
        "user",
        data.user?.id || email,
        null,
        { email, role }
      );

      toast.success(`Convite enviado para ${email}`);
      await fetchUsers();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao convidar usuário";
      toast.error(message);
      console.error("Error inviting user:", err);
      return false;
    }
  };

  const createUser = async (
    email: string,
    password: string,
    role: "admin" | "moderator" | "user" = "user"
  ) => {
    if (!session) {
      toast.error("Sessão expirada");
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: { email, password, role },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Create audit log
      await createAuditLog(
        "CREATE_USER",
        "user",
        data.user?.id || email,
        null,
        { email, role }
      );

      toast.success(`Usuário ${email} criado com sucesso`);
      await fetchUsers();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar usuário";
      toast.error(message);
      console.error("Error creating user:", err);
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    if (!session) {
      toast.error("Sessão expirada");
      return false;
    }

    const targetUser = users.find((u) => u.id === userId);

    try {
      // Create audit log BEFORE deletion
      await createAuditLog(
        "DELETE_USER",
        "user",
        userId,
        { email: targetUser?.email, role: targetUser?.role },
        null
      );

      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(`Usuário ${data.deletedEmail || targetUser?.email} removido`);
      await fetchUsers();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao remover usuário";
      toast.error(message);
      console.error("Error deleting user:", err);
      return false;
    }
  };

  const getUserLoginHistory = async (userId: string): Promise<LoginHistoryEntry[]> => {
    if (!session) return [];

    try {
      const { data, error } = await supabase
        .from("login_history")
        .select("id, login_at, user_agent, ip_address, success")
        .eq("user_id", userId)
        .order("login_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching login history:", error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error("Error fetching login history:", err);
      return [];
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search filter
      if (searchQuery && !u.email.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Role filter
      if (roleFilter !== "all" && u.role !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === "active" && u.is_active === false) {
        return false;
      }
      if (statusFilter === "inactive" && u.is_active !== false) {
        return false;
      }

      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // User statistics
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.is_active !== false).length,
      admins: users.filter((u) => u.role === "admin").length,
      moderators: users.filter((u) => u.role === "moderator").length,
    };
  }, [users]);

  useEffect(() => {
    fetchUsers();
  }, [session]);

  return {
    users: filteredUsers,
    allUsers: users,
    loading,
    error,
    stats,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    refetch: fetchUsers,
    updateUserRole,
    toggleUserActive,
    inviteUser,
    createUser,
    deleteUser,
    getUserLoginHistory,
  };
}
