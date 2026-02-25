import { PrismaClient } from '../src/generated/prisma/client';
import { FEATURES, INSIGHTS, type Feature, type Insight } from '../src/data/mock';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Database seeding started...');

  // 1. Create Admin User
  const adminEmail = 'admin@example.com';
  const plainPassword = 'password'; // The default mock password from the login page form
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
    },
    create: {
      name: 'Super Admin',
      email: adminEmail,
      password: hashedPassword,
      role: 'Admin',
      status: 'Active',
      lastLogin: new Date(),
    },
  });
  console.log(`✅ Admin user created/updated: ${admin.email}`);

  // Create alternative "admin/admin" credentials as requested by user
  const simpleAdminEmail = 'admin';
  const simpleAdminPassword = await bcrypt.hash('admin', 10);
  
  const simpleAdmin = await prisma.user.upsert({
    where: { email: simpleAdminEmail },
    update: {
      password: simpleAdminPassword,
    },
    create: {
      name: 'Simple Admin',
      email: simpleAdminEmail,
      password: simpleAdminPassword,
      role: 'Admin',
      status: 'Active',
      lastLogin: new Date(),
    },
  });
  console.log(`✅ Simple admin user created/updated: ${simpleAdmin.email} / admin`);

  // 2. Insert Features
  for (const feature of FEATURES) {
    await prisma.feature.upsert({
      where: { slug: feature.slug },
      update: {},
      create: {
        slug: feature.slug,
        title: feature.title,
        description: feature.description,
        iconName: feature.iconName || 'Box',
        category: feature.category,
        techStack: JSON.stringify(feature.techStack),
        status: feature.status,
        apiCount: feature.apiCount || 0,
        overview: feature.overview || 'Mock overview',
        diagramUrl: feature.diagramUrl,
        period: feature.period,
        version: feature.version,
        team: feature.team,
        content: feature.content,
      },
    });
  }
  console.log(`✅ Inserted ${FEATURES.length} features`);

  // 3. Insert Insights
  for (const insight of INSIGHTS) {
    await prisma.insight.upsert({
      where: { slug: insight.slug },
      update: {},
      create: {
        title: insight.title,
        slug: insight.slug,
        excerpt: insight.excerpt || 'Mock excerpt',
        content: insight.content || 'Mock content',
        date: new Date(insight.date),
        tags: JSON.stringify(insight.tags),
        readTime: insight.readTime || '5 min',
      },
    });
  }
  console.log(`✅ Inserted ${INSIGHTS.length} insights`);

  // 4. Insert System Settings
  const settingsCount = await prisma.systemSettings.count();
  if (settingsCount === 0) {
    await prisma.systemSettings.create({
      data: {
        siteName: 'YS Portfolio',
        seoDescription: 'YS Backend Engineer Portfolio',
        maintenanceMode: false,
        analyticsEnabled: true,
        apiVersion: '1.0.0',
      }
    });
    console.log(`✅ Inserted system settings`);
  }

  // 5. Insert Contact Message
  const contactsCount = await prisma.contactMessage.count();
  if (contactsCount === 0) {
    await prisma.contactMessage.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello, I would like to collaborate on a project.',
        status: 'UNREAD'
      }
    });
    console.log(`✅ Inserted mock contact message`);
  }

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
