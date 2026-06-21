/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { db, initializeDatabase, hashPassword } from "./src/db/connect.js";
import * as schema from "./src/db/schema.js";
import { eq, and, avg, count, sql, inArray, desc } from "drizzle-orm";
import { 
  KegiatanUtama, 
  Sesi, 
  AspekPenilaian, 
  PesertaEvaluasi, 
  PenilaianDetail, 
  SaranMasukan,
  FeedbackItem,
  RekapitulasiDashboard,
  ChartDataPoints
} from "./src/types.js";

// Get __filename and __dirname safely across ESM and CJS environments
const [__filenameResolved, __dirnameResolved] = (() => {
  const isEsm = typeof import.meta !== "undefined" && !!import.meta.url;
  const fName = isEsm ? fileURLToPath(import.meta.url) : (typeof __filename !== "undefined" ? __filename : "");
  const dName = isEsm ? path.dirname(fName) : (typeof __dirname !== "undefined" ? __dirname : "");
  return [fName, dName];
})();
const __filename = __filenameResolved;
const __dirname = __dirnameResolved;

const app = express();
const PORT = 3000;

app.use(express.json());

// Inisialisasi Database PostgreSQL saat server dinyalakan
initializeDatabase().then(() => {
  console.log("Database inisialisasi sukses!");
}).catch((err) => {
  console.error("Gagal melakukan inisialisasi awal database database:", err);
});

// --- ADMIN AUTHENTICATION ---
// Otentikasi admin berbasis database tabel admin_users
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const users = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.username, username))
      .limit(1);

    if (users.length > 0 && users[0].password === hashPassword(password)) {
      res.json({ 
        success: true, 
        token: `bawaslu-paser-secure-token-${users[0].id}`, 
        message: "Login berhasil",
        fullName: users[0].fullName 
      });
    } else {
      res.status(401).json({ success: false, message: "Username atau kata sandi admin salah" });
    }
  } catch (error: any) {
    console.error("Error POST /api/admin/login:", error);
    res.status(500).json({ success: false, message: error.message || "Kesalahan database login" });
  }
});

// --- API USER ADMIN CRUD ---
app.get("/api/admin/users", async (req, res) => {
  try {
    const list = await db
      .select({
        id: schema.adminUsers.id,
        username: schema.adminUsers.username,
        password: schema.adminUsers.password,
        fullName: schema.adminUsers.fullName,
        createdAt: schema.adminUsers.createdAt,
      })
      .from(schema.adminUsers)
      .orderBy(schema.adminUsers.id);
    res.json(list);
  } catch (error: any) {
    console.error("Error GET /api/admin/users:", error);
    res.status(500).json({ error: error.message || "Gagal mengambil data user admin" });
  }
});

app.post("/api/admin/users", async (req, res) => {
  const { username, password, fullName } = req.body;
  if (!username || !password || !fullName) {
    return res.status(400).json({ error: "Kolom Username, Password, dan Nama Lengkap wajib diisi" });
  }
  try {
    // Cek username duplikat
    const existing = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.username, username))
      .limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Username sudah digunakan oleh admin lain" });
    }

    const inserted = await db
      .insert(schema.adminUsers)
      .values({
        username,
        password: hashPassword(password),
        fullName,
      })
      .returning();
    res.json({ success: true, user: inserted[0] });
  } catch (error: any) {
    console.error("Error POST /api/admin/users:", error);
    res.status(500).json({ error: error.message || "Gagal menyimpan user admin baru" });
  }
});

app.put("/api/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  const { username, password, fullName } = req.body;
  if (!username || !fullName) {
    return res.status(400).json({ error: "Kolom Username dan Nama Lengkap wajib diisi" });
  }
  try {
    // Cek jika username diubah dan menabrak yang sudah ada
    const existing = await db
      .select()
      .from(schema.adminUsers)
      .where(and(eq(schema.adminUsers.username, username), sql`id != ${Number(id)}`))
      .limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Username sudah digunakan oleh admin lain" });
    }

    const updatePayload: any = {
      username,
      fullName,
    };
    if (password && password.trim() !== "") {
      updatePayload.password = hashPassword(password);
    }

    const updated = await db
      .update(schema.adminUsers)
      .set(updatePayload)
      .where(eq(schema.adminUsers.id, Number(id)))
      .returning();

    if (updated.length > 0) {
      res.json({ success: true, user: updated[0] });
    } else {
      res.status(404).json({ error: "User admin tidak ditemukan" });
    }
  } catch (error: any) {
    console.error("Error PUT /api/admin/users:", error);
    res.status(500).json({ error: error.message || "Gagal mengupdate user admin" });
  }
});

app.delete("/api/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Jangan biarkan hapus habis semua admin
    const currentAdmins = await db.select().from(schema.adminUsers);
    if (currentAdmins.length <= 1) {
      return res.status(400).json({ error: "Minimal harus ada 1 user admin di sistem, tidak bisa menghapus admin terakhir" });
    }

    await db.delete(schema.adminUsers).where(eq(schema.adminUsers.id, Number(id)));
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error DELETE /api/admin/users:", error);
    res.status(500).json({ error: error.message || "Gagal menghapus user admin" });
  }
});

