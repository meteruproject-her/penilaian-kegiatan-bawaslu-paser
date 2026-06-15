/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface KegiatanUtama {
  id: number;
  judul: string;
  deskripsi: string;
  aktif: boolean;
}

export interface Sesi {
  id: number;
  nama_sesi: string;
  status_aktif: boolean;
  show_pemateri: boolean;
  show_fasilitator: boolean;
  show_panitia: boolean;
  show_kegiatan: boolean;
  nama_pemateri: string;
  nama_fasilitator: string;
}

export interface AspekPenilaian {
  id: number;
  kategori: 'A' | 'B' | 'C' | 'D';
  no_urut: number;
  pertanyaan: string;
}

export interface PesertaEvaluasi {
  id: number;
  nama_peserta: string;
  asal_instansi: string;
  sesi_id: number;
  created_at: string;
}

export interface PenilaianDetail {
  id: number;
  peserta_evaluasi_id: number;
  aspek_id: number;
  nilai: number; // 1 to 5
}

export interface SaranMasukan {
  id: number;
  peserta_evaluasi_id: number;
  saran_pemateri?: string;
  saran_fasilitator?: string;
  saran_panitia?: string;
  saran_kegiatan?: string;
  tindak_lanjut?: string;
  harapan?: string;
}

// Complex aggregate types for reporting
export interface FeedbackItem {
  id: number;
  nama_peserta: string;
  asal_instansi: string;
  nama_sesi: string;
  created_at: string;
  saran_pemateri?: string;
  saran_fasilitator?: string;
  saran_panitia?: string;
  saran_kegiatan?: string;
  tindak_lanjut?: string;
  harapan?: string;
}

export interface ChartDataPoints {
  name: string; // aspects or session name
  avgScore: number;
}

export interface RekapitulasiDashboard {
  totalPesertaEvaluasi: number;
  sessionStats: {
    [key: number]: {
      nama_sesi: string;
      peserta_count: number;
      pemateri_avg: number;
      fasilitator_avg: number;
      panitia_avg: number;
      kegiatan_avg: number;
    }
  };
  sessionAspectStats?: {
    [sessionId: number]: {
      [aspectId: number]: number;
    }
  };
  overallStats: {
    pemateri_avg_overall: number;
    fasilitator_avg_overall: number;
    panitia_avg_overall: number;
    kegiatan_avg_overall: number;
  };
  charts: {
    pemateriBySession: ChartDataPoints[];
    fasilitatorBySession: ChartDataPoints[];
    panitiaByAspect: ChartDataPoints[];
    kegiatanByAspect: ChartDataPoints[];
  };
}

export interface AdminUser {
  id?: number;
  username: string;
  password?: string;
  fullName: string;
  createdAt?: string;
}

