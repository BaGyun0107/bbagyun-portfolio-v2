import AdminLayout from "@/components/layout/AdminLayout";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { TokenPayload } from "@/core/application/utils/jwt.util";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  let role = "Viewer";

  if (token) {
    const payload = jwt.decode(token) as TokenPayload | null;
    if (payload && payload.role) {
      role = payload.role;
    }
  }

  return <AdminLayout userRole={role as "Admin" | "Editor" | "Viewer"}>{children}</AdminLayout>;
}
