/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { count, eq } from "drizzle-orm";
import * as schema from "./schema.js";
import crypto from "crypto";

const { Pool } = pg;

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const pghost = process.env.PGHOST || "36.50.77.214";
const pgport = parseInt(process.env.PGPORT || "5432", 10);
const pguser = process.env.PGUSER || "admin_bawaslu";
const pgpassword = process.env.PGPASSWORD || "P4ssw0rd**";
const pgdatabase = process.env.PGDATABASE || "db_bawaslu";

// Koneksi stabil Pool pg
const pool = new Pool({
  host: pghost,
  port: pgport,
  user: pguser,
  password: pgpassword,
  database: pgdatabase,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Kesalahan tak terduga pada pool database PostgreSQL:", err);
});

// Inisialisasi Klien Drizzle ORM dengan relasi dari skema
export const db = drizzle(pool, { schema });
export { pool };

/**
 * Rutin Inisialisasi & Seeding Database Bawaslu Paser menggunakan Drizzle ORM
 */
export async function initializeDatabase() {
  console.log("Memulai pemeriksaan dan seeder data awal menggunakan Drizzle ORM...");
  
  let retries = 10;
  while (retries > 0) {
    try {
      await pool.query("SELECT 1;");
      console.log("Koneksi database PostgreSQL berhasil!");
      break;
    } catch (err: any) {
      retries--;
      console.warn(`Menunggu PostgreSQL siap (${retries} percobaan tersisa)... error: ${err.message}`);
      if (retries === 0) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  try {
    // Jalankan rekonstruksi DDL mentah jika tabel belum ada untuk menghindari isu TTY drizzle-kit push
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "kegiatan_utama" (
        "id" SERIAL PRIMARY KEY,
        "judul" TEXT NOT NULL,
        "deskripsi" TEXT,
        "aktif" BOOLEAN DEFAULT true NOT NULL,
        "created_at" TIMESTAMP DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" SERIAL PRIMARY KEY,
        "nama_sesi" TEXT NOT NULL,
        "is_live" BOOLEAN DEFAULT false NOT NULL,
        "show_pemateri" BOOLEAN DEFAULT true NOT NULL,
        "show_fasilitator" BOOLEAN DEFAULT true NOT NULL,
        "show_panitia" BOOLEAN DEFAULT true NOT NULL,
        "show_kegiatan" BOOLEAN DEFAULT true NOT NULL,
        "created_at" TIMESTAMP DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "speakers" (
        "id" SERIAL PRIMARY KEY,
        "nama" TEXT NOT NULL,
        "session_id" INTEGER NOT NULL REFERENCES "sessions" ("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "facilitators" (
        "id" SERIAL PRIMARY KEY,
        "nama" TEXT NOT NULL,
        "session_id" INTEGER NOT NULL REFERENCES "sessions" ("id") ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "evaluation_aspects" (
        "id" SERIAL PRIMARY KEY,
        "kategori" TEXT NOT NULL,
        "no_urut" INTEGER NOT NULL,
        "pertanyaan" TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "participants" (
        "id" SERIAL PRIMARY KEY,
        "nama_peserta" TEXT NOT NULL,
        "asal_instansi" TEXT NOT NULL,
        "session_id" INTEGER REFERENCES "sessions" ("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "evaluation_results" (
        "id" SERIAL PRIMARY KEY,
        "participant_id" INTEGER NOT NULL REFERENCES "participants" ("id") ON DELETE CASCADE,
        "session_id" INTEGER NOT NULL REFERENCES "sessions" ("id") ON DELETE CASCADE,
        "aspect_id" INTEGER NOT NULL REFERENCES "evaluation_aspects" ("id") ON DELETE CASCADE,
        "score" INTEGER NOT NULL,
        "saran" TEXT,
        "saran_pemateri" TEXT,
        "saran_fasilitator" TEXT,
        "saran_panitia" TEXT,
        "saran_kegiatan" TEXT,
        "tindak_lanjut" TEXT,
        "harapan" TEXT
      );

      CREATE TABLE IF NOT EXISTS "admin_users" (
        "id" SERIAL PRIMARY KEY,
        "username" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "full_name" TEXT NOT NULL,
        "created_at" TIMESTAMP DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "internal_evaluations" (
        "id" SERIAL PRIMARY KEY,
        "planning_score" INTEGER NOT NULL,
        "pelaksanaan_score" INTEGER NOT NULL,
        "partisipasi_score" INTEGER NOT NULL,
        "tanggung_jawab_score" INTEGER NOT NULL,
        "saran" TEXT,
        "created_at" TIMESTAMP DEFAULT now() NOT NULL
      );
    `);
    console.log("DDL Migrasi Sukses / Seluruh tabel Bawaslu tersedia.");

    // Seeding Admin Utama if empty
    const resAdmins = await db.select({ value: count() }).from(schema.adminUsers);
    if (resAdmins[0].value === 0) {
      await db.insert(schema.adminUsers).values({
        id: 1,
        username: "admin",
        password: hashPassword("bawaslu123"), // hashed default admin password
        fullName: "Admin Utama Bawaslu"
      }).onConflictDoNothing();
      console.log("Seeding default admin user sukses.");
    } else {
      // Migrasi password plain text yang tersisa di database
      const currentAdmins = await db.select().from(schema.adminUsers);
      for (const u of currentAdmins) {
        if (u.password && u.password.length < 64) {
          await db.update(schema.adminUsers)
            .set({ password: hashPassword(u.password) })
            .where(eq(schema.adminUsers.id, u.id));
          console.log(`Migrasi password admin: ${u.username} berhasil dienkripsi.`);
        }
      }
    }

    // 1. Seed Kegiatan Utama jika kosong
    const resKeg = await db.select({ value: count() }).from(schema.kegiatanUtama);
    if (resKeg[0].value === 0) {
      await db.insert(schema.kegiatanUtama).values({
        id: 1,
        judul: "Pendidikan Pengawas Partisipatif Angkatan 2026",
        deskripsi: "Pelatihan intensif tingkat kabupaten untuk kader pengawasan pemilu partisipatif di Kabupaten Bawaslu Paser.",
        aktif: true,
      }).onConflictDoNothing();
      console.log("Seeding data kegiatan_utama sukses.");
    }

    // 2. Seed Sesi Kuesioner beserta Speakers & Facilitators jika kosong
    const resSesi = await db.select({ value: count() }).from(schema.sessions);
    if (resSesi[0].value === 0) {
      // Sesi 1
      await db.insert(schema.sessions).values({
        id: 1,
        namaSesi: "Sesi 1 (Kebijakan Pengawasan Pemilu & Strategi Partisipatif)",
        isLive: true,
        showPemateri: true,
        showFasilitator: true,
        showPanitia: true,
        showKegiatan: false,
      }).onConflictDoNothing();

      await db.insert(schema.speakers).values({
        id: 1,
        nama: "Drs. H. Syahrul, M.Si",
        sessionId: 1,
      }).onConflictDoNothing();

      await db.insert(schema.facilitators).values({
        id: 1,
        nama: "Ahmad Gazali, S.E",
        sessionId: 1,
      }).onConflictDoNothing();

      // Sesi 2
      await db.insert(schema.sessions).values({
        id: 2,
        namaSesi: "Sesi 2 (Tata Cara Pelaporan Serta Investigasi Lapangan)",
        isLive: false,
        showPemateri: true,
        showFasilitator: true,
        showPanitia: false,
        showKegiatan: false,
      }).onConflictDoNothing();

      await db.insert(schema.speakers).values({
        id: 2,
        nama: "Farida Ariyani, S.H, M.H",
        sessionId: 2,
      }).onConflictDoNothing();

      await db.insert(schema.facilitators).values({
        id: 2,
        nama: "Ratna Rosilawati",
        sessionId: 2,
      }).onConflictDoNothing();

      // Sesi 3
      await db.insert(schema.sessions).values({
        id: 3,
        namaSesi: "Sesi 3 (Rencana Tindak Lanjut & Evaluasi Akhir)",
        isLive: false,
        showPemateri: true,
        showFasilitator: true,
        showPanitia: false,
        showKegiatan: true,
      }).onConflictDoNothing();

      await db.insert(schema.speakers).values({
        id: 3,
        nama: "Budi Utomo, M.IP",
        sessionId: 3,
      }).onConflictDoNothing();

      await db.insert(schema.facilitators).values({
        id: 3,
        nama: "Nurul Hikmah, S.Pt",
        sessionId: 3,
      }).onConflictDoNothing();

      console.log("Seeding data sessions, speakers, dan facilitators selesai.");
    }

    // 3. Seed/Update Aspek Penilaian default dengan UPSERT agar selalu sinkron dengan versi terbaru
    const defaultAspects = [
      // Pemateri (A)
      { id: 1, kategori: "A", noUrut: 1, pertanyaan: "Penguasaan materi dan kedalaman pemaparan sesuai dengan tema kegiatan" },
      { id: 2, kategori: "A", noUrut: 2, pertanyaan: "Kemampuan menyampaikan materi secara sistematis, jelas, dan mudah dipahami" },
      { id: 3, kategori: "A", noUrut: 3, pertanyaan: "Penggunaan metode dan media pembelajaran yang tepat dan menarik" },
      { id: 4, kategori: "A", noUrut: 4, pertanyaan: "Kemampuan memberikan jawaban/penjelasan atas pertanyaan peserta secara memuaskan" },
      { id: 5, kategori: "A", noUrut: 5, pertanyaan: "Sikap, tutur kata, dan interaksi dengan peserta selama penyampaian materi" },
      { id: 6, kategori: "A", noUrut: 6, pertanyaan: "Relevansi materi yang disampaikan dengan kebutuhan dan konteks pengawasan partisipatif" },

      // Fasilitator (B)
      { id: 7, kategori: "B", noUrut: 1, pertanyaan: "Kemampuan memandu sesi diskusi dan tanya jawab secara efektif dan kondusif" },
      { id: 8, kategori: "B", noUrut: 2, pertanyaan: "Kecakapan membangun suasana belajar yang aktif, interaktif, dan partisipatif" },
      { id: 9, kategori: "B", noUrut: 3, pertanyaan: "Penguasaan alur kegiatan and kemampuan mengelola waktu dengan baik" },
      { id: 10, kategori: "B", noUrut: 4, pertanyaan: "Kemampuan menyimpulkan dan menyampaikan poin-poin penting secara ringkas" },
      { id: 11, kategori: "B", noUrut: 5, pertanyaan: "Sikap, penampilan, dan kemampuan komunikasi fasilitator terhadap peserta" },

      // Panitia (C)
      { id: 12, kategori: "C", noUrut: 1, pertanyaan: "Kecepatan dan kemudahan proses pendaftaran/registrasi peserta kegiatan" },
      { id: 13, kategori: "C", noUrut: 2, pertanyaan: "Kelengkapan dan kesiapan perlengkapan serta bahan yang diberikan kepada peserta" },
      { id: 14, kategori: "C", noUrut: 3, pertanyaan: "Kenyamanan, kebersihan, dan kecukupan kapasitas ruangan kegiatan" },
      { id: 15, kategori: "C", noUrut: 4, pertanyaan: "Ketersediaan dan kelayakan konsumsi yang disediakan bagi peserta" },
      { id: 16, kategori: "C", noUrut: 5, pertanyaan: "Ketepatan waktu pelaksanaan seluruh rangkaian kegiatan sesuai jadwal" },
      { id: 17, kategori: "C", noUrut: 6, pertanyaan: "Keramahan, responsivitas, dan profesionalisme panitia dalam melayani peserta" },

      // Kegiatan (D)
      { id: 18, kategori: "D", noUrut: 1, pertanyaan: "Manfaat kegiatan ini bagi peningkatan kapasitas pengawas partisipatif" },
      { id: 19, kategori: "D", noUrut: 2, pertanyaan: "Kesesuaian kegiatan ini dengan kebutuhan dan harapan peserta" },
      { id: 20, kategori: "D", noUrut: 3, pertanyaan: "Kepuasan Saudara/i secara keseluruhan terhadap penyelenggaraan kegiatan" },
    ];

    for (const asp of defaultAspects) {
      await db.insert(schema.evaluationAspects).values(asp).onConflictDoUpdate({
        target: schema.evaluationAspects.id,
        set: {
          kategori: asp.kategori,
          noUrut: asp.noUrut,
          pertanyaan: asp.pertanyaan
        }
      });
    }
    console.log("Sinkronisasi data evaluation_aspects selesai.");

    console.log("Database PostgreSQL Drizzle ORM berhasil diinisialisasi!");
  } catch (err) {
    console.error("Gagal melakukan inisialisasi awal database via Drizzle ORM:", err);
  }
}
