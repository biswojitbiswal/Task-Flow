import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

import {
  OrgRole,
  TaskPriority,
  TaskStatus,
} from '../src/generated/prisma/client';

import bcrypt from 'bcrypt';

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured');
  }

  const adapter = new PrismaPg({
    connectionString,
  });

  const prisma = new PrismaClient({
    adapter,
  });

  try {
    console.log('🌱 Starting database seed...');

    /*
     * ---------------------------------------------------------
     * Password
     * ---------------------------------------------------------
     */

    const passwordHash = await bcrypt.hash(
      'Password123!',
      12,
    );

    /*
     * ---------------------------------------------------------
     * Organizations
     * ---------------------------------------------------------
     */

    const organizationA = await prisma.organization.upsert({
      where: {
        id: '00000000-0000-4000-8000-000000000001',
      },
      update: {
        name: 'TaskFlow Engineering',
      },
      create: {
        id: '00000000-0000-4000-8000-000000000001',
        name: 'TaskFlow Engineering',
      },
    });

    const organizationB = await prisma.organization.upsert({
      where: {
        id: '00000000-0000-4000-8000-000000000002',
      },
      update: {
        name: 'TaskFlow Design',
      },
      create: {
        id: '00000000-0000-4000-8000-000000000002',
        name: 'TaskFlow Design',
      },
    });

    /*
     * ---------------------------------------------------------
     * Users
     * ---------------------------------------------------------
     *
     * 3 users → Engineering
     * 2 users → Design
     */

    const alice = await prisma.user.upsert({
      where: {
        id: '00000000-0000-4000-8000-000000000101',
      },
      update: {
        name: 'Alice Admin',
        email: 'alice@taskflow-demo.com',
        passwordHash,
      },
      create: {
        id: '00000000-0000-4000-8000-000000000101',
        name: 'Alice Admin',
        email: 'alice@taskflow-demo.com',
        passwordHash,
      },
    });

    const bob = await prisma.user.upsert({
      where: {
        id: '00000000-0000-4000-8000-000000000102',
      },
      update: {
        name: 'Bob Developer',
        email: 'bob@taskflow-demo.com',
        passwordHash,
      },
      create: {
        id: '00000000-0000-4000-8000-000000000102',
        name: 'Bob Developer',
        email: 'bob@taskflow-demo.com',
        passwordHash,
      },
    });

    const charlie = await prisma.user.upsert({
      where: {
        id: '00000000-0000-4000-8000-000000000103',
      },
      update: {
        name: 'Charlie Developer',
        email: 'charlie@taskflow-demo.com',
        passwordHash,
      },
      create: {
        id: '00000000-0000-4000-8000-000000000103',
        name: 'Charlie Developer',
        email: 'charlie@taskflow-demo.com',
        passwordHash,
      },
    });

    const david = await prisma.user.upsert({
      where: {
        id: '00000000-0000-4000-8000-000000000104',
      },
      update: {
        name: 'David Admin',
        email: 'david@taskflow-demo.com',
        passwordHash,
      },
      create: {
        id: '00000000-0000-4000-8000-000000000104',
        name: 'David Admin',
        email: 'david@taskflow-demo.com',
        passwordHash,
      },
    });

    const eve = await prisma.user.upsert({
      where: {
        id: '00000000-0000-4000-8000-000000000105',
      },
      update: {
        name: 'Eve Designer',
        email: 'eve@taskflow-demo.com',
        passwordHash,
      },
      create: {
        id: '00000000-0000-4000-8000-000000000105',
        name: 'Eve Designer',
        email: 'eve@taskflow-demo.com',
        passwordHash,
      },
    });

    /*
     * ---------------------------------------------------------
     * Organization memberships
     * ---------------------------------------------------------
     */

    await prisma.orgMember.upsert({
      where: {
        userId_organizationId: {
          userId: alice.id,
          organizationId: organizationA.id,
        },
      },
      update: {
        role: OrgRole.org_admin,
      },
      create: {
        userId: alice.id,
        organizationId: organizationA.id,
        role: OrgRole.org_admin,
      },
    });

    await prisma.orgMember.upsert({
      where: {
        userId_organizationId: {
          userId: bob.id,
          organizationId: organizationA.id,
        },
      },
      update: {
        role: OrgRole.member,
      },
      create: {
        userId: bob.id,
        organizationId: organizationA.id,
        role: OrgRole.member,
      },
    });

    await prisma.orgMember.upsert({
      where: {
        userId_organizationId: {
          userId: charlie.id,
          organizationId: organizationA.id,
        },
      },
      update: {
        role: OrgRole.member,
      },
      create: {
        userId: charlie.id,
        organizationId: organizationA.id,
        role: OrgRole.member,
      },
    });

    await prisma.orgMember.upsert({
      where: {
        userId_organizationId: {
          userId: david.id,
          organizationId: organizationB.id,
        },
      },
      update: {
        role: OrgRole.org_admin,
      },
      create: {
        userId: david.id,
        organizationId: organizationB.id,
        role: OrgRole.org_admin,
      },
    });

    await prisma.orgMember.upsert({
      where: {
        userId_organizationId: {
          userId: eve.id,
          organizationId: organizationB.id,
        },
      },
      update: {
        role: OrgRole.member,
      },
      create: {
        userId: eve.id,
        organizationId: organizationB.id,
        role: OrgRole.member,
      },
    });

    /*
     * ---------------------------------------------------------
     * Projects
     * ---------------------------------------------------------
     */

    const backendProject =
      await prisma.project.upsert({
        where: {
          id: '00000000-0000-4000-8000-000000000201',
        },
        update: {
          name: 'Backend Development',
          description:
            'TaskFlow backend implementation',
          organizationId: organizationA.id,
          deletedAt: null,
        },
        create: {
          id: '00000000-0000-4000-8000-000000000201',
          organizationId: organizationA.id,
          name: 'Backend Development',
          description:
            'TaskFlow backend implementation',
        },
      });

    const frontendProject =
      await prisma.project.upsert({
        where: {
          id: '00000000-0000-4000-8000-000000000202',
        },
        update: {
          name: 'Frontend Development',
          description:
            'TaskFlow frontend implementation',
          organizationId: organizationA.id,
          deletedAt: null,
        },
        create: {
          id: '00000000-0000-4000-8000-000000000202',
          organizationId: organizationA.id,
          name: 'Frontend Development',
          description:
            'TaskFlow frontend implementation',
        },
      });

    const designProject =
      await prisma.project.upsert({
        where: {
          id: '00000000-0000-4000-8000-000000000203',
        },
        update: {
          name: 'UI/UX Design',
          description:
            'TaskFlow product design',
          organizationId: organizationB.id,
          deletedAt: null,
        },
        create: {
          id: '00000000-0000-4000-8000-000000000203',
          organizationId: organizationB.id,
          name: 'UI/UX Design',
          description:
            'TaskFlow product design',
        },
      });

    const researchProject =
      await prisma.project.upsert({
        where: {
          id: '00000000-0000-4000-8000-000000000204',
        },
        update: {
          name: 'Design Research',
          description:
            'Product and user research',
          organizationId: organizationB.id,
          deletedAt: null,
        },
        create: {
          id: '00000000-0000-4000-8000-000000000204',
          organizationId: organizationB.id,
          name: 'Design Research',
          description:
            'Product and user research',
        },
      });

    /*
     * ---------------------------------------------------------
     * Tasks
     * ---------------------------------------------------------
     */

    const tasks = [
      {
        id: '00000000-0000-4000-8000-000000000301',
        projectId: backendProject.id,
        organizationId: organizationA.id,
        title: 'Implement authentication',
        description: 'Implement register and login flow',
        status: TaskStatus.done,
        priority: TaskPriority.high,
      },
      {
        id: '00000000-0000-4000-8000-000000000302',
        projectId: backendProject.id,
        organizationId: organizationA.id,
        title: 'Implement JWT authorization',
        description: 'Add JWT authentication guards',
        status: TaskStatus.done,
        priority: TaskPriority.high,
      },
      {
        id: '00000000-0000-4000-8000-000000000303',
        projectId: backendProject.id,
        organizationId: organizationA.id,
        title: 'Implement task CRUD',
        description: 'Create task management APIs',
        status: TaskStatus.in_progress,
        priority: TaskPriority.urgent,
      },
      {
        id: '00000000-0000-4000-8000-000000000304',
        projectId: backendProject.id,
        organizationId: organizationA.id,
        title: 'Add task filters',
        description: 'Implement status and priority filters',
        status: TaskStatus.review,
        priority: TaskPriority.medium,
      },
      {
        id: '00000000-0000-4000-8000-000000000305',
        projectId: frontendProject.id,
        organizationId: organizationA.id,
        title: 'Create task dashboard',
        description: 'Build task dashboard UI',
        status: TaskStatus.in_progress,
        priority: TaskPriority.high,
      },
      {
        id: '00000000-0000-4000-8000-000000000306',
        projectId: frontendProject.id,
        organizationId: organizationA.id,
        title: 'Build project page',
        description: 'Create project management interface',
        status: TaskStatus.todo,
        priority: TaskPriority.medium,
      },
      {
        id: '00000000-0000-4000-8000-000000000307',
        projectId: frontendProject.id,
        organizationId: organizationA.id,
        title: 'Add pagination controls',
        description: 'Implement task pagination',
        status: TaskStatus.todo,
        priority: TaskPriority.low,
      },
      {
        id: '00000000-0000-4000-8000-000000000308',
        projectId: designProject.id,
        organizationId: organizationB.id,
        title: 'Design login page',
        description: 'Create authentication screens',
        status: TaskStatus.done,
        priority: TaskPriority.high,
      },
      {
        id: '00000000-0000-4000-8000-000000000309',
        projectId: designProject.id,
        organizationId: organizationB.id,
        title: 'Design task board',
        description: 'Create task management wireframes',
        status: TaskStatus.in_progress,
        priority: TaskPriority.high,
      },
      {
        id: '00000000-0000-4000-8000-000000000310',
        projectId: designProject.id,
        organizationId: organizationB.id,
        title: 'Create design system',
        description: 'Define reusable UI components',
        status: TaskStatus.review,
        priority: TaskPriority.urgent,
      },
      {
        id: '00000000-0000-4000-8000-000000000311',
        projectId: researchProject.id,
        organizationId: organizationB.id,
        title: 'Conduct user interviews',
        description: 'Interview initial TaskFlow users',
        status: TaskStatus.todo,
        priority: TaskPriority.medium,
      },
      {
        id: '00000000-0000-4000-8000-000000000312',
        projectId: researchProject.id,
        organizationId: organizationB.id,
        title: 'Analyze user feedback',
        description: 'Summarize user research findings',
        status: TaskStatus.todo,
        priority: TaskPriority.low,
      },
    ];

    for (const task of tasks) {
      await prisma.task.upsert({
        where: {
          id: task.id,
        },
        update: {
          projectId: task.projectId,
          organizationId: task.organizationId,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          deletedAt: null,
        },
        create: task,
      });
    }

    /*
     * ---------------------------------------------------------
     * Task assignments
     * ---------------------------------------------------------
     */

    const assignments = [
      {
        id: '00000000-0000-4000-8000-000000000401',
        taskId: tasks[0].id,
        userId: bob.id,
      },
      {
        id: '00000000-0000-4000-8000-000000000402',
        taskId: tasks[2].id,
        userId: charlie.id,
      },
      {
        id: '00000000-0000-4000-8000-000000000403',
        taskId: tasks[3].id,
        userId: bob.id,
      },
      {
        id: '00000000-0000-4000-8000-000000000404',
        taskId: tasks[4].id,
        userId: charlie.id,
      },
      {
        id: '00000000-0000-4000-8000-000000000405',
        taskId: tasks[7].id,
        userId: eve.id,
      },
      {
        id: '00000000-0000-4000-8000-000000000406',
        taskId: tasks[8].id,
        userId: eve.id,
      },
      {
        id: '00000000-0000-4000-8000-000000000407',
        taskId: tasks[9].id,
        userId: david.id,
      },
    ];

    for (const assignment of assignments) {
      await prisma.taskAssignment.upsert({
        where: {
          id: assignment.id,
        },
        update: {
          taskId: assignment.taskId,
          userId: assignment.userId,
        },
        create: assignment,
      });
    }

    /*
     * ---------------------------------------------------------
     * Comments
     * ---------------------------------------------------------
     */

    const comments = [
      {
        id: '00000000-0000-4000-8000-000000000501',
        taskId: tasks[0].id,
        userId: alice.id,
        content:
          'Authentication implementation is ready for review.',
      },
      {
        id: '00000000-0000-4000-8000-000000000502',
        taskId: tasks[2].id,
        userId: bob.id,
        content:
          'Task CRUD endpoints are currently being implemented.',
      },
      {
        id: '00000000-0000-4000-8000-000000000503',
        taskId: tasks[3].id,
        userId: charlie.id,
        content:
          'Filters have been added and are ready for testing.',
      },
      {
        id: '00000000-0000-4000-8000-000000000504',
        taskId: tasks[7].id,
        userId: david.id,
        content:
          'Login page design has been approved.',
      },
      {
        id: '00000000-0000-4000-8000-000000000505',
        taskId: tasks[9].id,
        userId: eve.id,
        content:
          'The design system is ready for review.',
      },
    ];

    for (const comment of comments) {
      await prisma.comment.upsert({
        where: {
          id: comment.id,
        },
        update: {
          taskId: comment.taskId,
          userId: comment.userId,
          content: comment.content,
        },
        create: comment,
      });
    }

    console.log('✅ Seed completed successfully');
    console.log('');
    console.log('Demo users:');
    console.log('alice@taskflow-demo.com');
    console.log('bob@taskflow-demo.com');
    console.log('charlie@taskflow-demo.com');
    console.log('david@taskflow-demo.com');
    console.log('eve@taskflow-demo.com');
    console.log('');
    console.log('Password for all demo users: Password123!');
    console.log('');
    console.log('Organizations: 2');
    console.log('Users: 5');
    console.log('Projects: 4');
    console.log('Tasks: 12');
    console.log('Assignments: 7');
    console.log('Comments: 5');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌ Seed failed');
  console.error(error);
  process.exit(1);
});