// --- API KEGIATAN UTAMA ---
app.get("/api/kegiatan", async (req, res) => {
  try {
    const result = await db.select().from(schema.kegiatanUtama).where(eq(schema.kegiatanUtama.id, 1)).limit(1);
    if (result.length > 0) {
      res.json(result[0]);
    } else {
      // Return default placeholder jika kosong
      res.json({
        id: 1,
        judul: "Pendidikan Pengawas Partisipatif Angkatan 2026",
        deskripsi: "Pelatihan intensif tingkat kabupaten untuk kader pengawasan pemilu partisipatif di Kabupaten Bawaslu Paser.",
        aktif: true
      });
    }
  } catch (error: any) {
    console.error("Error GET /api/kegiatan:", error);
    res.status(500).json({ error: error.message || "Gagal mengambil data kegiatan utama" });
  }
});

app.post("/api/kegiatan", async (req, res) => {
  const { judul, deskripsi } = req.body;
  if (!judul) {
    return res.status(400).json({ error: "Judul kegiatan wajib diisi" });
  }
  try {
    const result = await db.insert(schema.kegiatanUtama).values({
      id: 1,
      judul,
      deskripsi: deskripsi || "",
      aktif: true
    }).onConflictDoUpdate({
      target: schema.kegiatanUtama.id,
      set: { judul, deskripsi: deskripsi || "" }
    }).returning();
    
    res.json({ success: true, kegiatan: result[0] });
  } catch (error: any) {
    console.error("Error POST /api/kegiatan:", error);
    res.status(500).json({ error: error.message || "Gagal menyimpan data kegiatan utama" });
  }
});

// --- API LIVE SESSION MANAGER ---
app.get("/api/session/active", async (req, res) => {
  try {
    // Ambil sesi yang berstatus_aktif = true (isLive = true)
    const activeResult = await db.select().from(schema.sessions).where(eq(schema.sessions.isLive, true)).limit(1);
    if (activeResult.length === 0) {
      return res.json(null);
    }

    const activeSesi = activeResult[0];

    // Ambil detail penceramah & fasilitator untuk sesi ini
    const sp = await db.select().from(schema.speakers).where(eq(schema.speakers.sessionId, activeSesi.id)).limit(1);
    const fc = await db.select().from(schema.facilitators).where(eq(schema.facilitators.sessionId, activeSesi.id)).limit(1);

    // Ambil kategori aspek penilaian berdasarkan mapping flags di sesi aktif tersebut
    const categories: string[] = [];
    if (activeSesi.showPemateri) categories.push('A');
    if (activeSesi.showFasilitator) categories.push('B');
    if (activeSesi.showPanitia) categories.push('C');
    if (activeSesi.showKegiatan) categories.push('D');

    let relevantAspek: any[] = [];
    if (categories.length > 0) {
      relevantAspek = await db.select()
        .from(schema.evaluationAspects)
        .where(inArray(schema.evaluationAspects.kategori, categories))
        .orderBy(schema.evaluationAspects.kategori, schema.evaluationAspects.noUrut);
    }

    // Ambil informasi kegiatan aktif
    const kegResult = await db.select().from(schema.kegiatanUtama).where(eq(schema.kegiatanUtama.id, 1)).limit(1);
    const kegiatan = kegResult.length > 0 ? kegResult[0] : null;

    res.json({
      session: {
        id: activeSesi.id,
        nama_sesi: activeSesi.namaSesi,
        status_aktif: activeSesi.isLive,
        show_pemateri: activeSesi.showPemateri,
        show_fasilitator: activeSesi.showFasilitator,
        show_panitia: activeSesi.showPanitia,
        show_kegiatan: activeSesi.showKegiatan,
        nama_pemateri: sp[0]?.nama || "",
        nama_fasilitator: fc[0]?.nama || ""
      },
      questions: relevantAspek,
      kegiatan: kegiatan
    });
  } catch (error: any) {
    console.error("Error GET /api/session/active:", error);
    res.status(500).json({ error: error.message || "Gagal mengambil modul sesi aktif" });
  }
});

app.get("/api/sessions", async (req, res) => {
  try {
    const allSesi = await db.select().from(schema.sessions).orderBy(schema.sessions.id);
    const mapped = [];
    for (const s of allSesi) {
      const sp = await db.select().from(schema.speakers).where(eq(schema.speakers.sessionId, s.id)).limit(1);
      const fc = await db.select().from(schema.facilitators).where(eq(schema.facilitators.sessionId, s.id)).limit(1);
      mapped.push({
        id: s.id,
        nama_sesi: s.namaSesi,
        status_aktif: s.isLive,
        show_pemateri: s.showPemateri,
        show_fasilitator: s.showFasilitator,
        show_panitia: s.showPanitia,
        show_kegiatan: s.showKegiatan,
        nama_pemateri: sp[0]?.nama || "",
        nama_fasilitator: fc[0]?.nama || ""
      });
    }
    res.json(mapped);
  } catch (error: any) {
    console.error("Error GET /api/sessions:", error);
    res.status(500).json({ error: error.message || "Gagal mengambil data sesi" });
  }
});

