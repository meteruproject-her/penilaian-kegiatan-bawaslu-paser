/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Kegiatan Utama (Bawaslu Event Metadata)
export const kegiatanUtama = pgTable("kegiatan_utama", {
  id: serial("id").primaryKey(),
  judul: text("judul").notNull(),
  deskripsi: text("deskripsi"),
  aktif: boolean("aktif").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Sessions (sessions)
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  namaSesi: text("nama_sesi").notNull(),
  isLive: boolean("is_live").default(false).notNull(),
  showPemateri: boolean("show_pemateri").default(true).notNull(),
  showFasilitator: boolean("show_fasilitator").default(true).notNull(),
  showPanitia: boolean("show_panitia").default(true).notNull(),
  showKegiatan: boolean("show_kegiatan").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Speakers (speakers)
export const speakers = pgTable("speakers", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  sessionId: integer("session_id")
    .references(() => sessions.id, { onDelete: "cascade" })
    .notNull(),
});

// 4. Facilitators (facilitators)
export const facilitators = pgTable("facilitators", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  sessionId: integer("session_id")
    .references(() => sessions.id, { onDelete: "cascade" })
    .notNull(),
});

// 5. Evaluation Aspects (evaluation_aspects)
export const evaluationAspects = pgTable("evaluation_aspects", {
  id: serial("id").primaryKey(),
  kategori: text("kategori").notNull(), // 'A', 'B', 'C', 'D'
  noUrut: integer("no_urut").notNull(),
  pertanyaan: text("pertanyaan").notNull(),
});

// 6. Participants (participants)
export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  namaPeserta: text("nama_peserta").notNull(),
  asalInstansi: text("asal_instansi").notNull(), // asal kampus / instansi
  sessionId: integer("session_id").references(() => sessions.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 7. Evaluation Results (evaluation_results)
export const evaluationResults = pgTable("evaluation_results", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id")
    .references(() => participants.id, { onDelete: "cascade" })
    .notNull(),
  sessionId: integer("session_id")
    .references(() => sessions.id, { onDelete: "cascade" })
    .notNull(),
  aspectId: integer("aspect_id")
    .references(() => evaluationAspects.id, { onDelete: "cascade" })
    .notNull(),
  score: integer("score").notNull(), // Likert score 1-5
  saran: text("saran"), // General text feedback
  
  // Specific suggestions for backward compatibility in reporting
  saranPemateri: text("saran_pemateri"),
  saranFasilitator: text("saran_fasilitator"),
  saranPanitia: text("saran_panitia"),
  saranKegiatan: text("saran_kegiatan"),
  tindakLanjut: text("tindak_lanjut"),
  harapan: text("harapan"),
});

// Relations definitions in Drizzle ORM
export const sessionsRelations = relations(sessions, ({ many }) => ({
  speakers: many(speakers),
  facilitators: many(facilitators),
  participants: many(participants),
  evaluationResults: many(evaluationResults),
}));

export const speakersRelations = relations(speakers, ({ one }) => ({
  session: one(sessions, {
    fields: [speakers.sessionId],
    references: [sessions.id],
  }),
}));

export const facilitatorsRelations = relations(facilitators, ({ one }) => ({
  session: one(sessions, {
    fields: [facilitators.sessionId],
    references: [sessions.id],
  }),
}));

export const participantsRelations = relations(participants, ({ one, many }) => ({
  session: one(sessions, {
    fields: [participants.sessionId],
    references: [sessions.id],
  }),
  evaluationResults: many(evaluationResults),
}));

export const evaluationResultsRelations = relations(evaluationResults, ({ one }) => ({
  participant: one(participants, {
    fields: [evaluationResults.participantId],
    references: [participants.id],
  }),
  session: one(sessions, {
    fields: [evaluationResults.sessionId],
    references: [sessions.id],
  }),
  aspect: one(evaluationAspects, {
    fields: [evaluationResults.aspectId],
    references: [evaluationAspects.id],
  }),
}));

// 8. Admin Users (admin_users)
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. Internal Evaluations (internal_evaluations)
export const internalEvaluations = pgTable("internal_evaluations", {
  id: serial("id").primaryKey(),
  planningScore: integer("planning_score").notNull(),
  planningReason: text("planning_reason").default("").notNull(),
  pelaksanaanScore: integer("pelaksanaan_score").notNull(),
  pelaksanaanReason: text("pelaksanaan_reason").default("").notNull(),
  partisipasiScore: integer("partisipasi_score").notNull(),
  partisipasiReason: text("partisipasi_reason").default("").notNull(),
  tanggungJawabScore: integer("tanggung_jawab_score").notNull(),
  tanggungJawabReason: text("tanggung_jawab_reason").default("").notNull(),
  saran: text("saran"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


