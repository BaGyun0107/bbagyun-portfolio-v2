"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "@/data/mock";

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: User | null;
  onSubmit: (data: Partial<User>) => void;
}

export function UserForm({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: UserFormProps) {
  const { register, handleSubmit, reset, setValue } = useForm<Partial<User>>({
    defaultValues: {
      name: "",
      email: "",
      role: "Viewer",
      status: "Active",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        name: "",
        email: "",
        role: "Viewer",
        status: "Active",
      });
    }
  }, [initialData, reset, open]);

  const onFormSubmit = (data: Partial<User>) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "사용자 수정" : "사용자 초대"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "사용자 정보 및 권한을 수정합니다."
              : "관리자 대시보드에 새 사용자를 초대합니다."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input id="name" {...register("name", { required: true })} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" {...register("email", { required: true })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">역할</Label>
              <Select
                onValueChange={(value) => setValue("role", value as "Admin" | "Editor" | "Viewer")}
                defaultValue={initialData?.role || "Viewer"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Editor">Editor</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">상태</Label>
              <Select
                onValueChange={(value) => setValue("status", value as "Active" | "Inactive")}
                defaultValue={initialData?.status || "Active"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">{initialData ? "변경사항 저장" : "초대장 보내기"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