app.post("/api/sessions", async (req, res) => {
  const { 
    id, 
    nama_sesi, 
    show_pemateri, 
    show_fasilitator, 
    show_panitia, 
    show_kegiatan, 
    nama_pemateri, 
    nama_fasilitator 
  } = req.body;

  if (!nama_sesi) {
    return res.status(400).json({ error: "Nama sesi wajib diisi" });
  }

  try {
    if (id) {
      // Edit sesi yang sudah ada
      const updated = await db.update(schema.sessions).set({
        namaSesi: nama_sesi,
        showPemateri: !!show_pemateri,
        showFasilitator: !!show_fasilitator,
        showPanitia: !!show_panitia,
        showKegiatan: !!show_kegiatan
      }).where(eq(schema.sessions.id, Number(id))).returning();

      if (updated.length > 0) {
        // update speakers
        const existingSp = await db.select().from(schema.speakers).where(eq(schema.speakers.sessionId, Number(id))).limit(1);
        if (existingSp.length > 0) {
          await db.update(schema.speakers).set({ nama: nama_pemateri || "" }).where(eq(schema.speakers.sessionId, Number(id)));
        } else {
          await db.insert(schema.speakers).values({ nama: nama_pemateri || "", sessionId: Number(id) });
        }

        // update facilitators
        const existingFc = await db.select().from(schema.facilitators).where(eq(schema.facilitators.sessionId, Number(id))).limit(1);
        if (existingFc.length > 0) {
          await db.update(schema.facilitators).set({ nama: nama_fasilitator || "" }).where(eq(schema.facilitators.sessionId, Number(id)));
        } else {
          await db.insert(schema.facilitators).values({ nama: nama_fasilitator || "", sessionId: Number(id) });
        }

        return res.json({ 
          success: true, 
          session: {
            id: updated[0].id,
            nama_sesi: updated[0].namaSesi,
            status_aktif: updated[0].isLive,
            show_pemateri: updated[0].showPemateri,
            show_fasilitator: updated[0].showFasilitator,
            show_panitia: updated[0].showPanitia,
            show_kegiatan: updated[0].showKegiatan,
            nama_pemateri: nama_pemateri || "",
            nama_fasilitator: nama_fasilitator || ""
          } 
        });
      } else {
        return res.status(404).json({ error: "Sesi tidak ditemukan" });
      }
    } else {
      // Tambah sesi baru
      const inserted = await db.insert(schema.sessions).values({
        namaSesi: nama_sesi,
        isLive: false,
        showPemateri: !!show_pemateri,
        showFasilitator: !!show_fasilitator,
        showPanitia: !!show_panitia,
        showKegiatan: !!show_kegiatan
      }).returning();

      const newId = inserted[0].id;
      await db.insert(schema.speakers).values({ nama: nama_pemateri || "", sessionId: newId });
      await db.insert(schema.facilitators).values({ nama: nama_fasilitator || "", sessionId: newId });

      res.json({ 
        success: true, 
        session: {
          id: newId,
          nama_sesi: inserted[0].namaSesi,
          status_aktif: inserted[0].isLive,
          show_pemateri: inserted[0].showPemateri,
          show_fasilitator: inserted[0].showFasilitator,
          show_panitia: inserted[0].showPanitia,
          show_kegiatan: inserted[0].showKegiatan,
          nama_pemateri: nama_pemateri || "",
          nama_fasilitator: nama_fasilitator || ""
        } 
      });
    }
  } catch (error: any) {
    console.error("Error POST /api/sessions:", error);
    res.status(500).json({ error: error.message || "Gagal menyimpan data modul sesi" });
  }
});

// Aktifkan satu sesi khusus (dan matikan sesi lainnya)
app.post("/api/sessions/:id/activate", async (req, res) => {
  const idToActivate = Number(req.params.id);
  try {
    // Matikan semua status_aktif
    await db.update(schema.sessions).set({ isLive: false });
    
    // Aktifkan sesi target
    await db.update(schema.sessions).set({ isLive: true }).where(eq(schema.sessions.id, idToActivate));
    
    // Ambil list sesi terbaru untuk direturn ke UI admin
    const allSesi = await db.select().from(schema.sessions).orderBy(schema.sessions.id);
    const mapped = [];
    for (const s of allSesi) {
      const sp = await db.select().from(schema.speakers).where(eq(schema.speakers.sessionId, s.id)).limit(1);
      const fc = await db.select().from(schema.facilitators).where(eq(schema.facilitators.sessionId, s.id)).limit(1);
      mapped.push({
        id: s.id,
        nama_sesi: s.namaSesi,
        status_aktif: s.isLive,
        show_pemateri: s.showPemateri,
        show_fasilitator: s.showFasilitator,
        show_panitia: s.showPanitia,
        show_kegiatan: s.showKegiatan,
        nama_pemateri: sp[0]?.nama || "",
        nama_fasilitator: fc[0]?.nama || ""
      });
    }
    res.json({ success: true, sessions: mapped });
  } catch (error: any) {
    console.error("Error POST /api/sessions/:id/activate:", error);
    res.status(500).json({ error: error.message || "Gagal mengaktifkan sesi penilaian" });
  }
});

