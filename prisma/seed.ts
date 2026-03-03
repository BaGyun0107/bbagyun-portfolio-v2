import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import { REAL_FEATURES } from './data/features';
import { REAL_INSIGHTS } from './data/insights';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`,
    },
  },
});

async function main() {
  console.log('🌱 Seeding started...');

  // 1. Admin User
  const hashedPassword = await bcrypt.hash('admin', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bbagyun.com' },
    update: { password: hashedPassword },
    create: {
      name: 'BbaGyun',
      email: 'admin@bbagyun.com',
      password: hashedPassword,
      role: 'Admin',
      status: 'Active',
      lastLogin: new Date(),
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // 1-1. Viewer User
  const viewerPassword = await bcrypt.hash('viewer', 10);
  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@bbagyun.com' },
    update: { password: viewerPassword },
    create: {
      name: 'Viewer',
      email: 'viewer@bbagyun.com',
      password: viewerPassword,
      role: 'Viewer',
      status: 'Active',
      lastLogin: new Date(),
    },
  });
  console.log(`✅ Viewer: ${viewer.email}`);

  // 2. Features — prisma/data/features.ts 에서 관리
  await prisma.feature.deleteMany({});
  for (const feature of REAL_FEATURES) {
    await prisma.feature.create({
      data: {
        slug: feature.slug,
        title: feature.title,
        description: feature.description,
        iconName: feature.iconName,
        category: feature.category,
        techStack: JSON.stringify(feature.techStack),
        status: feature.status,
        apiCount: feature.apiCount,
        overview: feature.overview,
        period: feature.period ?? null,
        team: feature.team ?? null,
        content: feature.content ?? null,
      },
    });
    console.log(`✅ Feature: ${feature.title}`);
  }

  // 3. Insights — prisma/data/insights.ts 에서 관리
  await prisma.insight.deleteMany({});
  for (const insight of REAL_INSIGHTS) {
    let featureId = null;
    if (insight.featureSlug) {
      const feature = await prisma.feature.findUnique({
        where: { slug: insight.featureSlug },
      });
      if (feature) {
        featureId = feature.id;
      }
    }

    await prisma.insight.create({
      data: {
        slug: insight.slug,
        title: insight.title,
        excerpt: insight.excerpt,
        content: insight.content,
        date: insight.date,
        tags: JSON.stringify(insight.tags),
        readTime: insight.readTime,
        featureId,
      },
    });
    console.log(`✅ Insight: ${insight.title}`);
  }

  // 4. System Settings (최초 1회)
  if ((await prisma.systemSettings.count()) === 0) {
    await prisma.systemSettings.create({
      data: {
        siteName: 'BbaGyun Portfolio',
        seoDescription: 'Backend-focused Fullstack Developer Portfolio',
        maintenanceMode: false,
        analyticsEnabled: true,
        apiVersion: '1.0.0',
      },
    });
    console.log('✅ SystemSettings created');
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
