"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, Eye } from "lucide-react";
import { toast } from "sonner";

/**
 * 관리자 대시보드 접근을 위한 로그인 페이지 컴포넌트입니다.
 * @returns React 컴포넌트 (로그인 페이지)
 */
export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("admin");

  /**
   * 로그인 처리를 수행하는 핸들러 함수입니다.
   * @param e - 폼 제출 이벤트 객체
   */
  const handleLogin = async (e?: React.FormEvent, targetEmail = email, targetPassword = password) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });
      
      const data = await res.json();
      
      if (!res.ok || data.status === "error" || data.success === false) {
        throw new Error(data.message || "잘못된 자격 증명입니다.");
      }
      
      toast.success("로그인 성공", { description: "대시보드로 이동합니다." });
      router.push("/admin/dashboard");
    } catch (err) {
      toast.error("로그인 실패", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <Lock className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl">로그인</CardTitle>
          <CardDescription>
            대시보드에 접근하려면 인증 정보를 입력하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div className="space-y-2">
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "로그인"}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  또는
                </span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline"
              className="w-full" 
              disabled={loading}
              onClick={() => handleLogin(undefined, "viewer@bbagyun.com", "viewer")}
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <><Eye className="mr-2 h-4 w-4"/> 구경하기 (Viewer Mode)</>}
            </Button>
            
            {process.env.NEXT_PUBLIC_USE_MOCK_API === "true" && (
              <div className="text-center text-xs text-muted-foreground mt-4">
                * 이것은 데모입니다. 로그인 또는 구경하기 버튼을 누르기만 하면 됩니다.
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
