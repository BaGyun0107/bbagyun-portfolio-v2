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
import { Insight } from "@/data/mock";

interface InsightFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Insight | null;
  onSubmit: (data: Partial<Insight>) => void;
}

export function InsightForm({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: InsightFormProps) {
  interface InsightFormValues {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    date: string;
    tags: string;
    readTime: string;
  }

  const { register, handleSubmit, reset, setValue, watch } = useForm<InsightFormValues>({
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      date: new Date().toISOString().split('T')[0],
      tags: "",
      readTime: "",
    },
  });

  const title = watch("title");

  useEffect(() => {
    if (initialData) {
      const dateVal = initialData.date;
      const formattedDate = dateVal instanceof Date 
        ? dateVal.toISOString().split('T')[0] 
        : String(dateVal).split('T')[0];
        
      reset({
        ...initialData,
        date: formattedDate,
        tags: initialData.tags.join(", "),
      });
    } else {
      reset({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        date: new Date().toISOString().split('T')[0],
        tags: "",
        readTime: "",
      });
    }
  }, [initialData, reset, open]);

  useEffect(() => {
    if (!initialData && title) {
      setValue("slug", title.toLowerCase().replace(/\s+/g, "-"));
    }
  }, [title, initialData, setValue]);

  const onFormSubmit = (data: InsightFormValues) => {
    const formattedData = {
      ...data,
      tags: data.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
    };
    onSubmit(formattedData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "글 수정" : "글 추가"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "여기서 글 정보를 수정하세요."
              : "새 블로그 글을 작성합니다."}
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
              <Label htmlFor="date">날짜</Label>
              <Input type="date" id="date" {...register("date", { required: true })} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="readTime">읽는 시간</Label>
              <Input id="readTime" placeholder="5분" {...register("readTime")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
            <Input id="tags" placeholder="React, Tutorial" {...register("tags")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">요약</Label>
            <Textarea id="excerpt" {...register("excerpt")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">내용</Label>
            <Textarea className="min-h-[200px]" id="content" {...register("content")} />
          </div>

          <DialogFooter>
            <Button type="submit">변경사항 저장</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