// Nonaktifkan semua sesi
app.post("/api/sessions/deactivate-all", async (req, res) => {
  try {
    await db.update(schema.sessions).set({ isLive: false });
    const allSesi = await db.select().from(schema.sessions).orderBy(schema.sessions.id);
    const mapped = [];
    for (const s of allSesi) {
      const sp = await db.select().from(schema.speakers).where(eq(schema.speakers.sessionId, s.id)).limit(1);
      const fc = await db.select().from(schema.facilitators).where(eq(schema.facilitators.sessionId, s.id)).limit(1);
      mapped.push({
        id: s.id,
        nama_sesi: s.namaSesi,
        status_aktif: s.isLive,
        show_pemateri: s.showPemateri,
        show_fasilitator: s.showFasilitator,
        show_panitia: s.showPanitia,
        show_kegiatan: s.showKegiatan,
        nama_pemateri: sp[0]?.nama || "",
        nama_fasilitator: fc[0]?.nama || ""
      });
    }
    res.json({ success: true, sessions: mapped });
  } catch (error: any) {
    console.error("Error POST /api/sessions/deactivate-all:", error);
    res.status(500).json({ error: error.message || "Gagal menonaktifkan seluruh sesi" });
  }
});

app.delete("/api/sessions/:id", async (req, res) => {
  const deleteId = Number(req.params.id);
  try {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, deleteId));
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error DELETE /api/sessions/:id:", error);
    res.status(500).json({ error: error.message || "Gagal menghapus data sesi" });
  }
});

// --- API ASPEK PENILAIAN ---
app.get("/api/aspek", async (req, res) => {
  try {
    const list = await db.select().from(schema.evaluationAspects).orderBy(schema.evaluationAspects.kategori, schema.evaluationAspects.noUrut);
    res.json(list);
  } catch (error: any) {
    console.error("Error GET /api/aspek:", error);
    res.status(500).json({ error: error.message || "Gagal mengambil data aspek penilaian" });
  }
});

app.post("/api/aspek", async (req, res) => {
  const { id, pertanyaan } = req.body;
  if (!id || !pertanyaan) {
    return res.status(400).json({ error: "ID dan Pertanyaan aspek wajib diisi" });
  }
  try {
    const updated = await db.update(schema.evaluationAspects).set({
      pertanyaan: pertanyaan
    }).where(eq(schema.evaluationAspects.id, Number(id))).returning();

    if (updated.length > 0) {
      res.json({ success: true, aspek: updated[0] });
    } else {
      res.status(404).json({ error: "Aspek penilaian tidak ditemukan" });
    }
  } catch (error: any) {
    console.error("Error POST /api/aspek:", error);
    res.status(500).json({ error: error.message || "Gagal menyimpan aspek penilaian" });
  }
});

// --- API SUBMIT EVALUASI ---
app.post("/api/submit-eval", async (req, res) => {
  const { 
    nama_peserta, 
    asal_instansi, 
    sesi_id, 
    ratings, // object mapping: { [aspek_id]: score }
    saran_pemateri,
    saran_fasilitator,
    saran_panitia,
    saran_kegiatan,
    tindak_lanjut,
    harapan
  } = req.body;

  if (!nama_peserta || !asal_instansi || !sesi_id) {
    return res.status(400).json({ error: "Identitas peserta (nama, instansi, & sesi) tidak lengkap" });
  }

  try {
    // 1. Simpan responden di participants
    const newPart = await db.insert(schema.participants).values({
      namaPeserta: nama_peserta,
      asalInstansi: asal_instansi,
      sessionId: Number(sesi_id)
    }).returning();
    const newParticipantId = newPart[0].id;

    // 2. Simpan rating detail (likert 1-5) dan saran
    if (ratings && typeof ratings === "object") {
      const keys = Object.keys(ratings);
      for (const aspekKey of keys) {
        const aspId = Number(aspekKey);
        const val = Number(ratings[aspekKey]);
        if (val >= 1 && val <= 5) {
          await db.insert(schema.evaluationResults).values({
            participantId: newParticipantId,
            sessionId: Number(sesi_id),
            aspectId: aspId,
            score: val,
            saran: saran_kegiatan || "", // default to general
            saranPemateri: saran_pemateri || "",
            saranFasilitator: saran_fasilitator || "",
            saranPanitia: saran_panitia || "",
            saranKegiatan: saran_kegiatan || "",
            tindakLanjut: tindak_lanjut || "",
            harapan: harapan || ""
          });
        }
      }
    }

    res.json({ success: true, message: "Penilaian berhasil dikirim secara real-time ke sistem. Terima kasih partisipasinya!" });
  } catch (error: any) {
    console.error("Error POST /api/submit-eval:", error);
    res.status(500).json({ error: error.message || "Gagal mengirimkan formulir penilaian" });
  }
});

