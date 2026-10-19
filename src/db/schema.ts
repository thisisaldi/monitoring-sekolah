/**
 * Database schema, per docs/design/DATABASE-SCHEMA.md.
 *
 * Table and column names mirror the original Django schema so existing data
 * can be copied across table-for-table. Business rules that the database can
 * enforce (uniqueness per period, non-negative amounts, completed findings
 * need a completed date) live here as constraints, not only in app code.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

const money = (name: string) => numeric(name, { precision: 18, scale: 2 });
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
const fk = (name: string) => bigint(name, { mode: "number" });

export const BRANCH_TYPES = ["CABANG", "PERWAKILAN", "PP"] as const;
export type BranchType = (typeof BRANCH_TYPES)[number];

/** ADMIN = Pusat + system administration (users, branches). */
export const ROLES = ["ADMIN", "CENTRAL", "BRANCH"] as const;
export type Role = (typeof ROLES)[number];

export const REPORT_STATUSES = ["COMPLETE", "INCOMPLETE"] as const;
export const FINDING_STATUSES = ["OPEN", "ON_PROGRESS", "COMPLETED"] as const;

/** Cabang, Perwakilan and PP are peers; each manages many schools. */
export const branches = pgTable("branches", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  type: varchar("type", { length: 20, enum: BRANCH_TYPES }).notNull().default("CABANG"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const users = pgTable(
  "users",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    username: varchar("username", { length: 150 }).notNull().unique(),
    // Django-compatible "pbkdf2_sha256$<iter>$<salt>$<hash>".
    password: varchar("password", { length: 128 }).notNull(),
    role: varchar("role", { length: 20, enum: ROLES }).notNull(),
    branchId: fk("branch_id").references(() => branches.id, { onDelete: "restrict" }),
    isActive: boolean("is_active").notNull().default(true),
    lastLogin: timestamp("last_login", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("user_role_valid", sql`${t.role} in ('ADMIN', 'CENTRAL', 'BRANCH')`),
    // BRANCH users need a branch; ADMIN and CENTRAL users must not have one.
    check("user_role_branch_consistent", sql`(${t.role} = 'BRANCH') = (${t.branchId} is not null)`),
  ],
);

export const sessions = pgTable(
  "app_sessions",
  {
    // sha256 of the cookie token; the raw token is never stored.
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: fk("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("app_sessions_user_idx").on(t.userId)],
);

export const schools = pgTable(
  "schools",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    branchId: fk("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "restrict" }),
    code: varchar("code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    educationLevel: varchar("education_level", { length: 50 }),
    principalName: varchar("principal_name", { length: 150 }),
    treasurerName: varchar("treasurer_name", { length: 150 }),
    studentCount: integer("student_count"),
    note: text("note"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("schools_branch_idx").on(t.branchId),
    check("school_student_count_non_negative", sql`${t.studentCount} is null or ${t.studentCount} >= 0`),
  ],
);

/** Global master data: every school reports against the same budget years. */
export const budgetYears = pgTable(
  "budget_years",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    name: varchar("name", { length: 50 }).notNull().unique(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [check("budget_year_start_before_end", sql`${t.startDate} < ${t.endDate}`)],
);

const audit = () => ({
  createdAt: createdAt(),
  createdBy: fk("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  updatedAt: updatedAt(),
  updatedBy: fk("updated_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
});

const schoolRef = () =>
  fk("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "restrict" });
const budgetYearRef = () =>
  fk("budget_year_id")
    .notNull()
    .references(() => budgetYears.id, { onDelete: "restrict" });

export const rkas = pgTable(
  "rkas",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    schoolId: schoolRef(),
    budgetYearId: budgetYearRef(),
    initialAmount: money("initial_amount").notNull(),
    initialApprovalDate: date("initial_approval_date"),
    majorChangeDescription: text("major_change_description"),
    ...audit(),
  },
  (t) => [
    unique("rkas_unique_school_budget_year").on(t.schoolId, t.budgetYearId),
    check("rkas_initial_amount_non_negative", sql`${t.initialAmount} >= 0`),
  ],
);

/** Append-only: corrected by adding a new revision, never by editing one. */
export const rkasRevisions = pgTable(
  "rkas_revisions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    rkasId: fk("rkas_id")
      .notNull()
      .references(() => rkas.id, { onDelete: "restrict" }),
    revisionNumber: integer("revision_number").notNull(),
    amount: money("amount").notNull(),
    revisionDate: date("revision_date").notNull(),
    changeDescription: text("change_description"),
    createdAt: createdAt(),
    createdBy: fk("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
  },
  (t) => [
    unique("rkas_revision_unique_number").on(t.rkasId, t.revisionNumber),
    check("rkas_revision_number_min_1", sql`${t.revisionNumber} >= 1`),
    check("rkas_revision_amount_non_negative", sql`${t.amount} >= 0`),
  ],
);

export const monthlyRealizations = pgTable(
  "monthly_realizations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    schoolId: schoolRef(),
    budgetYearId: budgetYearRef(),
    month: smallint("month").notNull(),
    budgetAmount: money("budget_amount").notNull(),
    realizationAmount: money("realization_amount").notNull(),
    varianceExplanation: text("variance_explanation"),
    reportStatus: varchar("report_status", { length: 20, enum: REPORT_STATUSES }).notNull(),
    ...audit(),
  },
  (t) => [
    unique("monthly_realization_unique_period").on(t.schoolId, t.budgetYearId, t.month),
    check("monthly_realization_month_range", sql`${t.month} between 1 and 12`),
    check("monthly_realization_budget_non_negative", sql`${t.budgetAmount} >= 0`),
    check("monthly_realization_amount_non_negative", sql`${t.realizationAmount} >= 0`),
  ],
);

export const semesterRealizations = pgTable(
  "semester_realizations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    schoolId: schoolRef(),
    budgetYearId: budgetYearRef(),
    semester: smallint("semester").notNull(),
    realizationAmount: money("realization_amount").notNull(),
    evaluationNote: text("evaluation_note"),
    ...audit(),
  },
  (t) => [
    unique("semester_realization_unique_period").on(t.schoolId, t.budgetYearId, t.semester),
    check("semester_realization_semester_in_1_2", sql`${t.semester} in (1, 2)`),
    check("semester_realization_amount_non_negative", sql`${t.realizationAmount} >= 0`),
  ],
);

export const bosRecords = pgTable(
  "bos_records",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    schoolId: schoolRef(),
    budgetYearId: budgetYearRef(),
    openingBalance: money("opening_balance").notNull(),
    receiptAmount: money("receipt_amount").notNull(),
    usageAmount: money("usage_amount").notNull(),
    rkasCompliance: boolean("rkas_compliance"),
    reportStatus: varchar("report_status", { length: 20, enum: REPORT_STATUSES }).notNull(),
    notes: text("notes"),
    ...audit(),
  },
  (t) => [
    unique("bos_record_unique_school_budget_year").on(t.schoolId, t.budgetYearId),
    check("bos_opening_balance_non_negative", sql`${t.openingBalance} >= 0`),
    check("bos_receipt_amount_non_negative", sql`${t.receiptAmount} >= 0`),
    check("bos_usage_amount_non_negative", sql`${t.usageAmount} >= 0`),
  ],
);

export const receivables = pgTable(
  "receivables",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    schoolId: schoolRef(),
    budgetYearId: budgetYearRef(),
    openingBalance: money("opening_balance").notNull(),
    additionAmount: money("addition_amount").notNull(),
    settlementAmount: money("settlement_amount").notNull(),
    dominantAge: varchar("dominant_age", { length: 100 }),
    followUp: text("follow_up"),
    ...audit(),
  },
  (t) => [
    unique("receivable_unique_school_budget_year").on(t.schoolId, t.budgetYearId),
    check("receivable_opening_balance_non_negative", sql`${t.openingBalance} >= 0`),
    check("receivable_addition_amount_non_negative", sql`${t.additionAmount} >= 0`),
    check("receivable_settlement_amount_non_negative", sql`${t.settlementAmount} >= 0`),
  ],
);

export const reconciliations = pgTable(
  "reconciliations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    schoolId: schoolRef(),
    budgetYearId: budgetYearRef(),
    // No non-negativity constraint documented for these two balances.
    financialStatementBalance: money("financial_statement_balance").notNull(),
    bankBalance: money("bank_balance").notNull(),
    rkasCompliance: boolean("rkas_compliance"),
    notes: text("notes"),
    followUp: text("follow_up"),
    ...audit(),
  },
  (t) => [unique("reconciliation_unique_school_budget_year").on(t.schoolId, t.budgetYearId)],
);

export const AUDIT_ACTIONS = ["CREATE", "UPDATE", "ACTIVATE", "DEACTIVATE", "PASSWORD", "LOGIN"] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/**
 * Append-only activity history, viewable by ADMIN and CENTRAL. Written in the
 * same transaction as the change it describes. Never stores password values.
 */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    createdAt: createdAt(),
    userId: fk("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    action: varchar("action", { length: 20, enum: AUDIT_ACTIONS }).notNull(),
    entity: varchar("entity", { length: 40 }).notNull(),
    entityId: fk("entity_id"),
    label: text("label").notNull(),
    /** Set for school-level records, so the log can be filtered per school. */
    schoolId: fk("school_id").references(() => schools.id, { onDelete: "restrict" }),
    /** { field: [old, new] }; old is null on CREATE. */
    changes: jsonb("changes").$type<Record<string, [unknown, unknown]>>(),
  },
  (t) => [
    index("audit_logs_created_at_idx").on(t.createdAt),
    index("audit_logs_entity_idx").on(t.entity, t.entityId),
  ],
);

export const findings = pgTable(
  "findings",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    schoolId: schoolRef(),
    findingDate: date("finding_date").notNull(),
    source: varchar("source", { length: 150 }).notNull(),
    finding: text("finding").notNull(),
    amount: money("amount"),
    risk: varchar("risk", { length: 50 }),
    recommendation: text("recommendation").notNull(),
    pic: varchar("pic", { length: 150 }).notNull(),
    deadline: date("deadline").notNull(),
    status: varchar("status", { length: 20, enum: FINDING_STATUSES }).notNull(),
    completedDate: date("completed_date"),
    ...audit(),
  },
  (t) => [
    check("finding_amount_non_negative", sql`${t.amount} is null or ${t.amount} >= 0`),
    // OBD-007: COMPLETED requires completed_date; otherwise it stays empty.
    check(
      "finding_completed_date_matches_status",
      sql`(${t.status} = 'COMPLETED') = (${t.completedDate} is not null)`,
    ),
  ],
);
