ALTER TABLE "users" DROP CONSTRAINT "user_role_valid";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "user_role_branch_consistent";--> statement-breakpoint
-- Hand-added: existing system administrators (is_staff) become role ADMIN.
UPDATE "users" SET "role" = 'ADMIN' WHERE "is_staff";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "is_staff";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "user_role_valid" CHECK ("users"."role" in ('ADMIN', 'CENTRAL', 'BRANCH'));--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "user_role_branch_consistent" CHECK (("users"."role" = 'BRANCH') = ("users"."branch_id" is not null));