// --- API REKAPITULASI DETAIL & STATS (ADMIN DASHBOARD) ---
app.get("/api/rekap", async (req, res) => {
  try {
    // 1. Dapatkan total koresponden peserta evaluasi unik
    const countRes = await db.select({ val: count() }).from(schema.participants);
    const totalPesertaEvaluasi = countRes[0].val;

    // 2. Sesi Lookup
    const dbSessionsList = await db.select().from(schema.sessions).orderBy(schema.sessions.id);

    // 3. Ambil statistik kepuasan per Sesi menggunakan loop agregasi Drizzle ORM yang tangguh
    const sanitizedSessionStats: any = {};
    for (const s of dbSessionsList) {
      const partCount = await db.select({ val: count() }).from(schema.participants).where(eq(schema.participants.sessionId, s.id));
      
      const resultsForSession = await db.select({
        score: schema.evaluationResults.score,
        kategori: schema.evaluationAspects.kategori
      })
      .from(schema.evaluationResults)
      .innerJoin(schema.evaluationAspects, eq(schema.evaluationResults.aspectId, schema.evaluationAspects.id))
      .where(eq(schema.evaluationResults.sessionId, s.id));

      let aSum = 0, aCount = 0;
      let bSum = 0, bCount = 0;
      let cSum = 0, cCount = 0;
      let dSum = 0, dCount = 0;

      for (const r of resultsForSession) {
        if (r.kategori === 'A') { aSum += r.score; aCount++; }
        else if (r.kategori === 'B') { bSum += r.score; bCount++; }
        else if (r.kategori === 'C') { cSum += r.score; cCount++; }
        else if (r.kategori === 'D') { dSum += r.score; dCount++; }
      }

      sanitizedSessionStats[s.id] = {
        nama_sesi: s.namaSesi,
        peserta_count: partCount[0].val,
        pemateri_avg: aCount > 0 ? Number((aSum / aCount).toFixed(2)) : 0,
        fasilitator_avg: bCount > 0 ? Number((bSum / bCount).toFixed(2)) : 0,
        panitia_avg: cCount > 0 ? Number((cSum / cCount).toFixed(2)) : 0,
        kegiatan_avg: dCount > 0 ? Number((dSum / dCount).toFixed(2)) : 0
      };
    }

    // 4. Ambil nilai Kumulatif Keseluruhan
    const allResults = await db.select({
      score: schema.evaluationResults.score,
      kategori: schema.evaluationAspects.kategori
    })
    .from(schema.evaluationResults)
    .innerJoin(schema.evaluationAspects, eq(schema.evaluationResults.aspectId, schema.evaluationAspects.id));

    let aSumAll = 0, aCountAll = 0;
    let bSumAll = 0, bCountAll = 0;
    let cSumAll = 0, cCountAll = 0;
    let dSumAll = 0, dCountAll = 0;

    for (const r of allResults) {
      if (r.kategori === 'A') { aSumAll += r.score; aCountAll++; }
      else if (r.kategori === 'B') { bSumAll += r.score; bCountAll++; }
      else if (r.kategori === 'C') { cSumAll += r.score; cCountAll++; }
      else if (r.kategori === 'D') { dSumAll += r.score; dCountAll++; }
    }

    const overallStats = {
      pemateri_avg_overall: aCountAll > 0 ? Number((aSumAll / aCountAll).toFixed(2)) : 0,
      fasilitator_avg_overall: bCountAll > 0 ? Number((bSumAll / bCountAll).toFixed(2)) : 0,
      panitia_avg_overall: cCountAll > 0 ? Number((cSumAll / cCountAll).toFixed(2)) : 0,
      kegiatan_avg_overall: dCountAll > 0 ? Number((dSumAll / dCountAll).toFixed(2)) : 0
    };

    // 5. Data Grafik per Sesi
    const pemateriBySession: ChartDataPoints[] = dbSessionsList.map(s => {
      const item = sanitizedSessionStats[s.id];
      const truncName = s.namaSesi.split(" ")[0] + " " + (s.namaSesi.split(" ")[1] || "");
      return {
        name: truncName || `Sesi ${s.id}`,
        avgScore: item ? item.pemateri_avg : 0
      };
    });

    const fasilitatorBySession: ChartDataPoints[] = dbSessionsList.map(s => {
      const item = sanitizedSessionStats[s.id];
      const truncName = s.namaSesi.split(" ")[0] + " " + (s.namaSesi.split(" ")[1] || "");
      return {
        name: truncName || `Sesi ${s.id}`,
        avgScore: item ? item.fasilitator_avg : 0
      };
    });

    // 6. Aspek Detail Grafik untuk Panitia (C) dan Kegiatan Utama (D)
    const allAspects = await db.select().from(schema.evaluationAspects).where(sql`${schema.evaluationAspects.kategori} IN ('C', 'D')`);
    
    const panitiaByAspect: ChartDataPoints[] = [];
    const kegiatanByAspect: ChartDataPoints[] = [];

    for (const asp of allAspects) {
      const resForAsp = await db.select({
        score: schema.evaluationResults.score
      })
      .from(schema.evaluationResults)
      .where(eq(schema.evaluationResults.aspectId, asp.id));

      const aspectSum = resForAsp.reduce((sum, r) => sum + r.score, 0);
      const aspectAvg = resForAsp.length > 0 ? Number((aspectSum / resForAsp.length).toFixed(2)) : 0;

      const point = {
        name: `U-${asp.noUrut}`,
        avgScore: aspectAvg
      };

      if (asp.kategori === 'C') {
        panitiaByAspect.push(point);
      } else {
        kegiatanByAspect.push(point);
      }
    }

    panitiaByAspect.sort((x, y) => x.name.localeCompare(y.name, undefined, { numeric: true }));
    kegiatanByAspect.sort((x, y) => x.name.localeCompare(y.name, undefined, { numeric: true }));

    // 7. Ambil detail statistik aspects per sesi (grouped by sessionId & aspectId)
    const groupResults = await db.select({
      sessionId: schema.evaluationResults.sessionId,
      aspectId: schema.evaluationResults.aspectId,
      avgScore: sql<number>`COALESCE(round(avg(${schema.evaluationResults.score})::numeric, 2), 0)`
    })
    .from(schema.evaluationResults)
    .groupBy(schema.evaluationResults.sessionId, schema.evaluationResults.aspectId);

    const sessionAspectStats: { [sessionId: number]: { [aspectId: number]: number } } = {};
    for (const row of groupResults) {
      if (!sessionAspectStats[row.sessionId]) {
        sessionAspectStats[row.sessionId] = {};
      }
      sessionAspectStats[row.sessionId][row.aspectId] = Number(row.avgScore);
    }

    const rekap: RekapitulasiDashboard = {
      totalPesertaEvaluasi,
      sessionStats: sanitizedSessionStats,
      sessionAspectStats,
      overallStats,
      charts: {
        pemateriBySession,
        fasilitatorBySession,
        panitiaByAspect,
        kegiatanByAspect
      }
    };

    res.json(rekap);
  } catch (error: any) {
    console.error("Error GET /api/rekap:", error);
    res.status(500).json({ error: error.message || "Gagal memproses data statistik rekapitulasi" });
  }
});

