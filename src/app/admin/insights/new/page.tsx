"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INSIGHTS, Insight } from "@/data/mock";
import { ArrowLeft } from "lucide-react";

export default function AdminInsightFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const isEdit = !!id;

  const { register, handleSubmit, reset, setValue, watch } = useForm<Insight & { tagsInput: string }>({
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      date: new Date().toISOString().split("T")[0],
      readTime: "",
      tagsInput: "",
    },
  });

  const title = watch("title");

  useEffect(() => {
    if (isEdit && id) {
      const insight = INSIGHTS.find((i) => i.id === id);
      if (insight) {
        reset({
          ...insight,
          tagsInput: insight.tags.join(", "),
        });
      }
    }
  }, [id, isEdit, reset]);

  // Auto-generate slug
  useEffect(() => {
    if (!isEdit && title) {
      setValue("slug", title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    }
  }, [title, isEdit, setValue]);

  const onFormSubmit = (data: any) => {
    const formattedData = {
      ...data,
      tags: data.tagsInput.split(",").map((t: string) => t.trim()).filter(Boolean),
    };
    delete formattedData.tagsInput;
    
    console.log("Insight Form Submitted:", formattedData);
    alert("저장되었습니다. (Note: 실제 데이터베이스가 연결되지 않아 새로고침 시 초기화됩니다)");
    router.push("/admin/insights");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/insights")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
           <h1 className="text-3xl font-bold tracking-tight">{isEdit ? "인사이트 수정" : "새 인사이트 작성"}</h1>
           <p className="text-muted-foreground">{isEdit ? "기존 글을 수정합니다." : "새로운 기술 블로그 글을 작성합니다."}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8 border p-8 rounded-lg bg-card shadow-sm">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input id="title" {...register("title", { required: true })} placeholder="예: React 19의 새로운 기능" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL 슬러그</Label>
              <Input id="slug" {...register("slug", { required: true })} placeholder="react-19-new-features" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="date">게시일</Label>
              <Input type="date" id="date" {...register("date", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="readTime">예상 읽는 시간</Label>
              <Input id="readTime" {...register("readTime")} placeholder="5 min" />
            </div>
          </div>
          
           <div className="space-y-2">
              <Label htmlFor="tagsInput">태그 (쉼표로 구분)</Label>
              <Input id="tagsInput" {...register("tagsInput")} placeholder="React, Frontend, Optimization" />
           </div>

           <div className="space-y-2">
             <Label htmlFor="excerpt">요약 (Excerpt)</Label>
             <Textarea id="excerpt" {...register("excerpt")} className="h-20" placeholder="글의 핵심 내용을 요약해서 작성하세요. 목록에 표시됩니다." />
           </div>
        </div>

        {/* Content - Markdown */}
        <div className="space-y-4">
           <h2 className="text-xl font-semibold border-b pb-2">본문 내용 (Markdown)</h2>
           <div className="space-y-2">
             <Label htmlFor="content">상세 내용</Label>
             <Textarea id="content" {...register("content")} className="min-h-[600px] font-mono text-sm leading-relaxed" placeholder="# 제목&#10;&#10;본문 내용을 마크다운으로 작성하세요..." />
             <p className="text-xs text-muted-foreground">Markdown 문법을 지원합니다. (Headers, Lists, Code blocks, etc.)</p>
           </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 border-t">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/insights")}>취소</Button>
          <Button type="submit" size="lg">저장하기</Button>
        </div>
      </form>
    </div>
  );
}