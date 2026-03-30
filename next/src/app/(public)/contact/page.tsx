"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const showPreparingMessage = (e: React.SyntheticEvent) => {
    e.preventDefault();
    toast.info("해당 기능은 준비중입니다. 이메일로 문의 부탁드립니다");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showPreparingMessage(e);
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>문의하기</CardTitle>
          <CardDescription>
            프로젝트 제안이나 백엔드 엔지니어링에 대해 이야기를 나누고 싶으신가요?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">이메일</label>
              <input 
                id="email" 
                type="email" 
                required
                readOnly
                onClick={showPreparingMessage}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                placeholder="you@company.com"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">메시지</label>
              <textarea 
                id="message" 
                required 
                rows={5}
                readOnly
                onClick={showPreparingMessage}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                placeholder="어떤 기술적 과제에 대해 이야기하고 싶으신가요?"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 전송 중...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> 메시지 보내기</>
              )}
            </Button>
          </form>
          
          <div className="mt-8 pt-8 border-t text-center">
            <p className="text-sm text-muted-foreground mb-2">또는 이메일로 직접 연락주세요</p>
            <a href="mailto:pus1789@gmail.com" className="inline-flex items-center gap-2 font-medium hover:text-primary transition-colors">
              <Mail className="h-4 w-4" /> pus1789@gmail.com
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