// --- API FEEDBACK / SARAN TEXT LIST ---
app.get("/api/feedbacks", async (req, res) => {
  try {
    const dbParticipants = await db.select()
      .from(schema.participants)
      .innerJoin(schema.sessions, eq(schema.participants.sessionId, schema.sessions.id))
      .orderBy(schema.participants.createdAt);

    const list: FeedbackItem[] = [];
    for (const p of dbParticipants) {
      const resText = await db.select()
        .from(schema.evaluationResults)
        .where(eq(schema.evaluationResults.participantId, p.participants.id))
        .limit(1);

      const rObj = resText[0];
      list.push({
        id: p.participants.id,
        nama_peserta: p.participants.namaPeserta,
        asal_instansi: p.participants.asalInstansi,
        nama_sesi: p.sessions.namaSesi,
        created_at: p.participants.createdAt.toISOString(),
        saran_pemateri: rObj?.saranPemateri || "",
        saran_fasilitator: rObj?.saranFasilitator || "",
        saran_panitia: rObj?.saranPanitia || "",
        saran_kegiatan: rObj?.saranKegiatan || "",
        tindak_lanjut: rObj?.tindakLanjut || "",
        harapan: rObj?.harapan || ""
      });
    }

    list.reverse(); // Terlebih dahulu yang paling baru
    res.json(list);
  } catch (error: any) {
    console.error("Error GET /api/feedbacks:", error);
    res.status(500).json({ error: error.message || "Gagal mengambil daftar kritik & saran" });
  }
});

// --- API PESERTA RAW TABLE ---
app.get("/api/peserta", async (req, res) => {
  try {
    const rawPeserta = await db.select()
      .from(schema.participants)
      .innerJoin(schema.sessions, eq(schema.participants.sessionId, schema.sessions.id))
      .orderBy(schema.participants.createdAt);

    const mappedP = rawPeserta.map(r => ({
      id: r.participants.id,
      nama_peserta: r.participants.namaPeserta,
      asal_instansi: r.participants.asalInstansi,
      sesi_id: r.participants.sessionId,
      created_at: r.participants.createdAt,
      nama_sesi: r.sessions.namaSesi
    })).reverse();

    res.json(mappedP);
  } catch (error: any) {
    console.error("Error GET /api/peserta:", error);
    res.status(500).json({ error: error.message || "Gagal mengambil data raw peserta evaluasi" });
  }
});

