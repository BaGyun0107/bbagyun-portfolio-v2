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
import { InsightDto } from "@/core/application/dtos/insight.dto";
import { InsightService } from "@/lib/api/services/insight.service";

export default function AdminInsightsPage() {
  const [insights, setInsights] = useState<InsightDto[]>([]);
  const router = useRouter();

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const data = await InsightService.getAllInsights();
        setInsights(data);
      } catch (e) {
        console.error(e);
      }
    };
    loadInsights();
  }, []);

  const handleDelete = async (id: string, slug: string) => {
    if (confirm("정말 이 글을 삭제하시겠습니까?")) {
      try {
        await InsightService.deleteInsight(slug);
        setInsights(insights.filter((i) => i.id !== id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">인사이트 관리</h1>
          <p className="text-muted-foreground">
            기술적인 글과 생각을 관리합니다.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/insights/new")}>
          <Plus className="mr-2 h-4 w-4" /> 글 추가
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>게시일</TableHead>
              <TableHead>태그</TableHead>
              <TableHead>읽는 시간</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {insights.map((insight) => (
              <TableRow key={insight.id}>
                <TableCell className="font-medium">
                  <div>{insight.title}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                    {insight.excerpt}
                  </div>
                </TableCell>
                <TableCell>{String(insight.date)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {insight.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{insight.readTime}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/insights/${insight.id}/edit`)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(insight.id, insight.slug)}>
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
