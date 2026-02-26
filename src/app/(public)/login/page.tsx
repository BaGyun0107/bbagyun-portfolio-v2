"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock } from "lucide-react";

/**
 * 관리자 대시보드 접근을 위한 로그인 페이지 컴포넌트입니다.
 * @returns React 컴포넌트 (로그인 페이지)
 */
export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [errorMsg, setErrorMsg] = useState("");

  /**
   * 로그인 처리를 수행하는 핸들러 함수입니다.
   * @param e - 폼 제출 이벤트 객체
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok || data.status === "error") {
        throw new Error(data.message || "Invalid credentials");
      }
      
      router.push("/admin/dashboard");
    } catch (err) {
      setErrorMsg((err as Error).message);
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
          <CardTitle className="text-xl">관리자 권한 접근</CardTitle>
          <CardDescription>
            대시보드에 접근하려면 인증 정보를 입력하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
                {errorMsg}
              </div>
            )}
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
            {process.env.NEXT_PUBLIC_USE_MOCK_API === "true" && (
              <div className="text-center text-xs text-muted-foreground mt-4">
                * 이것은 데모입니다. 로그인 버튼을 누르기만 하면 됩니다.
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
