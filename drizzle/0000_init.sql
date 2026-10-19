CREATE TABLE "bos_records" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"school_id" bigint NOT NULL,
	"budget_year_id" bigint NOT NULL,
	"opening_balance" numeric(18, 2) NOT NULL,
	"receipt_amount" numeric(18, 2) NOT NULL,
	"usage_amount" numeric(18, 2) NOT NULL,
	"rkas_compliance" boolean,
	"report_status" varchar(20) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_id" bigint NOT NULL,
	CONSTRAINT "bos_record_unique_school_budget_year" UNIQUE("school_id","budget_year_id"),
	CONSTRAINT "bos_opening_balance_non_negative" CHECK ("bos_records"."opening_balance" >= 0),
	CONSTRAINT "bos_receipt_amount_non_negative" CHECK ("bos_records"."receipt_amount" >= 0),
	CONSTRAINT "bos_usage_amount_non_negative" CHECK ("bos_records"."usage_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"type" varchar(20) DEFAULT 'CABANG' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "branches_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "budget_years" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "budget_years_name_unique" UNIQUE("name"),
	CONSTRAINT "budget_year_start_before_end" CHECK ("budget_years"."start_date" < "budget_years"."end_date")
);
--> statement-breakpoint
CREATE TABLE "findings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"school_id" bigint NOT NULL,
	"finding_date" date NOT NULL,
	"source" varchar(150) NOT NULL,
	"finding" text NOT NULL,
	"amount" numeric(18, 2),
	"risk" varchar(50),
	"recommendation" text NOT NULL,
	"pic" varchar(150) NOT NULL,
	"deadline" date NOT NULL,
	"status" varchar(20) NOT NULL,
	"completed_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_id" bigint NOT NULL,
	CONSTRAINT "finding_amount_non_negative" CHECK ("findings"."amount" is null or "findings"."amount" >= 0),
	CONSTRAINT "finding_completed_date_matches_status" CHECK (("findings"."status" = 'COMPLETED') = ("findings"."completed_date" is not null))
);
--> statement-breakpoint
CREATE TABLE "monthly_realizations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"school_id" bigint NOT NULL,
	"budget_year_id" bigint NOT NULL,
	"month" smallint NOT NULL,
	"budget_amount" numeric(18, 2) NOT NULL,
	"realization_amount" numeric(18, 2) NOT NULL,
	"variance_explanation" text,
	"report_status" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_id" bigint NOT NULL,
	CONSTRAINT "monthly_realization_unique_period" UNIQUE("school_id","budget_year_id","month"),
	CONSTRAINT "monthly_realization_month_range" CHECK ("monthly_realizations"."month" between 1 and 12),
	CONSTRAINT "monthly_realization_budget_non_negative" CHECK ("monthly_realizations"."budget_amount" >= 0),
	CONSTRAINT "monthly_realization_amount_non_negative" CHECK ("monthly_realizations"."realization_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "receivables" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"school_id" bigint NOT NULL,
	"budget_year_id" bigint NOT NULL,
	"opening_balance" numeric(18, 2) NOT NULL,
	"addition_amount" numeric(18, 2) NOT NULL,
	"settlement_amount" numeric(18, 2) NOT NULL,
	"dominant_age" varchar(100),
	"follow_up" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_id" bigint NOT NULL,
	CONSTRAINT "receivable_unique_school_budget_year" UNIQUE("school_id","budget_year_id"),
	CONSTRAINT "receivable_opening_balance_non_negative" CHECK ("receivables"."opening_balance" >= 0),
	CONSTRAINT "receivable_addition_amount_non_negative" CHECK ("receivables"."addition_amount" >= 0),
	CONSTRAINT "receivable_settlement_amount_non_negative" CHECK ("receivables"."settlement_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "reconciliations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"school_id" bigint NOT NULL,
	"budget_year_id" bigint NOT NULL,
	"financial_statement_balance" numeric(18, 2) NOT NULL,
	"bank_balance" numeric(18, 2) NOT NULL,
	"rkas_compliance" boolean,
	"notes" text,
	"follow_up" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_id" bigint NOT NULL,
	CONSTRAINT "reconciliation_unique_school_budget_year" UNIQUE("school_id","budget_year_id")
);
--> statement-breakpoint
CREATE TABLE "rkas" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"school_id" bigint NOT NULL,
	"budget_year_id" bigint NOT NULL,
	"initial_amount" numeric(18, 2) NOT NULL,
	"initial_approval_date" date,
	"major_change_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_id" bigint NOT NULL,
	CONSTRAINT "rkas_unique_school_budget_year" UNIQUE("school_id","budget_year_id"),
	CONSTRAINT "rkas_initial_amount_non_negative" CHECK ("rkas"."initial_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "rkas_revisions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"rkas_id" bigint NOT NULL,
	"revision_number" integer NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"revision_date" date NOT NULL,
	"change_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" bigint NOT NULL,
	CONSTRAINT "rkas_revision_unique_number" UNIQUE("rkas_id","revision_number"),
	CONSTRAINT "rkas_revision_number_min_1" CHECK ("rkas_revisions"."revision_number" >= 1),
	CONSTRAINT "rkas_revision_amount_non_negative" CHECK ("rkas_revisions"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"branch_id" bigint NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"education_level" varchar(50),
	"principal_name" varchar(150),
	"treasurer_name" varchar(150),
	"student_count" integer,
	"note" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schools_code_unique" UNIQUE("code"),
	CONSTRAINT "school_student_count_non_negative" CHECK ("schools"."student_count" is null or "schools"."student_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "semester_realizations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"school_id" bigint NOT NULL,
	"budget_year_id" bigint NOT NULL,
	"semester" smallint NOT NULL,
	"realization_amount" numeric(18, 2) NOT NULL,
	"evaluation_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_id" bigint NOT NULL,
	CONSTRAINT "semester_realization_unique_period" UNIQUE("school_id","budget_year_id","semester"),
	CONSTRAINT "semester_realization_semester_in_1_2" CHECK ("semester_realizations"."semester" in (1, 2)),
	CONSTRAINT "semester_realization_amount_non_negative" CHECK ("semester_realizations"."realization_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "app_sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"username" varchar(150) NOT NULL,
	"password" varchar(128) NOT NULL,
	"role" varchar(20) NOT NULL,
	"branch_id" bigint,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_staff" boolean DEFAULT false NOT NULL,
	"last_login" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "user_role_valid" CHECK ("users"."role" in ('CENTRAL', 'BRANCH')),
	CONSTRAINT "user_role_branch_consistent" CHECK (("users"."role" = 'BRANCH' and "users"."branch_id" is not null) or ("users"."role" = 'CENTRAL' and "users"."branch_id" is null))
);
--> statement-breakpoint
ALTER TABLE "bos_records" ADD CONSTRAINT "bos_records_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bos_records" ADD CONSTRAINT "bos_records_budget_year_id_budget_years_id_fk" FOREIGN KEY ("budget_year_id") REFERENCES "public"."budget_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bos_records" ADD CONSTRAINT "bos_records_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bos_records" ADD CONSTRAINT "bos_records_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_realizations" ADD CONSTRAINT "monthly_realizations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_realizations" ADD CONSTRAINT "monthly_realizations_budget_year_id_budget_years_id_fk" FOREIGN KEY ("budget_year_id") REFERENCES "public"."budget_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_realizations" ADD CONSTRAINT "monthly_realizations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_realizations" ADD CONSTRAINT "monthly_realizations_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_budget_year_id_budget_years_id_fk" FOREIGN KEY ("budget_year_id") REFERENCES "public"."budget_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_budget_year_id_budget_years_id_fk" FOREIGN KEY ("budget_year_id") REFERENCES "public"."budget_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rkas" ADD CONSTRAINT "rkas_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rkas" ADD CONSTRAINT "rkas_budget_year_id_budget_years_id_fk" FOREIGN KEY ("budget_year_id") REFERENCES "public"."budget_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rkas" ADD CONSTRAINT "rkas_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rkas" ADD CONSTRAINT "rkas_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rkas_revisions" ADD CONSTRAINT "rkas_revisions_rkas_id_rkas_id_fk" FOREIGN KEY ("rkas_id") REFERENCES "public"."rkas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rkas_revisions" ADD CONSTRAINT "rkas_revisions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_realizations" ADD CONSTRAINT "semester_realizations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_realizations" ADD CONSTRAINT "semester_realizations_budget_year_id_budget_years_id_fk" FOREIGN KEY ("budget_year_id") REFERENCES "public"."budget_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_realizations" ADD CONSTRAINT "semester_realizations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_realizations" ADD CONSTRAINT "semester_realizations_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_sessions" ADD CONSTRAINT "app_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "schools_branch_idx" ON "schools" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "app_sessions_user_idx" ON "app_sessions" USING btree ("user_id");