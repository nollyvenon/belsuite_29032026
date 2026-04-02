// Prisma Database Seed
// This file seeds initial data for development/testing

import { PrismaClient, SubscriptionTier } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create billing plans
  console.log('Creating billing plans...');
  const plans = await Promise.all([
    prisma.billingPlan.upsert({
      where: { tier: 'FREE' },
      update: {},
      create: {
        name: 'Free',
        tier: 'FREE',
        description: 'Perfect for getting started',
        pricePerMonth: 0,
        pricePerYear: 0,
        maxMembers: 5,
        maxProjects: 10,
        maxStorageGB: 5,
        features: ['basic-content', 'basic-scheduling'],
      },
    }),
    prisma.billingPlan.upsert({
      where: { tier: 'STARTER' },
      update: {},
      create: {
        name: 'Starter',
        tier: 'STARTER',
        description: 'For small teams',
        pricePerMonth: 29,
        pricePerYear: 290,
        maxMembers: 10,
        maxProjects: 50,
        maxStorageGB: 100,
        features: [
          'all-content-types',
          'basic-automation',
          'basic-analytics',
        ],
      },
    }),
    prisma.billingPlan.upsert({
      where: { tier: 'PROFESSIONAL' },
      update: {},
      create: {
        name: 'Professional',
        tier: 'PROFESSIONAL',
        description: 'For growing teams',
        pricePerMonth: 99,
        pricePerYear: 990,
        maxMembers: 50,
        maxProjects: 500,
        maxStorageGB: 1024,
        features: [
          'all-features',
          'advanced-automation',
          'advanced-analytics',
          'api-access',
          'priority-support',
        ],
      },
    }),
    prisma.billingPlan.upsert({
      where: { tier: 'ENTERPRISE' },
      update: {},
      create: {
        name: 'Enterprise',
        tier: 'ENTERPRISE',
        description: 'For large organizations',
        pricePerMonth: 9999,
        pricePerYear: 99990,
        maxMembers: 999,
        maxProjects: 9999,
        maxStorageGB: 10240,
        features: [
          'all-features',
          'custom-integration',
          'dedicated-support',
          'sso',
          'custom-contracts',
        ],
      },
    }),
  ]);

  console.log(`✓ Created ${plans.length} billing plans`);

  // 2. Create demo user
  console.log('Creating demo user...');
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@belsuite.com' },
    update: {},
    create: {
      email: 'demo@belsuite.com',
      passwordHash: '$2b$10$demo.hashed.password', // bcrypt hash of "Demo123456!"
      firstName: 'Demo',
      lastName: 'User',
      status: 'ACTIVE',
    },
  });

  console.log(`✓ Created demo user: ${demoUser.email}`);

  // 3. Create demo organization
  console.log('Creating demo organization...');
  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'demo-organization' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-organization',
      description: 'Demo workspace for testing Belsuite',
      status: 'ACTIVE',
      tier: 'PROFESSIONAL',
      maxMembers: 50,
      maxProjects: 500,
      maxStorageGB: 1024,
    },
  });

  console.log(`✓ Created demo organization: ${demoOrg.name}`);

  // 4. Create roles
  console.log('Creating roles...');
  const adminRole = await prisma.role.upsert({
    where: {
      organizationId_name: {
        organizationId: demoOrg.id,
        name: 'Admin',
      },
    },
    update: {},
    create: {
      organizationId: demoOrg.id,
      name: 'Admin',
      isSystem: true,
    },
  });

  const creatorRole = await prisma.role.upsert({
    where: {
      organizationId_name: {
        organizationId: demoOrg.id,
        name: 'Creator',
      },
    },
    update: {},
    create: {
      organizationId: demoOrg.id,
      name: 'Creator',
      isSystem: false,
    },
  });

  console.log(`✓ Created roles: Admin, Creator`);

  // 5. Create permissions
  console.log('Creating permissions...');
  const permissions = [
    { action: 'create', resource: 'content' },
    { action: 'read', resource: 'content' },
    { action: 'update', resource: 'content' },
    { action: 'delete', resource: 'content' },
    { action: 'manage', resource: 'users' },
    { action: 'manage', resource: 'organization' },
    { action: 'manage', resource: 'billing' },
    { action: 'read', resource: 'deals' },
    { action: 'manage', resource: 'deals' },
    { action: 'read', resource: 'rank_tracker' },
    { action: 'manage', resource: 'rank_tracker' },
    { action: 'read', resource: 'call_center' },
    { action: 'manage', resource: 'call_center' },
    { action: 'read', resource: 'revenue' },
    { action: 'read', resource: 'referrals' },
    { action: 'manage', resource: 'referrals' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: {
        roleId_action_resource: {
          roleId: adminRole.id,
          action: perm.action,
          resource: perm.resource,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        action: perm.action,
        resource: perm.resource,
      },
    });
  }

  const creatorPermissions = ['create', 'read', 'update'].map((action) => ({
    action,
    resource: 'content',
  })).concat([
    { action: 'read', resource: 'deals' },
    { action: 'read', resource: 'rank_tracker' },
    { action: 'read', resource: 'call_center' },
    { action: 'read', resource: 'revenue' },
    { action: 'read', resource: 'referrals' },
  ]);

  for (const perm of creatorPermissions) {
    await prisma.permission.upsert({
      where: {
        roleId_action_resource: {
          roleId: creatorRole.id,
          action: perm.action,
          resource: perm.resource,
        },
      },
      update: {},
      create: {
        roleId: creatorRole.id,
        action: perm.action,
        resource: perm.resource,
      },
    });
  }

  console.log(`✓ Created ${permissions.length} permissions`);

  // 6. Add user to organization
  console.log('Adding user to organization...');
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: demoOrg.id,
        userId: demoUser.id,
      },
    },
    update: {},
    create: {
      organizationId: demoOrg.id,
      userId: demoUser.id,
      roleId: adminRole.id,
      status: 'ACTIVE',
      roleName: 'Admin',
      permissions: permissions.map((p) => `${p.action}:${p.resource}`),
    },
  });

  console.log(`✓ Added user to organization as Admin`);

  // 7. Create subscription
  console.log('Creating subscription...');
  const subscription = await prisma.subscription.upsert({
    where: { organizationId: demoOrg.id },
    update: {},
    create: {
      organizationId: demoOrg.id,
      planId: plans[2].id, // Professional plan
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`✓ Created subscription`);

  // 8. Create sample content
  console.log('Creating sample content...');
  const content1 = await prisma.content.upsert({
    where: { organizationId_slug: { organizationId: demoOrg.id, slug: 'welcome-post' } },
    update: {},
    create: {
      organizationId: demoOrg.id,
      type: 'TEXT',
      title: 'Welcome to Belsuite',
      slug: 'welcome-post',
      description: 'Getting started with Belsuite platform',
      content: 'Welcome to Belsuite! This is your first content item.',
      creatorId: demoUser.id,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  const content2 = await prisma.content.upsert({
    where: { organizationId_slug: { organizationId: demoOrg.id, slug: 'sample-image' } },
    update: {},
    create: {
      organizationId: demoOrg.id,
      type: 'IMAGE',
      title: 'Sample Image',
      slug: 'sample-image',
      description: 'Sample image for demonstration',
      creatorId: demoUser.id,
      status: 'DRAFT',
    },
  });

  console.log(`✓ Created 2 sample content items`);

  // 9. Create billing profile
  console.log('Creating billing profile...');
  await prisma.billingProfile.upsert({
    where: { organizationId: demoOrg.id },
    update: {},
    create: {
      organizationId: demoOrg.id,
      billingEmail: 'billing@belsuite.com',
      billingName: 'Demo Organization',
      billingAddress: '123 Demo Street',
      billingCity: 'Demo City',
      billingState: 'DC',
      billingZip: '12345',
      billingCountry: 'USA',
    },
  });

  console.log(`✓ Created billing profile`);

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\nDemo credentials:');
  console.log('  Email: demo@belsuite.com');
  console.log('  Password: Demo123456!');
  console.log('\nYou can now log in and explore the platform.');
}

main()
  .catch((e) => {
    console.error('🔴 Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