// --- API EXPORT CSV (RAW DATA REPORT) ---
app.get("/api/export-csv", async (req, res) => {
  try {
    const headers = [
      "No",
      "Timestamp Submitted",
      "Nama Peserta",
      "Asal Kampus / Instansi",
      "Sesi Evaluasi",
      "Nama Pemateri",
      "Nama Fasilitator",
      "Rata-rata Rating Pemateri",
      "Rata-rata Rating Fasilitator",
      "Rata-rata Rating Panitia",
      "Rata-rata Rating Kegiatan",
      "Saran Pemateri",
      "Saran Fasilitator",
      "Saran Panitia Pelaksana",
      "Saran Kegiatan",
      "Rekomendasi Tindak Lanjut (Khusus Sesi 3)",
      "Harapan Kedepan (Khusus Sesi 3)"
    ];

    const rawPeserta = await db.select()
      .from(schema.participants)
      .innerJoin(schema.sessions, eq(schema.participants.sessionId, schema.sessions.id))
      .orderBy(schema.participants.createdAt);

    const rows = [];
    for (let index = 0; index < rawPeserta.length; index++) {
      const r = rawPeserta[index];
      const p = r.participants;
      const s = r.sessions;

      const resOfPart = await db.select({
        score: schema.evaluationResults.score,
        kategori: schema.evaluationAspects.kategori
      })
      .from(schema.evaluationResults)
      .innerJoin(schema.evaluationAspects, eq(schema.evaluationResults.aspectId, schema.evaluationAspects.id))
      .where(eq(schema.evaluationResults.participantId, p.id));

      let aSum = 0, aCount = 0;
      let bSum = 0, bCount = 0;
      let cSum = 0, cCount = 0;
      let dSum = 0, dCount = 0;

      for (const resItem of resOfPart) {
        if (resItem.kategori === 'A') { aSum += resItem.score; aCount++; }
        else if (resItem.kategori === 'B') { bSum += resItem.score; bCount++; }
        else if (resItem.kategori === 'C') { cSum += resItem.score; cCount++; }
        else if (resItem.kategori === 'D') { dSum += resItem.score; dCount++; }
      }

      const sp = await db.select().from(schema.speakers).where(eq(schema.speakers.sessionId, s.id)).limit(1);
      const fc = await db.select().from(schema.facilitators).where(eq(schema.facilitators.sessionId, s.id)).limit(1);

      const resultsFeed = await db.select().from(schema.evaluationResults).where(eq(schema.evaluationResults.participantId, p.id)).limit(1);
      const fObj = resultsFeed[0];

      const pemAvg = aCount > 0 ? (aSum / aCount).toFixed(2) : "-";
      const fasAvg = bCount > 0 ? (bSum / bCount).toFixed(2) : "-";
      const panAvg = cCount > 0 ? (cSum / cCount).toFixed(2) : "-";
      const kegAvg = dCount > 0 ? (dSum / dCount).toFixed(2) : "-";

      const clean = (text?: string | null) => {
        if (!text) return "";
        return `"${text.replace(/"/g, '""').replace(/\r?\n|\r/g, " ")}"`;
      };

      rows.push([
        index + 1,
        p.createdAt ? p.createdAt.toISOString() : "-",
        `"${p.namaPeserta.replace(/"/g, '""')}"`,
        `"${p.asalInstansi.replace(/"/g, '""')}"`,
        `"${s.namaSesi.replace(/"/g, '""')}"`,
        `"${sp[0]?.nama ? sp[0].nama.replace(/"/g, '""') : "-"} "`,
        `"${fc[0]?.nama ? fc[0].nama.replace(/"/g, '""') : "-"} "`,
        pemAvg,
        fasAvg,
        panAvg,
        kegAvg,
        clean(fObj?.saranPemateri),
        clean(fObj?.saranFasilitator),
        clean(fObj?.saranPanitia),
        clean(fObj?.saranKegiatan),
        clean(fObj?.tindakLanjut),
        clean(fObj?.harapan)
      ].join(","));
    }

    // CSV format expects newest first
    rows.reverse();

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n"); // prepending BOM for proper Excel Indonesian CSV reading

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="Penilaian_Bawaslu_Paser_Partisipatif.csv"');
    res.send(csvContent);
  } catch (error: any) {
    console.error("Error GET /api/export-csv:", error);
    res.status(500).json({ error: "Gagal mengekspor data real-time ke format CSV" });
  }
});

// --- API RINCIAN PENILAIAN RESPONDEN ---
app.get("/api/respondents-detail", async (req, res) => {
  try {
    const aspects = await db.select().from(schema.evaluationAspects).orderBy(schema.evaluationAspects.kategori, schema.evaluationAspects.noUrut);
    
    const rawParticipants = await db.select()
      .from(schema.participants)
      .innerJoin(schema.sessions, eq(schema.participants.sessionId, schema.sessions.id))
      .orderBy(schema.participants.createdAt);

    const respondents = [];
    for (const r of rawParticipants) {
      const p = r.participants;
      const s = r.sessions;

      const evalRes = await db.select().from(schema.evaluationResults).where(eq(schema.evaluationResults.participantId, p.id));
      
      const scores: Record<number, number> = {};
      let saranPemateri = "";
      let saranFasilitator = "";
      let saranPanitia = "";
      let saranKegiatan = "";
      let tindakLanjut = "";
      let harapan = "";

      if (evalRes.length > 0) {
        saranPemateri = evalRes[0].saranPemateri || "";
        saranFasilitator = evalRes[0].saranFasilitator || "";
        saranPanitia = evalRes[0].saranPanitia || "";
        saranKegiatan = evalRes[0].saranKegiatan || "";
        tindakLanjut = evalRes[0].tindakLanjut || "";
        harapan = evalRes[0].harapan || "";

        for (const ev of evalRes) {
          scores[ev.aspectId] = ev.score;
        }
      }

      const sp = await db.select().from(schema.speakers).where(eq(schema.speakers.sessionId, Number(p.sessionId))).limit(1);
      const fc = await db.select().from(schema.facilitators).where(eq(schema.facilitators.sessionId, Number(p.sessionId))).limit(1);

      respondents.push({
        id: p.id,
        nama_peserta: p.namaPeserta,
        asal_instansi: p.asalInstansi,
        sesi_id: p.sessionId,
        nama_sesi: s.namaSesi,
        nama_pemateri: sp[0]?.nama || "",
        nama_fasilitator: fc[0]?.nama || "",
        created_at: p.createdAt,
        scores,
        saran_pemateri: saranPemateri,
        saran_fasilitator: saranFasilitator,
        saran_panitia: saranPanitia,
        saran_kegiatan: saranKegiatan,
        tindak_lanjut: tindakLanjut,
        harapan: harapan
      });
    }

    respondents.reverse();

    res.json({
      aspects,
      respondents
    });
  } catch (error: any) {
    console.error("Error GET /api/respondents-detail:", error);
    res.status(500).json({ error: error.message || "Gagal mengambil rincian penilaian responden" });
  }
});

