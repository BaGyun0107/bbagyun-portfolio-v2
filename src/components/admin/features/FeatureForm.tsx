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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Feature } from "@/data/mock";

interface FeatureFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Feature | null;
  onSubmit: (data: Partial<Feature>) => void;
}

export function FeatureForm({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: FeatureFormProps) {
  interface FeatureFormValues {
    title: string;
    slug: string;
    category: "Backend" | "Frontend" | "DevOps";
    status: "Production" | "Beta" | "Archived";
    techStack: string;
    overview: string;
    description: string;
    iconName: string;
  }

  const { register, handleSubmit, reset, setValue, watch } = useForm<FeatureFormValues>({
    defaultValues: {
      title: "",
      slug: "",
      category: "Backend",
      status: "Beta",
      techStack: "", // Manage as string for input
      overview: "",
      description: "",
      iconName: "Box",
    },
  });

  // Watch title to auto-generate slug if not editing
  const title = watch("title");

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        techStack: initialData.techStack.join(", "), // Convert array to string
      });
    } else {
      reset({
        title: "",
        slug: "",
        category: "Backend",
        status: "Beta",
        techStack: "",
        overview: "",
        description: "",
        iconName: "Box",
      });
    }
  }, [initialData, reset, open]);

  useEffect(() => {
    if (!initialData && title) {
      setValue("slug", title.toLowerCase().replace(/\s+/g, "-"));
    }
  }, [title, initialData, setValue]);

  const onFormSubmit = (data: FeatureFormValues) => {
    const formattedData = {
      ...data,
      techStack: data.techStack.split(",").map((t: string) => t.trim()).filter(Boolean),
      apiCount: initialData?.apiCount || 0,
    };
    onSubmit(formattedData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "작업물 수정" : "작업물 추가"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "여기서 작업물 정보를 수정하세요."
              : "포트폴리오에 새 작업물을 추가합니다."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input id="title" {...register("title", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">슬러그</Label>
              <Input id="slug" {...register("slug", { required: true })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <Select
                onValueChange={(value) => setValue("category", value as "Backend" | "Frontend" | "DevOps")}
                defaultValue={initialData?.category || "Backend"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Backend">Backend</SelectItem>
                  <SelectItem value="Frontend">Frontend</SelectItem>
                  <SelectItem value="DevOps">DevOps</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">상태</Label>
              <Select
                onValueChange={(value) => setValue("status", value as "Production" | "Beta" | "Archived")}
                defaultValue={initialData?.status || "Beta"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Beta">Beta</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">짧은 설명</Label>
            <Input id="description" {...register("description")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="techStack">기술 스택 (쉼표로 구분)</Label>
            <Input
              id="techStack"
              placeholder="React, Node.js, AWS"
              {...register("techStack")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="overview">개요</Label>
            <Textarea id="overview" {...register("overview")} />
          </div>

          <DialogFooter>
            <Button type="submit">변경사항 저장</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
