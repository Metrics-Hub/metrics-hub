import { useState } from "react";
import { Loader2, Users, RefreshCw, UserPlus, Trash2, Search, History, Mail, KeyRound, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserStatsPanel } from "./UserStatsPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface User {
  id: string;
  email: string;
  created_at: string;
  role: "admin" | "moderator" | "user";
  is_active?: boolean;
}

interface LoginHistoryEntry {
  id: string;
  login_at: string;
  user_agent: string | null;
  ip_address: string | null;
  success: boolean;
}

interface Stats {
  total: number;
  active: number;
  admins: number;
  moderators: number;
}

interface UsersTabProps {
  users: User[];
  loading: boolean;
  error: string | null;
  currentUserId: string | undefined;
  stats: Stats;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  onRefetch: () => void;
  onUpdateRole: (userId: string, role: "admin" | "moderator" | "user") => void;
  onToggleActive: (userId: string, isActive: boolean) => void;
  onInviteUser: (email: string, role: "admin" | "moderator" | "user") => Promise<boolean>;
  onCreateUser: (email: string, password: string, role: "admin" | "moderator" | "user") => Promise<boolean>;
  onDeleteUser: (userId: string) => Promise<boolean>;
  onGetLoginHistory: (userId: string) => Promise<LoginHistoryEntry[]>;
}

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "admin":
      return "destructive";
    case "moderator":
      return "default";
    default:
      return "secondary";
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case "admin":
      return "Administrador";
    case "moderator":
      return "Moderador";
    default:
      return "Usuário";
  }
};

export function UsersTab({
  users,
  loading,
  error,
  currentUserId,
  stats,
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  onRefetch,
  onUpdateRole,
  onToggleActive,
  onInviteUser,
  onCreateUser,
  onDeleteUser,
  onGetLoginHistory,
}: UsersTabProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "moderator" | "user">("user");
  const [inviteLoading, setInviteLoading] = useState(false);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createConfirmPassword, setCreateConfirmPassword] = useState("");
  const [createRole, setCreateRole] = useState<"admin" | "moderator" | "user">("user");
  const [createLoading, setCreateLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyUser, setHistoryUser] = useState<User | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    const success = await onInviteUser(inviteEmail.trim(), inviteRole);
    setInviteLoading(false);
    if (success) {
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("user");
    }
  };

  const handleCreate = async () => {
    if (!createEmail.trim() || !createPassword) return;
    if (createPassword !== createConfirmPassword) {
      return;
    }
    if (createPassword.length < 6) {
      return;
    }
    setCreateLoading(true);
    const success = await onCreateUser(createEmail.trim(), createPassword, createRole);
    setCreateLoading(false);
    if (success) {
      setCreateDialogOpen(false);
      setCreateEmail("");
      setCreatePassword("");
      setCreateConfirmPassword("");
      setCreateRole("user");
      setShowPassword(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    await onDeleteUser(userToDelete.id);
    setDeleteLoading(false);
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleViewHistory = async (user: User) => {
    setHistoryUser(user);
    setHistoryDialogOpen(true);
    setHistoryLoading(true);
    const history = await onGetLoginHistory(user.id);
    setLoginHistory(history);
    setHistoryLoading(false);
  };

  const openDeleteConfirm = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Panel - Admin Only */}
      <UserStatsPanel />

      <Card variant="glass">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>
                  {stats.total} usuários • {stats.active} ativos • {stats.admins} admins • {stats.moderators} moderadores
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefetch}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInviteDialogOpen(true)}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Convidar
              </Button>
              <Button
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Criar
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os roles</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="moderator">Moderador</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={onRefetch} variant="outline">
                Tentar novamente
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className="table-row-interactive">
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell>
                        {format(new Date(u.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(u.role)}>
                          {getRoleLabel(u.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={u.is_active !== false}
                            onCheckedChange={(checked) => onToggleActive(u.id, checked)}
                            disabled={u.id === currentUserId}
                          />
                          <span className={`text-sm ${u.is_active !== false ? "text-success" : "text-muted-foreground"}`}>
                            {u.is_active !== false ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={u.role}
                            onValueChange={(value) =>
                              onUpdateRole(u.id, value as "admin" | "moderator" | "user")
                            }
                            disabled={u.id === currentUserId}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuário</SelectItem>
                              <SelectItem value="moderator">Moderador</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewHistory(u)}
                            title="Ver histórico de login"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteConfirm(u)}
                            disabled={u.id === currentUserId}
                            className="text-destructive hover:text-destructive"
                            title="Remover usuário"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {users.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  Nenhum usuário encontrado
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Convidar Usuário
            </DialogTitle>
            <DialogDescription>
              Envie um convite por email para um novo usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="usuario@exemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role Inicial</label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as typeof inviteRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="moderator">Moderador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInvite} disabled={inviteLoading || !inviteEmail.trim()}>
              {inviteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Criar Usuário
            </DialogTitle>
            <DialogDescription>
              Crie um novo usuário com email e senha
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="usuario@exemplo.com"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmar Senha</label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Confirme a senha"
                value={createConfirmPassword}
                onChange={(e) => setCreateConfirmPassword(e.target.value)}
              />
              {createPassword && createConfirmPassword && createPassword !== createConfirmPassword && (
                <p className="text-sm text-destructive">As senhas não coincidem</p>
              )}
              {createPassword && createPassword.length < 6 && (
                <p className="text-sm text-destructive">A senha deve ter no mínimo 6 caracteres</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role Inicial</label>
              <Select value={createRole} onValueChange={(v) => setCreateRole(v as typeof createRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="moderator">Moderador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={
                createLoading || 
                !createEmail.trim() || 
                !createPassword || 
                createPassword.length < 6 || 
                createPassword !== createConfirmPassword
              }
            >
              {createLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o usuário <strong>{userToDelete?.email}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Login History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Login
            </DialogTitle>
            <DialogDescription>
              Últimos acessos de {historyUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : loginHistory.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum registro de login encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Navegador</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginHistory.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {format(new Date(entry.login_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {entry.user_agent || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={entry.success ? "default" : "destructive"}>
                            {entry.success ? "Sucesso" : "Falha"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
