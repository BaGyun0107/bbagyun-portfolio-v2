"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Layers, 
  BookOpen, 
  Activity, 
  Users, 
  Settings, 
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export default function AdminLayout({ 
  children,
  userRole
}: { 
  children: React.ReactNode;
  userRole?: "Admin" | "Editor" | "Viewer";
}) {
  const pathname = usePathname();

  const sidebarItems = [
    { label: "대시보드", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "작업물 관리", path: "/admin/features", icon: Layers },
    { label: "인사이트 관리", path: "/admin/insights", icon: BookOpen },
    { label: "로그", path: "/admin/logs", icon: Activity },
    { label: "사용자 관리", path: "/admin/users", icon: Users },
    { label: "설정", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50/50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-background hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b gap-3">
          <Link href="/admin/dashboard" className="font-bold text-lg tracking-tight">
            관리자 콘솔
          </Link>
        </div>
        <div className="flex-1 py-6 px-3">
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname.startsWith(item.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" asChild>
            <Link href="/">
              <LogOut className="mr-2 h-4 w-4" />
              관리자 나가기
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col">
        <header className="h-16 border-b bg-background/50 backdrop-blur sticky top-0 z-40 flex items-center px-6 justify-between">
           <div className="md:hidden font-bold">관리자 콘솔</div>
           <div className="flex items-center gap-4 ml-auto">
             <div className="text-xs text-muted-foreground">소유자로 로그인됨</div>
             <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold">
               나
             </div>
           </div>
        </header>
        <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
