"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save } from "lucide-react";
import { SystemSettingService } from "@/lib/api/services/system-setting.service";
import { SystemSettingsDto } from "@/core/application/dtos/system-setting.dto";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingsDto | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await SystemSettingService.getSettings();
        setSettings(data);
      } catch (e) {
        console.error(e);
      }
    };
    loadSettings();
  }, []);

  if (!settings) {
    return <div>Loading...</div>;
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">시스템 설정</h1>
        <p className="text-muted-foreground">
          전역 애플리케이션 설정 및 기본 설정을 구성합니다.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>일반 정보</CardTitle>
            <CardDescription>
              포트폴리오 웹사이트의 기본 정보입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="siteName">사이트 이름</Label>
              <Input id="siteName" defaultValue={settings.siteName} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seoDescription">SEO 설명</Label>
              <Input id="seoDescription" defaultValue={settings.seoDescription} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>시스템 환경설정</CardTitle>
            <CardDescription>
              운영 모드 및 기능 플래그를 관리합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* TODO: 유지보수 모드 및 분석 활성화 기능 구현 */}
            {/* <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">유지보수 모드</Label>
                <div className="text-sm text-muted-foreground">
                  사이트의 공개 접속을 차단합니다.
                </div>
              </div>
              <Switch defaultChecked={settings.maintenanceMode} />
            </div>
            <Separator />
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">분석 활성화</Label>
                <div className="text-sm text-muted-foreground">
                  익명 사용 데이터를 수집합니다.
                </div>
              </div>
              <Switch defaultChecked={settings.analyticsEnabled} />
            </div>
            <Separator /> */}
            <div className="grid gap-2">
              <Label htmlFor="apiVersion">API 버전</Label>
              <Input id="apiVersion" defaultValue={settings.apiVersion} className="max-w-[200px]" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>
            <Save className="mr-2 h-4 w-4" /> 변경사항 저장
          </Button>
        </div>
      </div>
    </div>
  );
}
