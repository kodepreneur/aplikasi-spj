import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    loginKey: text("login_key").notNull().unique(),
    role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
    passwordHash: text("password_hash"),
    active: integer("active", { mode: "number" }).notNull().default(1),
    createdAt: text("created_at").notNull(),
    deletedAt: text("deleted_at"),
    photo: text("photo").notNull().default(""),
    themeUnified: text("theme_unified").default("mario"),
    themeSpj: text("theme_spj"),
    themeKontrak: text("theme_kontrak"),
  },
  (table) => [
    uniqueIndex("one_admin").on(table.role).where(sql`${table.role} = 'admin'`),
  ]
);

export const sessions = sqliteTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => accounts.id),
    csrf: text("csrf").notNull(),
    expires: integer("expires", { mode: "number" }).notNull(),
  },
  (table) => [
    index("sessions_user_idx").on(table.userId),
  ]
);

export const documents = sqliteTable(
  "documents",
  {
    rowNo: integer("row_no", { mode: "number" }).primaryKey({ autoIncrement: true }),
    id: text("id").notNull().unique(),
    app: text("app", { enum: ["spj", "kontrak"] }).notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => accounts.id),
    ownerName: text("owner_name").notNull(),
    creationKey: text("creation_key"),
    sourceKey: text("source_key"),
    sourceHash: text("source_hash"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    revision: integer("revision", { mode: "number" }).notNull().default(1),
    payload: text("payload").notNull(), // JSON string
    linkJson: text("link_json"),        // JSON string (Contract snapshot if linked)
    exportedAt: text("exported_at"),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    index("documents_app_idx").on(table.app, table.rowNo),
    index("documents_owner_idx").on(table.app, table.ownerId, table.rowNo),
    uniqueIndex("unique_creation_key").on(table.app, table.ownerId, table.creationKey),
    uniqueIndex("unique_source_key").on(table.app, table.sourceKey),
  ]
);

export const events = sqliteTable(
  "events",
  {
    seq: integer("seq", { mode: "number" }).primaryKey({ autoIncrement: true }),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id),
    action: text("action", { enum: ["created", "edited", "deleted", "imported"] }).notNull(),
    at: text("at").notNull(),
    actorId: text("actor_id").references(() => accounts.id),
    actorName: text("actor_name").notNull(),
    legacy: integer("legacy", { mode: "number" }).notNull().default(0),
  },
  (table) => [
    index("events_document_idx").on(table.documentId, table.action, table.seq),
  ]
);

export const providers = sqliteTable(
  "providers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type", { enum: ["CV", "PT", "UD", "Koperasi", "Perorangan"] }).notNull().default("CV"),
    director: text("director").notNull().default(""),
    address: text("address").notNull().default(""),
    npwp: text("npwp").notNull().default(""),
    phone: text("phone").notNull().default(""),
    position: text("position").notNull().default("DIREKTUR"),
    paymentPosition: text("payment_position").notNull().default("DIREKTUR"),
    bankName: text("bank_name").notNull().default("Bank Jatim"),
    bankAccount: text("bank_account").notNull().default(""),
    active: integer("active", { mode: "number" }).notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    index("providers_name_idx").on(table.name),
  ]
);

export const officials = sqliteTable(
  "officials",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    nip: text("nip").notNull().default(""),
    pangkat: text("pangkat").notNull().default(""),
    role: text("role", {
      enum: ["PA_PPK", "PPTK", "PEJABAT_PENGADAAN", "BENDAHARA", "PENGURUS_ASET", "LAINNYA"],
    }).notNull().default("PA_PPK"),
    positionTitle: text("position_title").notNull().default(""),
    skNumber: text("sk_number").notNull().default(""),
    skDate: text("sk_date").notNull().default(""),
    active: integer("active", { mode: "number" }).notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    index("officials_role_idx").on(table.role),
    index("officials_name_idx").on(table.name),
  ]
);

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;
export type Official = typeof officials.$inferSelect;
export type NewOfficial = typeof officials.$inferInsert;
