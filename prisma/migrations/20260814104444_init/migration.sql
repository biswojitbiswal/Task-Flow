-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('org_admin', 'member');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'review', 'done');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_members" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "role" "OrgRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL,
    "priority" "TaskPriority" NOT NULL,
    "dueAt" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_assignments" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "org_members_organization_id_idx" ON "org_members"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "org_members_user_id_organization_id_key" ON "org_members"("user_id", "organization_id");

-- CreateIndex
CREATE INDEX "projects_organizationId_deleted_at_idx" ON "projects"("organizationId", "deleted_at");

-- CreateIndex
CREATE INDEX "tasks_organizationId_idx" ON "tasks"("organizationId");

-- CreateIndex
CREATE INDEX "tasks_organizationId_projectId_idx" ON "tasks"("organizationId", "projectId");

-- CreateIndex
CREATE INDEX "tasks_organizationId_status_idx" ON "tasks"("organizationId", "status");

-- CreateIndex
CREATE INDEX "tasks_organizationId_priority_idx" ON "tasks"("organizationId", "priority");

-- CreateIndex
CREATE INDEX "tasks_organizationId_dueAt_idx" ON "tasks"("organizationId", "dueAt");

-- CreateIndex
CREATE INDEX "tasks_organizationId_deleted_at_idx" ON "tasks"("organizationId", "deleted_at");

-- CreateIndex
CREATE INDEX "task_assignments_userId_idx" ON "task_assignments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "task_assignments_taskId_userId_key" ON "task_assignments"("taskId", "userId");

-- CreateIndex
CREATE INDEX "comments_taskId_idx" ON "comments"("taskId");

-- CreateIndex
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
