"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit2, Plus, Trash2, UserCog } from "lucide-react";
import { UserDto, CreateUserDto } from "@/core/application/dtos/user.dto";
import { UserService } from "@/lib/api/services/user.service";
import { UserForm } from "@/components/admin/users/UserForm";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await UserService.getAllUsers();
        setUsers(data);
      } catch (e) {
        console.error(e);
      }
    };
    loadUsers();
  }, []);

  const handleAdd = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (user: UserDto) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("정말 이 사용자를 삭제하시겠습니까?")) {
      try {
        await UserService.deleteUser(id);
        setUsers(users.filter((u) => u.id !== id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSave = async (data: Partial<UserDto>) => {
    try {
      if (selectedUser) {
        // Update
        const updated = await UserService.updateUser(selectedUser.id, data);
        setUsers(
          users.map((u) => (u.id === selectedUser.id ? updated : u))
        );
        const created = await UserService.createUser(data as CreateUserDto);
        setUsers([created, ...users]);
      }
      setIsDialogOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">사용자 관리</h1>
          <p className="text-muted-foreground">
            관리자 콘솔 접근 권한 및 역할을 관리합니다.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> 사용자 초대
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>사용자</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>마지막 로그인</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <UserCog className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{user.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(user.lastLogin).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(user.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <UserForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={selectedUser}
        onSubmit={handleSave}
      />
    </div>
  );
}
