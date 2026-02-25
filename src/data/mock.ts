import { FeatureDto as Feature } from "@/core/application/dtos/feature.dto";
import { InsightDto as Insight } from "@/core/application/dtos/insight.dto";
import { LogDto as Log } from "@/core/application/dtos/log.dto";
import { UserDto as User } from "@/core/application/dtos/user.dto";
import { SystemSettingsDto as SystemSettings } from "@/core/application/dtos/system-setting.dto";

export type { Feature, Insight, Log, User, SystemSettings };

// --- 모의(Mock) 데이터 ---

const now = new Date().toISOString();

export const USERS: User[] = [
  { id: "u1", name: "Admin User", email: "admin@example.com", role: "Admin", status: "Active", lastLogin: "2024-01-20T10:00:00Z", createdAt: now, updatedAt: now },
  { id: "u2", name: "Editor Dave", email: "dave@example.com", role: "Editor", status: "Active", lastLogin: "2024-01-18T14:30:00Z", createdAt: now, updatedAt: now },
  { id: "u3", name: "Viewer Alice", email: "alice@example.com", role: "Viewer", status: "Inactive", lastLogin: "2023-12-25T09:15:00Z", createdAt: now, updatedAt: now },
];

export const SETTINGS: SystemSettings = {
  id: "s1",
  siteName: "DevPortfolio v2",
  seoDescription: "A technical portfolio showcasing full-stack capabilities.",
  maintenanceMode: false,
  analyticsEnabled: true,
  apiVersion: "v2.4.0",
  updatedAt: now,
};


export const FEATURES: Feature[] = [
  {
    id: "f1",
    slug: "authentication",
    title: "Authentication System",
    description: "Multi-tenant auth with JWT, OAuth2, and RBAC.",
    iconName: "Lock",
    category: "Backend",
    techStack: ["Node.js", "Redis", "JWT", "OAuth2"],
    status: "Production",
    apiCount: 12,
    overview: "A centralized authentication service designed to handle millions of requests. Supports session management, refresh token rotation, and granular permission control.",
    period: "2024.01 ~ 2024.03",
    version: "v2.1.0",
    team: "Backend (2명)",
    content: "# Authentication System\n\nDetailed markdown content...",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "f2",
    slug: "file-upload",
    title: "Secure File Upload",
    description: "Resumable uploads with virus scanning and CDN delivery.",
    iconName: "Upload",
    category: "Backend",
    techStack: ["AWS S3", "Lambda", "Presigned URLs"],
    status: "Production",
    apiCount: 5,
    overview: "High-performance file ingestion system. Handles multipart uploads, automatic mime-type detection, and integrates with virus scanning pipelines before making files public.",
    period: "2024.03 ~ 2024.04",
    version: "v1.0.0",
    team: "Backend (1명)",
    content: "# File Upload System\n\nDetailed markdown content...",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "f3",
    slug: "realtime-engine",
    title: "Real-time Engine",
    description: "WebSocket cluster for live notifications and chat.",
    iconName: "Zap",
    category: "Backend",
    techStack: ["Socket.io", "Redis Pub/Sub", "Go"],
    status: "Beta",
    apiCount: 8,
    overview: "Scalable WebSocket architecture capable of handling 100k+ concurrent connections using Redis adapter for horizontal scaling.",
    period: "2024.05 ~ Present",
    version: "v0.9.0",
    team: "Fullstack (3명)",
    content: "# Real-time Engine\n\nDetailed markdown content...",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "f4",
    slug: "admin-system",
    title: "Admin Dashboard",
    description: "Auto-generated internal tools based on schema.",
    iconName: "Layout",
    category: "Frontend",
    techStack: ["React", "TanStack Query", "AntD"],
    status: "Production",
    apiCount: 24,
    overview: "A meta-framework for generating admin interfaces. Reads database schema and allows for instant CRUD operations with optimistic UI updates.",
    period: "2023.11 ~ 2024.02",
    version: "v3.2.1",
    team: "Frontend (2명)",
    content: "# Admin Dashboard\n\nDetailed markdown content...",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "f5",
    slug: "payment-gateway",
    title: "Payment Aggregator",
    description: "Unified interface for Stripe, PayPal, and Toss.",
    iconName: "CreditCard",
    category: "Backend",
    techStack: ["NestJS", "PostgreSQL", "Queue"],
    status: "Archived",
    apiCount: 15,
    overview: "Abstracted payment layer that allows switching payment providers without code changes. Handles idempotency and webhook reconciliation.",
    period: "2023.08 ~ 2023.10",
    version: "v1.5.0",
    team: "Backend (2명)",
    content: "# Payment Aggregator\n\nDetailed markdown content...",
    createdAt: now,
    updatedAt: now,
  }
];

export const INSIGHTS: Insight[] = [
  {
    id: "i1",
    title: "Why I stopped using ORMs (mostly)",
    slug: "why-no-orm",
    excerpt: "The trade-off between convenience and control became too high at scale.",
    content: "Content placeholder...",
    date: "2025-12-10",
    tags: ["Database", "Architecture"],
    readTime: "5 min",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "i2",
    title: "Designing for Idempotency",
    slug: "designing-idempotency",
    excerpt: "How to ensure your payment system never charges twice.",
    content: "Content placeholder...",
    date: "2025-11-23",
    tags: ["Backend", "Payments"],
    readTime: "8 min",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "i3",
    title: "Microservices vs Monolith: A real world retrospective",
    slug: "microservices-retrospective",
    excerpt: "We split everything up. Then we put it back together.",
    content: "Content placeholder...",
    date: "2025-10-15",
    tags: ["Architecture", "DevOps"],
    readTime: "12 min",
    createdAt: now,
    updatedAt: now,
  }
];

// Math.random으로 매핑된 메서드에는 PATCH 및 OPTIONS가 포함될 수 있지만 일반적인 형태로 유지하기 위해 타입 단언(type assertion)을 사용합니다.
export const MOCK_LOGS: Log[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `log-${i}`,
  method: ["GET", "POST", "PUT", "DELETE"][Math.floor(Math.random() * 4)] as Log["method"],
  path: ["/api/auth/login", "/api/features", "/api/upload", "/api/users/me"][Math.floor(Math.random() * 4)],
  status: [200, 201, 400, 401, 500][Math.floor(Math.random() * 5)],
  latency: Math.floor(Math.random() * 500) + 20,
  timestamp: new Date(Date.now() - Math.floor(Math.random() * 10000000)).toISOString()
})).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

export const MOCK_STATS = [
  { name: 'Mon', visits: 4000, api: 2400 },
  { name: 'Tue', visits: 3000, api: 1398 },
  { name: 'Wed', visits: 2000, api: 9800 },
  { name: 'Thu', visits: 2780, api: 3908 },
  { name: 'Fri', visits: 1890, api: 4800 },
  { name: 'Sat', visits: 2390, api: 3800 },
  { name: 'Sun', visits: 3490, api: 4300 },
];