// --- API DELETE SINGLE RESPONDENT / PARTICIPANT ---
app.delete("/api/respondents/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID responden tidak valid" });
    }
    // Deleting participant cascades and deletes all related evaluation_results
    await db.delete(schema.participants).where(eq(schema.participants.id, id));
    res.json({ success: true, message: `Responden dengan ID ${id} berhasil dihapus` });
  } catch (error: any) {
    console.error("Error DELETE /api/respondents/:id:", error);
    res.status(500).json({ error: error.message || "Gagal menghapus responden" });
  }
});

// --- API DELETE ALL RESPONDENTS / RESET ALL EVALUATIONS ---
app.post("/api/respondents/reset-all", async (req, res) => {
  try {
    // Delete all rows in evaluation_results first and then participants
    await db.delete(schema.evaluationResults);
    await db.delete(schema.participants);
    res.json({ success: true, message: "Semua hasil penilaian dan data responden berhasil dihapus. Sistem kini bersih!" });
  } catch (error: any) {
    console.error("Error POST /api/respondents/reset-all:", error);
    res.status(500).json({ error: error.message || "Gagal membersihkan data penilaian" });
  }
});

// --- API SUBMIT INTERNAL EVALUATION (ANONYMOUS) ---
app.post("/api/internal-eval", async (req, res) => {
  const { planning_score, pelaksanaan_score, partisipasi_score, tanggung_jawab_score, saran } = req.body;
  if (
    planning_score === undefined ||
    pelaksanaan_score === undefined ||
    partisipasi_score === undefined ||
    tanggung_jawab_score === undefined
  ) {
    return res.status(400).json({ error: "Mohon lengkapi semua penilaian pilihan ganda (soal 1 - 4)" });
  }
  const ps = Number(planning_score);
  const pls = Number(pelaksanaan_score);
  const pts = Number(partisipasi_score);
  const tjs = Number(tanggung_jawab_score);
  if (
    ps < 1 || ps > 5 ||
    pls < 1 || pls > 5 ||
    pts < 1 || pts > 5 ||
    tjs < 1 || tjs > 5
  ) {
    return res.status(400).json({ error: "Nilai skor harus berada di antara range 1 hingga 5." });
  }

  try {
    const inserted = await db.insert(schema.internalEvaluations).values({
      planningScore: ps,
      pelaksanaanScore: pls,
      partisipasiScore: pts,
      tanggungJawabScore: tjs,
      saran: saran || ""
    }).returning();
    res.json({ success: true, id: inserted[0].id, message: "Evaluasi internal berhasil dikirimkan secara anonim. Terima kasih atas partisipasi dan masukan berharga Anda!" });
  } catch (error: any) {
    console.error("Error POST /api/internal-eval:", error);
    res.status(500).json({ error: error.message || "Gagal mengirimkan evaluasi internal" });
  }
});

// --- API GET INTERNAL EVALUATION STATS & LIST ---
app.get("/api/internal-eval", async (req, res) => {
  try {
    const list = await db.select().from(schema.internalEvaluations).orderBy(desc(schema.internalEvaluations.createdAt));
    
    // Calculate aggregate averages
    const total = list.length;
    let avgPlanning = 0;
    let avgPelaksanaan = 0;
    let avgPartisipasi = 0;
    let avgTanggungJawab = 0;

    if (total > 0) {
      const sumPlanning = list.reduce((sum, item) => sum + item.planningScore, 0);
      const sumPelaksanaan = list.reduce((sum, item) => sum + item.pelaksanaanScore, 0);
      const sumPartisipasi = list.reduce((sum, item) => sum + item.partisipasiScore, 0);
      const sumTanggungJawab = list.reduce((sum, item) => sum + item.tanggungJawabScore, 0);

      avgPlanning = parseFloat((sumPlanning / total).toFixed(2));
      avgPelaksanaan = parseFloat((sumPelaksanaan / total).toFixed(2));
      avgPartisipasi = parseFloat((sumPartisipasi / total).toFixed(2));
      avgTanggungJawab = parseFloat((sumTanggungJawab / total).toFixed(2));
    }

    res.json({
      success: true,
      data: list,
      stats: {
        total,
        avgPlanning,
        avgPelaksanaan,
        avgPartisipasi,
        avgTanggungJawab
      }
    });
  } catch (error: any) {
    console.error("Error GET /api/internal-eval:", error);
    res.status(500).json({ error: error.message || "Gagal mengambil data evaluasi internal" });
  }
});

// --- API DELETE SINGLE INTERNAL EVALUATION ---
app.delete("/api/internal-eval/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID evaluasi internal tidak valid" });
    }
    await db.delete(schema.internalEvaluations).where(eq(schema.internalEvaluations.id, id));
    res.json({ success: true, message: `Evaluasi dengan ID ${id} berhasil dihapus` });
  } catch (error: any) {
    console.error("Error DELETE /api/internal-eval/:id:", error);
    res.status(500).json({ error: error.message || "Gagal menghapus evaluasi internal" });
  }
});

// --- API RESET ALL INTERNAL EVALUATIONS ---
app.post("/api/internal-eval/reset-all", async (req, res) => {
  try {
    await db.delete(schema.internalEvaluations);
    res.json({ success: true, message: "Semua data evaluasi internal berhasil dikosongkan. Keadaan bersih kembali!" });
  } catch (error: any) {
    console.error("Error POST /api/internal-eval/reset-all:", error);
    res.status(500).json({ error: error.message || "Gagal mengosongkan evaluasi internal" });
  }
});

// Configure Vite or Serve SPA statically
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

start();
