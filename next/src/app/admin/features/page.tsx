"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Edit2, Plus, Trash2 } from "lucide-react";
import { FeatureDto } from "@/core/application/dtos/feature.dto";
import { FeatureService } from "@/lib/api/services/feature.service";
import { toast } from "sonner";

export default function AdminFeaturesPage() {
  const [features, setFeatures] = useState<FeatureDto[]>([]);
  const router = useRouter();

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const data = await FeatureService.getAllFeatures();
        setFeatures(data);
      } catch (e) {
        console.error(e);
        toast.error("데이터를 불러오는데 실패했습니다.");
      }
    };
    loadFeatures();
  }, []);

  const handleDelete = async (id: string, slug: string) => {
    if (confirm("정말 이 작업물을 삭제하시겠습니까?")) {
      try {
        await FeatureService.deleteFeature(slug);
        setFeatures(features.filter((f) => f.id !== id));
        toast.success("작업물이 삭제되었습니다.");
      } catch (e: any) {
        console.error(e);
        // 권한 에러는 fetcher에서 토스트를 띄우므로 중복 방지를 위해 메시지 확인
        if (e.message !== "권한이 없습니다.") {
          toast.error(e.message || "삭제에 실패했습니다.");
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">작업물 관리</h1>
          <p className="text-muted-foreground">
            포트폴리오의 주요 작업물을 관리합니다.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/features/new")}>
          <Plus className="mr-2 h-4 w-4" /> 작업물 추가
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>기간</TableHead>
              <TableHead>팀</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>기술 스택</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.map((feature) => (
              <TableRow key={feature.id}>
                <TableCell className="font-medium">{feature.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{feature.period || "-"}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{feature.team || "-"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{feature.category}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {feature.techStack.slice(0, 2).map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {feature.techStack.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{feature.techStack.length - 2}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/admin/features/${feature.id}/edit`)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(feature.id, feature.slug)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}