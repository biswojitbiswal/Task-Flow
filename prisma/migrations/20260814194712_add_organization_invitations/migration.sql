-- CreateTable
CREATE TABLE "organization_invitations" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "role" "OrgRole" NOT NULL DEFAULT 'member',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organization_invitations_organization_id_idx" ON "organization_invitations"("organization_id");

-- CreateIndex
CREATE INDEX "organization_invitations_email_idx" ON "organization_invitations"("email");

-- AddForeignKey
ALTER TABLE "organization_invitations" ADD CONSTRAINT "organization_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
