"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import { FeatureService } from "@/lib/api/services/feature.service";
import { toast } from "sonner";
import { FeatureDto } from "@/core/application/dtos/feature.dto";

export default function AdminFeatureEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalSlug, setOriginalSlug] = useState("");

  const { register, handleSubmit, setValue, watch, reset } = useForm<any>({
    defaultValues: {
      title: "",
      slug: "",
      category: "Backend",
      status: "Beta",
      techStack: "",
      overview: "",
      description: "",
      period: "",
      team: "",
      content: "",
      iconName: "Box",
    },
  });

  const title = watch("title");

  useEffect(() => {
    const fetchFeature = async () => {
      try {
        setLoading(true);
        // Note: The API currently fetches by slug, but the list page passes the ID to this route.
        // Let's get all features and find by ID since we don't have the slug in the URL.
        const allFeatures = await FeatureService.getAllFeatures();
        const feature = allFeatures.find(f => f.id === id);
        
        if (feature) {
          setOriginalSlug(feature.slug);
          reset({
            ...feature,
            techStack: feature.techStack.join(", "),
          });
        } else {
          toast.error("작업물을 찾을 수 없습니다.");
          router.push("/admin/features");
        }
      } catch (err) {
        toast.error("데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFeature();
    }
  }, [id, reset, router]);

  // Auto-generate slug (only if it's a new feature, skip for edit)
  // Removed to prevent accidental slug changes on edit unless intended.

  const onFormSubmit = async (data: any) => {
    try {
      setSaving(true);
      const formattedData = {
        ...data,
        techStack: data.techStack.split(",").map((t: string) => t.trim()).filter(Boolean),
      };
      
      await FeatureService.updateFeature(originalSlug, formattedData);
      toast.success("작업물이 성공적으로 수정되었습니다.");
      router.push("/admin/features");
    } catch (err) {
      // The fetcher already shows a toast, but just in case
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/features")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">작업물 수정</h1>
          <p className="text-muted-foreground">기존 작업물의 정보를 수정합니다.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8 border p-8 rounded-lg bg-card shadow-sm">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input id="title" {...register("title", { required: true })} placeholder="예: 인증 시스템" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL 슬러그</Label>
              <Input id="slug" {...register("slug", { required: true })} placeholder="authentication-system" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">카테고리</Label>
              <Select onValueChange={(val) => setValue("category", val)} defaultValue="Backend">
                <SelectTrigger>
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Backend">Backend</SelectItem>
                  <SelectItem value="Frontend">Frontend</SelectItem>
                  <SelectItem value="DevOps">DevOps</SelectItem>
                  <SelectItem value="Fullstack">Fullstack</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">상세 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="period">기간</Label>
              <Input id="period" {...register("period")} placeholder="2024.01 ~ 2024.06" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team">팀 구성</Label>
              <Input id="team" {...register("team")} placeholder="Backend (본인 1명)" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="techStack">기술 스택 (쉼표로 구분)</Label>
            <Input id="techStack" {...register("techStack")} placeholder="React, Node.js, AWS, Docker" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">짧은 설명 (카드 노출용)</Label>
            <Input id="description" {...register("description")} placeholder="목록 카드에 표시될 한 줄 설명입니다." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="overview">개요 (상세 페이지 상단)</Label>
            <Textarea id="overview" {...register("overview")} className="h-24" placeholder="프로젝트에 대한 전반적인 개요를 작성하세요." />
          </div>
        </div>

        {/* Content - Markdown */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">본문 내용 (Markdown)</h2>
          <div className="space-y-2">
            <Label htmlFor="content">상세 내용</Label>
            <Textarea id="content" {...register("content")} className="min-h-[500px] font-mono text-sm leading-relaxed" placeholder="# 프로젝트 소개&#10;&#10;여기에 상세 내용을 마크다운으로 작성하세요..." />
            <p className="text-xs text-muted-foreground">Markdown 문법을 지원합니다. (Headers, Lists, Code blocks etc.)</p>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 border-t">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/features")} disabled={saving}>취소</Button>
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            저장하기
          </Button>
        </div>
      </form>
    </div>
  );
}
