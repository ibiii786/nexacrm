/*
  Warnings:

  - You are about to drop the `group_policies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `policies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `policy_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_policies` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "group_policies" DROP CONSTRAINT "group_policies_group_id_fkey";

-- DropForeignKey
ALTER TABLE "group_policies" DROP CONSTRAINT "group_policies_policy_id_fkey";

-- DropForeignKey
ALTER TABLE "policies" DROP CONSTRAINT "policies_created_by_fkey";

-- DropForeignKey
ALTER TABLE "policy_permissions" DROP CONSTRAINT "policy_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "policy_permissions" DROP CONSTRAINT "policy_permissions_policy_id_fkey";

-- DropForeignKey
ALTER TABLE "user_policies" DROP CONSTRAINT "user_policies_granted_by_fkey";

-- DropForeignKey
ALTER TABLE "user_policies" DROP CONSTRAINT "user_policies_policy_id_fkey";

-- DropForeignKey
ALTER TABLE "user_policies" DROP CONSTRAINT "user_policies_user_id_fkey";

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "expires_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "fields" ADD COLUMN     "copy_position" INTEGER,
ADD COLUMN     "is_archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_copyable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "statuses" ADD COLUMN     "deleted_at" TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "reset_token" VARCHAR,
ADD COLUMN     "reset_token_exp" TIMESTAMPTZ;

-- DropTable
DROP TABLE "group_policies";

-- DropTable
DROP TABLE "policies";

-- DropTable
DROP TABLE "policy_permissions";

-- DropTable
DROP TABLE "user_policies";

-- CreateTable
CREATE TABLE "group_permissions" (
    "group_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "added_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_permissions_pkey" PRIMARY KEY ("group_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "granted_by" UUID,
    "granted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "action" VARCHAR NOT NULL,
    "entity" VARCHAR NOT NULL,
    "entity_id" VARCHAR,
    "actor_id" UUID,
    "details" JSONB,
    "ip_address" VARCHAR,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "group_permissions" ADD CONSTRAINT "group_permissions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_permissions" ADD CONSTRAINT "group_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
