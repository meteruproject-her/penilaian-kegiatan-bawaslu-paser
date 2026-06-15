/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Users, 
  Award, 
  MessageSquare, 
  Layers, 
  Play, 
  Square, 
  Plus, 
  Edit2, 
  Trash2, 
  Download, 
  User, 
  School, 
  CheckCircle, 
  LogOut, 
  Settings, 
  ShieldAlert,
  Menu,
  HelpCircle,
  FileSpreadsheet,
  BookOpen,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Info,
  Power,
  ClipboardList
} from 'lucide-react';

interface Sesi {
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

interface AspekPenilaian {
  id: number;
  kategori: 'A' | 'B' | 'C' | 'D';
  no_urut: number;
  pertanyaan: string;
}

interface PesertaEvaluasi {
  id: number;
  nama_peserta: string;
  asal_instansi: string;
  sesi_id: number;
  nama_sesi?: string;
  created_at: string;
}

interface FeedbackItem {
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

interface SesiResponse {
  session: Sesi;
  questions: AspekPenilaian[];
  kegiatan: { id: number; judul: string; deskripsi: string; aktif: boolean };
}

interface RekapDashboard {
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
  overallStats: {
    pemateri_avg_overall: number;
    fasilitator_avg_overall: number;
    panitia_avg_overall: number;
    kegiatan_avg_overall: number;
  };
  charts: {
    pemateriBySession: { name: string; avgScore: number }[];
    fasilitatorBySession: { name: string; avgScore: number }[];
    panitiaByAspect: { name: string; avgScore: number }[];
    kegiatanByAspect: { name: string; avgScore: number }[];
  };
}

interface AdminUser {
  id?: number;
  username: string;
  password?: string;
  fullName: string;
  createdAt?: string;
}

const PEMATERI_ASPECTS = [
  { id: 1, label: "U-1", desc: "Penyajian & Penguasaan Materi" },
  { id: 2, label: "U-2", desc: "Sistematika & Kejelasan Penyampaian" },
  { id: 3, label: "U-3", desc: "Ketepatan Metode & Media Belajar" },
  { id: 4, label: "U-4", desc: "Jawaban Solutif atas Pertanyaan" },
  { id: 5, label: "U-5", desc: "Sikap, Bahasa & Interaksi Komunikasi" },
  { id: 6, label: "U-6", desc: "Relevansi dengan Konteks Pengawasan" },
];

const FASILITATOR_ASPECTS = [
  { id: 7, label: "U-1", desc: "Kemampuan Memandu Diskusi Sesi" },
  { id: 8, label: "U-2", desc: "Membangun Suasana Aktif & Partisipatif" },
  { id: 9, label: "U-3", desc: "Penguasaan Sesi & Manajemen Waktu" },
  { id: 10, label: "U-4", desc: "Kejelasan Merangkum Poin Penting Sesi" },
  { id: 11, label: "U-5", desc: "Komunikasi Santun & Kepribadian" },
];

const PANITIA_ASPECTS = [
  { id: 12, label: "U-1", desc: "Kemudahan & Kecepatan Alur Pendaftaran" },
  { id: 13, label: "U-2", desc: "Ketersediaan Kit & Bahan Pengawasan" },
  { id: 14, label: "U-3", desc: "Kenyamanan Ruangan & Suhu Pendingin" },
  { id: 15, label: "U-4", desc: "Kualitas, Kebersihan, & Kecukupan Konsumsi" },
  { id: 16, label: "U-5", desc: "Ketepatan Waktu Mulai & Akhir Agenda" },
  { id: 17, label: "U-6", desc: "Kesopanan & Kecepat-tanggepan Panitia" },
];

const KEGIATAN_ASPECTS = [
  { id: 18, label: "U-1", desc: "Manfaat Kegiatan bagi Kapasitas Kader" },
  { id: 19, label: "U-2", desc: "Kesesuaian dengan Harapan & Kebutuhan" },
  { id: 20, label: "U-3", desc: "Gairah Kepuasan Menyeluruh atas Diklat" },
];

export default function App() {
  // Navigation & Role States
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname === "/admin" ? "/admin" : "/penilaian";
  });
  const isAdminMode = currentPath === "/admin";
  const [activeTab, setActiveTab] = useState<string>(() => {
    return window.location.pathname === "/admin" ? "dashboard" : "feedback";
  });
  const [isAdminLogged, setIsAdminLogged] = useState<boolean>(() => {
    return !!localStorage.getItem("bawaslu_token");
  });

  // Custom client router for separated views
  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    if (path === "/admin") {
      setActiveTab("dashboard");
    } else {
      setActiveTab("feedback");
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname === "/admin" ? "/admin" : "/penilaian";
      setCurrentPath(p);
      if (p === "/admin") {
        setActiveTab("dashboard");
      } else {
        setActiveTab("feedback");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Auth Inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Participant States
  const [namaPeserta, setNamaPeserta] = useState(() => localStorage.getItem("bawaslu_nama") || "");
  const [asalInstansi, setAsalInstansi] = useState(() => localStorage.getItem("bawaslu_instansi") || "");
  const [isIdentitySaved, setIsIdentitySaved] = useState<boolean>(() => {
    return !!(localStorage.getItem("bawaslu_nama") && localStorage.getItem("bawaslu_instansi"));
  });
  const [agreeConsent, setAgreeConsent] = useState(false);

  // Assessment Forms States
  const [activeSessionData, setActiveSessionData] = useState<SesiResponse | null>(null);
  const [loadingActiveSession, setLoadingActiveSession] = useState<boolean>(true);
  const [ratings, setRatings] = useState<{ [key: number]: number }>({});
  const [saranPemateri, setSaranPemateri] = useState("");
  const [saranFasilitator, setSaranFasilitator] = useState("");
  const [saranPanitia, setSaranPanitia] = useState("");
  const [saranKegiatan, setSaranKegiatan] = useState("");
  const [tindakLanjut, setTindakLanjut] = useState("");
  const [harapan, setHarapan] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const getQuestionIndicatorText = (questionId: number) => {
    const score = ratings[questionId];
    if (!score) return "Belum Dinilai";
    if (score === 1) return "Sangat Buruk";
    if (score === 2) return "Buruk";
    if (score === 3) return "Cukup";
    if (score === 4) return "Baik";
    if (score === 5) return "Sangat Baik";
    return "";
  };

  const getQuestionIndicatorColor = (questionId: number) => {
    const score = ratings[questionId];
    if (!score) return "text-slate-400 font-semibold";
    if (score <= 2) return "text-rose-600 font-extrabold";
    if (score === 3) return "text-amber-500 font-extrabold";
    return "text-green-600 font-extrabold";
  };

  // Admin Dashboard States
  const [rekap, setRekap] = useState<RekapDashboard | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [sessions, setSessions] = useState<Sesi[]>([]);
  const [allQuestions, setAllQuestions] = useState<AspekPenilaian[]>([]);
  const [pesertaList, setPesertaList] = useState<PesertaEvaluasi[]>([]);
  const [loadingAdminData, setLoadingAdminData] = useState(false);

  // States for Admin Users list (CRUD) and mobile responsiveness
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminForm, setAdminForm] = useState<{ id?: number; username: string; password?: string; fullName: string }>({
    username: "",
    password: "",
    fullName: ""
  });
  const [adminError, setAdminError] = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [adminSuccessMsg, setAdminSuccessMsg] = useState("");
  const [deleteAdminCandidate, setDeleteAdminCandidate] = useState<AdminUser | null>(null);
  const [aspectSuccessMsg, setAspectSuccessMsg] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // States for detailed respondent evaluation view
  const [detailAspects, setDetailAspects] = useState<AspekPenilaian[]>([]);
  const [detailRespondents, setDetailRespondents] = useState<any[]>([]);
  const [detailActiveCategory, setDetailActiveCategory] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [detailSearchQuery, setDetailSearchQuery] = useState("");

  // Granular Sub-Dashboard navigation & filters
  const [activeSubTab, setActiveSubTab] = useState<string>("perbandingan");
  const [selectedPemateriSesiId, setSelectedPemateriSesiId] = useState<number>(0);
  const [selectedFasilitatorSesiId, setSelectedFasilitatorSesiId] = useState<number>(0);

  // Admin Master Data CRUD Modal States
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState<{
    id?: number;
    nama_sesi: string;
    show_pemateri: boolean;
    show_fasilitator: boolean;
    show_panitia: boolean;
    show_kegiatan: boolean;
    nama_pemateri: string;
    nama_fasilitator: string;
  }>({
    nama_sesi: "",
    show_pemateri: true,
    show_fasilitator: true,
    show_panitia: false,
    show_kegiatan: false,
    nama_pemateri: "",
    nama_fasilitator: ""
  });

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState<{
    id?: number;
    kategori: string;
    no_urut: number;
    pertanyaan: string;
  }>({
    kategori: "A",
    no_urut: 1,
    pertanyaan: ""
  });

  const [kegiatanForm, setKegiatanForm] = useState({
    judul: "",
    deskripsi: ""
  });
  const [showKegiatanEditor, setShowKegiatanEditor] = useState(false);

  // Global Custom Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => void | Promise<void>) | null;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "Ya, Lanjutkan",
    cancelText: "Batal",
    isDanger: false
  });

  // Global Toast Notification state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: "",
    type: "success"
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => (prev.message === message ? { ...prev, show: false } : prev));
    }, 4000); // 4 seconds auto-dismiss
  };

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: { confirmText?: string; cancelText?: string; isDanger?: boolean }
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText: options?.confirmText || "Ya, Lanjutkan",
      cancelText: options?.cancelText || "Batal",
      isDanger: options?.isDanger || false
    });
  };

  // Load Active Session on Init
  useEffect(() => {
    fetchActiveSession();
  }, []);

  // Fetch admin data when admin mode is activated and logged in
  useEffect(() => {
    if (isAdminMode && isAdminLogged) {
      fetchAdminData();
    }
  }, [isAdminMode, isAdminLogged]);

  // Set default filter dropdown selections for granular view analysis
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      if (!selectedPemateriSesiId || !sessions.some(s => s.id === selectedPemateriSesiId)) {
        setSelectedPemateriSesiId(sessions[0].id);
      }
      if (!selectedFasilitatorSesiId || !sessions.some(s => s.id === selectedFasilitatorSesiId)) {
        setSelectedFasilitatorSesiId(sessions[0].id);
      }
    }
  }, [sessions]);

  const fetchActiveSession = async () => {
    setLoadingActiveSession(true);
    try {
      const res = await fetch("/api/session/active");
      if (res.ok) {
        const data = await res.json();
        setActiveSessionData(data);
        if (data && data.questions) {
          // Initialize ratings with empty values
          const initialRatings: { [key: number]: number } = {};
          data.questions.forEach((q: AspekPenilaian) => {
            initialRatings[q.id] = 0; // unselected
          });
          setRatings(initialRatings);
        }
      }
    } catch (error) {
      console.error("Gagal memuat sesi penilaian aktif:", error);
    } finally {
      setLoadingActiveSession(false);
    }
  };

  const fetchAdminData = async () => {
    setLoadingAdminData(true);
    try {
      const [rekapRes, feedbackRes, sessionRes, questRes, pesertaRes, kegRes, adminRes, respondentsRes] = await Promise.all([
        fetch("/api/rekap"),
        fetch("/api/feedbacks"),
        fetch("/api/sessions"),
        fetch("/api/aspek"),
        fetch("/api/peserta"),
        fetch("/api/kegiatan"),
        fetch("/api/admin/users"),
        fetch("/api/respondents-detail")
      ]);

      if (rekapRes.ok) setRekap(await rekapRes.json());
      if (feedbackRes.ok) setFeedbacks(await feedbackRes.json());
      if (sessionRes.ok) setSessions(await sessionRes.json());
      if (questRes.ok) setAllQuestions(await questRes.json());
      if (pesertaRes.ok) setPesertaList(await pesertaRes.json());
      if (adminRes.ok) setAdminUsers(await adminRes.json());
      if (respondentsRes.ok) {
        const detailData = await respondentsRes.json();
        setDetailAspects(detailData.aspects || []);
        setDetailRespondents(detailData.respondents || []);
      }
      if (kegRes.ok) {
        const kegData = await kegRes.json();
        setKegiatanForm({
          judul: kegData.judul,
          deskripsi: kegData.deskripsi
        });
      }
    } catch (e) {
      console.error("Gagal memuat data admin:", e);
    } finally {
      setLoadingAdminData(false);
    }
  };

  // Participant Actions
  const handleSaveIdentity = () => {
    if (!namaPeserta.trim() || !asalInstansi.trim()) {
      showToast("Mohon lengkapi Nama dan Asal Kampus/Instansi Anda.", "error");
      return;
    }
    if (!agreeConsent) {
      showToast("Anda harus menyetujui pernyataan persetujuan partisipasi sebelum memulai.", "error");
      return;
    }
    triggerConfirm(
      "Simpan Identitas",
      `Apakah Anda yakin ingin menyimpan identitas dengan nama "${namaPeserta}" dari "${asalInstansi}"?`,
      () => {
        try {
          localStorage.setItem("bawaslu_nama", namaPeserta);
          localStorage.setItem("bawaslu_instansi", asalInstansi);
          setIsIdentitySaved(true);
          showToast("Identitas sukses disimpan! Selamat mengisi penilaian.", "success");
        } catch (e) {
          showToast("Gagal menyimpan identitas ke penyimpanan lokal.", "error");
        }
      }
    );
  };

  const handleResetIdentity = () => {
    triggerConfirm(
      "Reset Identitas Peserta?",
      "Apakah Anda yakin ingin mengatur ulang identitas Anda? Seluruh kolom masukan evaluasi akan dikosongkan.",
      () => {
        try {
          localStorage.removeItem("bawaslu_nama");
          localStorage.removeItem("bawaslu_instansi");
          setNamaPeserta("");
          setAsalInstansi("");
          setAgreeConsent(false);
          setIsIdentitySaved(false);
          setSubmitSuccess(false);
          // clear ratings too
          setRatings({});
          showToast("Identitas dan formulir penilaian berhasil direset.", "success");
        } catch (e) {
          showToast("Gagal mengatur ulang identitas.", "error");
        }
      },
      { isDanger: true }
    );
  };

  const handleRatingSelect = (questionId: number, score: number) => {
    setRatings(prev => ({
      ...prev,
      [questionId]: score
    }));
  };

  const handleSubmitEvaluation = async () => {
    if (!activeSessionData) return;

    // Check if all displayed questions have ratings
    const missingRatings = activeSessionData.questions.filter(q => !ratings[q.id] || ratings[q.id] === 0);
    if (missingRatings.length > 0) {
      const errorMsg = `Mohon berikan penilaian untuk semua aspek (tersisa ${missingRatings.length} pertanyaan).`;
      setSubmitError(errorMsg);
      showToast(errorMsg, "error");
      return;
    }

    triggerConfirm(
      "Kirim Formulir Evaluasi?",
      "Apakah Anda yakin ingin mengirim semua penilaian ini? Jawaban Anda yang telah dikirim bersifat final.",
      async () => {
        setSubmitError("");
        setSubmitLoading(true);

        try {
          const res = await fetch("/api/submit-eval", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nama_peserta: namaPeserta,
              asal_instansi: asalInstansi,
              sesi_id: activeSessionData.session.id,
              ratings,
              saran_pemateri: saranPemateri,
              saran_fasilitator: saranFasilitator,
              saran_panitia: saranPanitia,
              saran_kegiatan: saranKegiatan,
              tindak_lanjut: tindakLanjut,
              harapan: harapan
            })
          });

          if (res.ok) {
            setSubmitSuccess(true);
            // Clear forms
            setSaranPemateri("");
            setSaranFasilitator("");
            setSaranPanitia("");
            setSaranKegiatan("");
            setTindakLanjut("");
            setHarapan("");
            showToast("Sukses mengirim penilaian! Terima kasih atas partisipasi Anda.", "success");
          } else {
            const errObj = await res.json();
            const errMsg = errObj.error || "Gagal mengirim penilaian.";
            setSubmitError(errMsg);
            showToast(errMsg, "error");
          }
        } catch (e) {
          setSubmitError("Terjadi kesalahan jaringan.");
          showToast("Gagal terhubung ke jaringan server.", "error");
        } finally {
          setSubmitLoading(false);
        }
      }
    );
  };

  // Secure Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("bawaslu_token", data.token);
        localStorage.setItem("bawaslu_is_admin", "true");
        setIsAdminLogged(true);
        navigateTo("/admin");
        fetchAdminData();
        showToast("Login berhasil! Selamat datang Admin.", "success");
      } else {
        setLoginError(data.message || "Gagal masuk.");
        showToast(data.message || "Username atau Sandi salah.", "error");
      }
    } catch (error) {
      setLoginError("Koneksi gagal.");
      showToast("Koneksi gagal terhubung ke server.", "error");
    }
  };

  const handleAdminLogout = () => {
    triggerConfirm(
      "Logout Dashboard?",
      "Apakah Anda yakin ingin keluar dari halaman Administrator?",
      () => {
        localStorage.removeItem("bawaslu_token");
        localStorage.removeItem("bawaslu_is_admin");
        setIsAdminLogged(false);
        navigateTo("/penilaian");
        setUsername("");
        setPassword("");
        showToast("Anda telah keluar sebagai Administrator.", "info");
      }
    );
  };

  // Admin Users CRUD helpers
  const handleOpenAdminModal = (user?: AdminUser) => {
    setAdminError("");
    setAdminConfirmPassword("");
    if (user) {
      setAdminForm({
        id: user.id,
        username: user.username,
        password: "", // password is kept blank when editing unless they want to change it
        fullName: user.fullName
      });
    } else {
      setAdminForm({
        username: "",
        password: "",
        fullName: ""
      });
    }
    setAdminModalOpen(true);
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!adminForm.id;
    
    if (!adminForm.username.trim() || !adminForm.fullName.trim()) {
      setAdminError("Kolom Username dan Nama Lengkap wajib diisi.");
      showToast("Username dan Nama Lengkap wajib diisi.", "error");
      return;
    }

    // Untuk tambah baru, password wajib diisi
    if (!isEdit && !adminForm.password?.trim()) {
      setAdminError("Kata sandi wajib diisi untuk user baru.");
      showToast("Kata sandi wajib diisi untuk user baru.", "error");
      return;
    }

    // Jika password diisi, baik edit atau tambah baru, konfirmasi harus cocok
    if (adminForm.password?.trim()) {
      if (adminForm.password !== adminConfirmPassword) {
        setAdminError("Sandi konfimasi tidak sesuai. Mohon tulis ulang dengan tepat.");
        showToast("Sandi konfimasi tidak sesuai.", "error");
        return;
      }
    }

    triggerConfirm(
      isEdit ? "Simpan Perubahan Admin?" : "Tambah Admin Baru?",
      isEdit 
        ? `Apakah Anda yakin ingin memperbarui data admin "${adminForm.fullName}"?`
        : `Apakah Anda yakin ingin menambahkan admin baru dengan username "${adminForm.username}"?`,
      async () => {
        try {
          const url = isEdit ? `/api/admin/users/${adminForm.id}` : "/api/admin/users";
          const method = isEdit ? "PUT" : "POST";

          const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: adminForm.username,
              password: adminForm.password || undefined,
              fullName: adminForm.fullName
            })
          });
          const data = await res.json();
          if (!res.ok) {
            setAdminError(data.error || "Gagal menyimpan user admin");
            showToast(data.error || "Gagal menyimpan user admin.", "error");
            return;
          }

          setAdminModalOpen(false);
          const successMsg = isEdit 
            ? `Kredensial Administrator "${adminForm.fullName}" berhasil diperbarui!` 
            : `User Administrator "${adminForm.fullName}" berhasil ditambahkan ke sistem!`;
          setAdminSuccessMsg(successMsg);
          showToast(successMsg, "success");
          setTimeout(() => setAdminSuccessMsg(""), 5000);
          fetchAdminData();
        } catch (err: any) {
          setAdminError(err.message || "Terjadi kesalahan sambungan");
          showToast("Terjadi kesalahan sambungan jaringan.", "error");
        }
      }
    );
  };

  const executeDeleteAdmin = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setAdminSuccessMsg(data.error || "Gagal menghapus user admin");
        showToast(data.error || "Gagal menghapus user admin", "error");
        setTimeout(() => setAdminSuccessMsg(""), 5000);
        setDeleteAdminCandidate(null);
        return;
      }
      setAdminSuccessMsg("User Administrator berhasil dihapus dari sistem!");
      showToast("User Administrator berhasil dihapus!", "success");
      setTimeout(() => setAdminSuccessMsg(""), 5000);
      setDeleteAdminCandidate(null);
      fetchAdminData();
    } catch (err) {
      console.error("Gagal menghapus admin:", err);
      setAdminSuccessMsg("Gagal menghubungi server untuk menghapus.");
      showToast("Gagal menghubungi server untuk menghapus.", "error");
      setTimeout(() => setAdminSuccessMsg(""), 5000);
      setDeleteAdminCandidate(null);
    }
  };

  // Centralized Live Control
  const handleToggleSession = async (sessId: number, isCurrentlyActive: boolean) => {
    const act = isCurrentlyActive ? "Nonaktifkan" : "Aktifkan";
    triggerConfirm(
      `${act} Sesi LIVE?`,
      `Apakah Anda yakin ingin ${act.toLowerCase()} status LIVE untuk sesi ini?`,
      async () => {
        try {
          let res;
          if (isCurrentlyActive) {
            res = await fetch("/api/sessions/deactivate-all", { method: "POST" });
          } else {
            res = await fetch(`/api/sessions/${sessId}/activate`, { method: "POST" });
          }
          if (res.ok) {
            showToast(`Sesi berhasil di-${isCurrentlyActive ? "nonaktifkan" : "aktifkan (LIVE)"}!`, "success");
          } else {
            showToast("Gagal menyimpan perubahan status live.", "error");
          }
          fetchAdminData();
          fetchActiveSession();
        } catch (e) {
          console.error("Gagal update live status:", e);
          showToast("Koneksi gagal saat merubah status live.", "error");
        }
      }
    );
  };

  const handleDeactivateAll = async () => {
    triggerConfirm(
      "Nonaktifkan Semua Sesi LIVE?",
      "Apakah Anda yakin ingin menonaktifkan semua sesi? Sistem evaluasi tidak akan menerima feedback sementara waktu.",
      async () => {
        try {
          const res = await fetch("/api/sessions/deactivate-all", { method: "POST" });
          if (res.ok) {
            showToast("Semua sesi evaluasi dinonaktifkan!", "success");
          } else {
            showToast("Gagal menonaktifkan sesi evaluasi.", "error");
          }
          fetchAdminData();
          fetchActiveSession();
        } catch (e) {
          console.error(e);
          showToast("Koneksi gagal.", "error");
        }
      },
      { isDanger: true }
    );
  };

  // Admin Master CRUD - Kegiatan
  const handleUpdateKegiatan = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerConfirm(
      "Simpan Informasi Kegiatan?",
      "Apakah Anda yakin ingin memodifikasi detail judul dan deskripsi kegiatan utama ini?",
      async () => {
        try {
          const res = await fetch("/api/kegiatan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              judul: kegiatanForm.judul,
              deskripsi: kegiatanForm.deskripsi
            })
          });
          if (res.ok) {
            setShowKegiatanEditor(false);
            showToast("Detail kegiatan utama berhasil disimpan!", "success");
            fetchAdminData();
            fetchActiveSession();
          } else {
            showToast("Gagal menyimpan kegiatan utama.", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Koneksi server bermasalah.", "error");
        }
      }
    );
  };

  // Admin Master CRUD - Sesi
  const handleOpenSessionModal = (s?: Sesi) => {
    if (s) {
      setSessionForm({
        id: s.id,
        nama_sesi: s.nama_sesi,
        show_pemateri: s.show_pemateri,
        show_fasilitator: s.show_fasilitator,
        show_panitia: s.show_panitia,
        show_kegiatan: s.show_kegiatan,
        nama_pemateri: s.nama_pemateri,
        nama_fasilitator: s.nama_fasilitator
      });
    } else {
      setSessionForm({
        nama_sesi: "",
        show_pemateri: true,
        show_fasilitator: true,
        show_panitia: false,
        show_kegiatan: false,
        nama_pemateri: "",
        nama_fasilitator: ""
      });
    }
    setSessionModalOpen(true);
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!sessionForm.id;
    triggerConfirm(
      isEdit ? "Simpan Sesi?" : "Tambah Sesi?",
      isEdit 
        ? `Apakah Anda yakin ingin menyimpan perubahan pada sesi "${sessionForm.nama_sesi}"?`
        : `Apakah Anda yakin ingin membuat sesi baru "${sessionForm.nama_sesi}"?`,
      async () => {
        try {
          const res = await fetch("/api/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sessionForm)
          });
          if (res.ok) {
            setSessionModalOpen(false);
            showToast(isEdit ? "Sesi berhasil diperbarui!" : "Sesi baru berhasil ditambahkan!", "success");
            fetchAdminData();
            fetchActiveSession();
          } else {
            showToast("Gagal menyimpan sesi.", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Terganggu sambungan jaringan.", "error");
        }
      }
    );
  };

  const handleDeleteSession = async (id: number) => {
    const s = sessions.find(item => item.id === id);
    const n = s ? s.nama_sesi : "sesi ini";
    triggerConfirm(
      "Hapus Sesi Evaluasi?",
      `Apakah Anda yakin ingin menghapus "${n}"? Semua data feedback dan visual rekap terkait sesi ini akan dihapus permanen!`,
      async () => {
        try {
          const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
          if (res.ok) {
            showToast("Sesi berhasil dihapus secara permanen!", "success");
            fetchAdminData();
            fetchActiveSession();
          } else {
            showToast("Gagal menghapus sesi.", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Koneksi gagal menghubungi server.", "error");
        }
      },
      { isDanger: true }
    );
  };

  // Admin Master CRUD - Aspek / Pertanyaan
  const handleOpenQuestionModal = (q: AspekPenilaian) => {
    setQuestionForm({
      id: q.id,
      kategori: q.kategori,
      no_urut: q.no_urut || (q as any).noUrut,
      pertanyaan: q.pertanyaan
    });
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerConfirm(
      "Simpan Butir Pertanyaan?",
      `Apakah Anda yakin ingin memperbaharui deskripsi indikator Butir Ke-${questionForm.no_urut}?`,
      async () => {
        try {
          const res = await fetch("/api/aspek", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: questionForm.id,
              pertanyaan: questionForm.pertanyaan
            })
          });
          if (res.ok) {
            setQuestionModalOpen(false);
            const msg = `Sukses merubah indikator untuk Butir Ke-${questionForm.no_urut || (questionForm as any).noUrut}!`;
            setAspectSuccessMsg(msg);
            showToast(msg, "success");
            setTimeout(() => setAspectSuccessMsg(""), 5000);
            fetchAdminData();
          } else {
            showToast("Gagal menyimpan aspek penilaian.", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Terganggu sambungan jaringan.", "error");
        }
      }
    );
  };

  const getSesiBadge = (kategori: string) => {
    switch (kategori) {
      case 'A': return <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded border border-blue-200">PEMATERI</span>;
      case 'B': return <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded border border-indigo-200">FASILITATOR</span>;
      case 'C': return <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded border border-amber-200">PANITIA</span>;
      case 'D': return <span className="px-1.5 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-700 rounded border border-teal-200">KEGIATAN</span>;
      default: return null;
    }
  };

  const renderRespondentDetailsWidget = () => {
    const q = detailSearchQuery.trim().toLowerCase();
    const catAspects = detailAspects.filter(a => a.kategori === detailActiveCategory);

    const filtered = detailRespondents.filter(r => {
      const matchesSearch = !q ? true : (r.nama_peserta.toLowerCase().includes(q) || r.asal_instansi.toLowerCase().includes(q));
      if (!matchesSearch) return false;

      // Panitia (C) and Kegiatan (D) specific check: Filter out empty score responses
      if (detailActiveCategory === 'C' || detailActiveCategory === 'D') {
        const hasAnyScore = catAspects.some(asp => {
          const score = r.scores[asp.id];
          return score !== undefined && score !== null && score !== "" && score !== "-";
        });
        if (!hasAnyScore) return false;
      }

      return true;
    });

    const handleExportExcel = () => {
      const currentCategoryName = 
        detailActiveCategory === 'A' ? "Pemateri" :
        detailActiveCategory === 'B' ? "Fasilitator" :
        detailActiveCategory === 'C' ? "Panitia" : "Kegiatan";

      triggerConfirm(
        "Ekspor Excel",
        `Apakah Anda yakin ingin mengunduh rekap detail penilaian kategori "${currentCategoryName}" ke berkas Excel (.csv)?`,
        () => {
          try {
            const headers = ["No", "Nama Peserta", "Asal Kampus / Instansi"];
            
            if (detailActiveCategory === 'A') {
              headers.push("Nama Pemateri");
            } else if (detailActiveCategory === 'B') {
              headers.push("Nama Fasilitator");
            }

            catAspects.forEach(asp => {
              const num = asp.no_urut || (asp as any).noUrut;
              headers.push(`B${num}: ${asp.pertanyaan}`);
            });
            headers.push("Detail Kritik, Saran, & Feedback");
            if (detailActiveCategory === 'D') {
              headers.push("Rekomendasi Tindak Lanjut");
              headers.push("Harapan Kedepan");
            }

            const cleanCSVCell = (val: any) => {
              if (val === null || val === undefined) return '""';
              let str = String(val).trim();
              str = str.replace(/"/g, '""');
              str = str.replace(/\r?\n|\r/g, " ");
              return `"${str}"`;
            };

            const rows = filtered.map((r, index) => {
              let commentText = "";
              if (detailActiveCategory === 'A') commentText = r.saran_pemateri;
              else if (detailActiveCategory === 'B') commentText = r.saran_fasilitator;
              else if (detailActiveCategory === 'C') commentText = r.saran_panitia;
              else if (detailActiveCategory === 'D') commentText = r.saran_kegiatan;

              const row = [
                cleanCSVCell(index + 1),
                cleanCSVCell(r.nama_peserta),
                cleanCSVCell(r.asal_instansi)
              ];

              if (detailActiveCategory === 'A') {
                row.push(cleanCSVCell(r.nama_pemateri || "-"));
              } else if (detailActiveCategory === 'B') {
                row.push(cleanCSVCell(r.nama_fasilitator || "-"));
              }

              catAspects.forEach(asp => {
                row.push(cleanCSVCell(r.scores[asp.id] || "-"));
              });

              row.push(cleanCSVCell(commentText));

              if (detailActiveCategory === 'D') {
                row.push(cleanCSVCell(r.tindak_lanjut));
                row.push(cleanCSVCell(r.harapan));
              }

              return row.join(";");
            });

            const headerLine = headers.map(h => cleanCSVCell(h)).join(";");
            const csvContent = "\uFEFF" + "sep=;\n" + [headerLine, ...rows].join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Detail_Penilaian_${currentCategoryName}_Bawaslu_Paser.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Sukses! Berkas Excel (.csv) berhasil diekspor dan diunduh.", "success");
          } catch (e) {
            showToast("Gagal melakukan ekspor data excel.", "error");
          }
        }
      );
    };

    return (
      <div className="space-y-4 font-sans" id="respondent_details_widget_card">
        {/* CATEGORY SELECTORS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200" id="widget_category_selectors">
          <button
            onClick={() => setDetailActiveCategory('A')}
            className={`px-3 py-2 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
              detailActiveCategory === 'A'
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            👤 Pemateri
          </button>
          <button
            onClick={() => setDetailActiveCategory('B')}
            className={`px-3 py-2 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
              detailActiveCategory === 'B'
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            👥 Fasilitator
          </button>
          <button
            onClick={() => setDetailActiveCategory('C')}
            className={`px-3 py-2 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
              detailActiveCategory === 'C'
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            🏢 Panitia
          </button>
          <button
            onClick={() => setDetailActiveCategory('D')}
            className={`px-3 py-2 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
              detailActiveCategory === 'D'
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            🌟 Kegiatan
          </button>
        </div>

        {/* SEARCH & REKAP BAR */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-2xs">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Cari nama peserta atau instansi..."
              value={detailSearchQuery}
              className="w-full text-xs px-3 py-1.5 pl-8 bg-white border border-slate-250 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
              onChange={(e) => setDetailSearchQuery(e.target.value)}
            />
            <div className="absolute left-2.5 top-2.5 text-slate-400 text-[10px]">
              🔍
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={handleExportExcel}
              disabled={filtered.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all ${
                filtered.length === 0
                  ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 cursor-pointer"
              }`}
              id="btn_export_detail_excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Excel (.csv)</span>
            </button>
            
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Total Respon Terfilter: <span className="font-bold text-slate-700 bg-slate-200/60 px-2 py-0.5 rounded-md">{filtered.length}</span> / {detailRespondents.length}
            </div>
          </div>
        </div>

        {/* DATA GRID TABLE */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full border-collapse text-left text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-150">
                  <th className="p-3 w-12 text-center select-none">No</th>
                  <th className="p-3">Nama Peserta</th>
                  <th className="p-3">Kampus / Instansi</th>
                  {detailActiveCategory === 'A' && <th className="p-3">Nama Pemateri</th>}
                  {detailActiveCategory === 'B' && <th className="p-3">Nama Fasilitator</th>}
                  {catAspects.map((asp) => {
                    const num = asp.no_urut || (asp as any).noUrut;
                    return (
                      <th 
                        key={asp.id} 
                        className="p-3 text-center min-w-[70px]"
                        title={asp.pertanyaan}
                      >
                        <div className="cursor-help flex flex-col items-center">
                          <span className="text-slate-800 font-extrabold">B{num}</span>
                          <span className="text-[8px] text-slate-400 normal-case font-normal truncate max-w-[55px] block">{asp.pertanyaan}</span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="p-3 min-w-[250px]">Detail Kritik, Saran, & Feedback</th>
                  {detailActiveCategory === 'D' && (
                    <>
                      <th className="p-3 min-w-[180px]">Rekomendasi Tindak Lanjut</th>
                      <th className="p-3 min-w-[180px]">Harapan Kedepan</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="p-10 text-center text-slate-400 italic">
                      Tidak ada detail penilaian peserta yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r, index) => {
                    let commentText = "";
                    if (detailActiveCategory === 'A') commentText = r.saran_pemateri;
                    else if (detailActiveCategory === 'B') commentText = r.saran_fasilitator;
                    else if (detailActiveCategory === 'C') commentText = r.saran_panitia;
                    else if (detailActiveCategory === 'D') commentText = r.saran_kegiatan;

                    return (
                      <tr key={`rawresp-${r.id}-${index}`} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-3 text-center font-mono text-slate-400 text-[11px] font-semibold">{index + 1}</td>
                        <td className="p-3 font-extrabold text-slate-900">{r.nama_peserta}</td>
                        <td className="p-3 font-bold text-slate-600">{r.asal_instansi}</td>
                        
                        {detailActiveCategory === 'A' && (
                          <td className="p-3 text-slate-800 font-semibold text-xs min-w-[120px]">
                            {r.nama_pemateri || <span className="text-slate-300 italic">-</span>}
                          </td>
                        )}
                        {detailActiveCategory === 'B' && (
                          <td className="p-3 text-slate-800 font-semibold text-xs min-w-[150px]">
                            {r.nama_fasilitator || <span className="text-slate-300 italic">-</span>}
                          </td>
                        )}

                        {catAspects.map((asp) => {
                          const score = r.scores[asp.id];
                          return (
                            <td key={asp.id} className="p-3 text-center">
                              {score ? (
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                                  score >= 4 
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : score === 3
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}>
                                  {score}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-3 text-slate-600 text-[11px] leading-relaxed whitespace-pre-wrap max-w-[280px]">
                          {commentText ? (
                            commentText
                          ) : (
                            <span className="text-slate-300 italic">Tidak ada catatan</span>
                          )}
                        </td>
                        {detailActiveCategory === 'D' && (
                          <>
                            <td className="p-3 text-slate-600 text-[11px] leading-relaxed whitespace-pre-wrap max-w-[220px]">
                              {r.tindak_lanjut ? r.tindak_lanjut : <span className="text-slate-300 italic">-</span>}
                            </td>
                            <td className="p-3 text-slate-600 text-[11px] leading-relaxed whitespace-pre-wrap max-w-[220px]">
                              {r.harapan ? r.harapan : <span className="text-slate-300 italic">-</span>}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-3 border-t border-slate-150 flex flex-col md:flex-row md:items-center justify-between text-[10px] text-slate-400 gap-2 font-medium">
            <div>
              💡 Sorot/Hover judul kolom <strong>B_ (Butir)</strong> untuk membaca butir pertanyaan lengkap.
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-150 border border-green-300"></span> 4 - 5 (Sangat Baik / Baik)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-150 border border-amber-300"></span> 3 (Cukup)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-150 border border-rose-300"></span> 1 - 2 (Kurang / Sangat Kurang)</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col justify-between overflow-x-hidden" id="app_root_wrapper">
      
      {/* HEADER BAR */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shadow-xs sticky top-0 z-50 animate-fadeIn" id="header_container">
        <div className="flex items-center gap-3" id="logo_area">
          <div className="w-10 h-10 bg-rose-600 rounded flex items-center justify-center font-black text-white text-lg tracking-wider shadow-sm" id="brand_badge">B</div>
          <div className="flex flex-col" id="title_headers">
            <h1 className="text-xs sm:text-xs font-extrabold text-slate-900 leading-none uppercase tracking-wider">Bawaslu Paser</h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">Sistem Penilaian Kegiatan Pendidikan Pengawas Partisipatif</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3" id="navigation_toggle_area">
          {/* Active status indicator */}
          {!isAdminMode && activeSessionData && (
            <span className="hidden md:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 bg-green-100 text-green-800 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {activeSessionData.session.nama_sesi.split(" ")[0]} {activeSessionData.session.nama_sesi.split(" ")[1]} Terbuka
            </span>
          )}

          {/* Quick Switch Role button */}
          {isAdminMode ? (
            <button
              id="role_switch_btn"
              onClick={() => navigateTo("/penilaian")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Halaman Penilaian</span>
            </button>
          ) : (
            <button
              id="role_switch_btn"
              onClick={() => navigateTo("/admin")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border bg-slate-900 border-slate-950 text-white hover:bg-slate-800 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-rose-400" />
              <span>Portal Admin</span>
            </button>
          )}
        </div>
      </header>

      {/* RENDER MODE ADMIN */}
      {isAdminMode ? (
        <div className="flex-1 flex flex-col md:flex-row" id="admin_workspace_grid">
          
          {/* MOBILE SIDEBAR TOGGLE HEADER */}
          <div className="md:hidden bg-[#0f172a] border-b border-slate-800 p-3.5 flex justify-between items-center w-full" id="mobile_admin_toggle_header">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-slate-800 flex items-center justify-center text-rose-400 font-bold text-xs border border-slate-700 font-mono">A</div>
              <div>
                <span className="text-xs font-bold text-white block leading-tight">Admin Bawaslu</span>
                <span className="text-[9px] text-slate-400 block">Menu Navigasi Mobile</span>
              </div>
            </div>
            {isAdminLogged && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white cursor-pointer"
                id="btn_hamburger_toggle"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* LATERAL SIDEBAR - ADMIN */}
          <aside className={`w-full md:w-64 bg-[#0f172a] text-slate-300 flex-col border-r border-[#020617] transition-all ${mobileMenuOpen ? "flex animate-slideDown" : "hidden md:flex"}`} id="admin_sidebar_menu">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between" id="sidebar_identity_box">
              <div className="flex items-center gap-2" id="user_profile_box">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-rose-400 font-bold font-mono">A</div>
                <div>
                  <p className="text-xs font-bold text-white leading-none">Admin Bawaslu</p>
                  <p className="text-[10px] text-slate-400">Kabupaten Paser</p>
                </div>
              </div>
              {isAdminLogged && (
                <button 
                  onClick={handleAdminLogout} 
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                  title="Logout Admin"
                  id="btn_signout_lateral"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>

            {isAdminLogged ? (
              <nav className="flex-1 p-3 space-y-1.5" id="admin_nav_links">
                <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Laporan & Live Control</div>
                
                <button
                  onClick={() => {
                    setActiveTab("dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left ${
                    activeTab === "dashboard" 
                      ? "bg-blue-600 text-white shadow-xs" 
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                  id="tab_nav_dash"
                >
                  <Layers className="w-4 h-4" />
                  <span>Dahsboard</span>
                </button>

                <div className="px-3 pt-4 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Manajemen Data Master</div>

                <button
                  onClick={() => {
                    setActiveTab("master-sesi");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left ${
                    activeTab === "master-sesi" 
                      ? "bg-blue-600 text-white shadow-xs" 
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                  id="tab_nav_sesi"
                >
                  <Play className="w-4 h-4" />
                  <span>Pengaturan Sesi & Mapping</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("master-aspek");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left ${
                    activeTab === "master-aspek" 
                      ? "bg-blue-600 text-white shadow-xs" 
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                  id="tab_nav_aspek"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Aspek Penilaian</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("detail-hasil");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left ${
                    activeTab === "detail-hasil" 
                      ? "bg-blue-600 text-white shadow-xs" 
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                  id="tab_nav_detail_hasil"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Detail Hasil Penilaian</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("master-admin");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left ${
                    activeTab === "master-admin" 
                      ? "bg-blue-600 text-white shadow-xs" 
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                  id="tab_nav_admin"
                >
                  <User className="w-4 h-4" />
                  <span>Kelola User Admin</span>
                </button>
              </nav>
            ) : (
              <div className="p-4 text-xs text-slate-400 italic text-center">Silakan login admin terlebih dahulu.</div>
            )}

            <div className="p-4 border-t border-slate-800 bg-[#0b1120]" id="system_status_indicators">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-slate-400 font-medium">Bawaslu Sistem Online</span>
              </div>
            </div>
          </aside>

          {/* MAIN WORKSPACE - ADMIN */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto" id="workspace_viewport">
            
            {/* LOGIN PAGE ADMIN */}
            {!isAdminLogged || activeTab === "login" ? (
              <div className="max-w-md mx-auto my-12 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden" id="login_card">
                <div className="bg-[#0f172a] p-6 text-center text-white" id="login_card_banner">
                  <div className="w-12 h-12 bg-rose-600 rounded-lg mx-auto flex items-center justify-center font-bold text-white text-xl mb-3 shadow">B</div>
                  <h2 className="text-lg font-extrabold">Portal Log Masuk Admin Bawaslu</h2>
                  <p className="text-xs text-slate-400 mt-1">Sistem Penilaian Kegiatan Bawaslu Paser</p>
                </div>
                
                <form onSubmit={handleAdminLogin} className="p-6 space-y-4" id="form_login_admin">
                  {loginError && (
                    <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded" id="div_login_err">
                      {loginError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Username Admin</label>
                    <input 
                      type="text" 
                      placeholder="Masukkan username e.g. admin"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      id="input_login_user"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Kata Sandi / PIN</label>
                    <input 
                      type="password" 
                      placeholder="Masukkan sandi..."
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      id="input_login_pass"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-2 bg-rose-600 text-white text-sm font-extrabold rounded-lg hover:bg-rose-700 transition-colors shadow shadow-rose-200 mt-6 cursor-pointer"
                    id="submit_admin_login"
                  >
                    Masuk Sekarang
                  </button>
                </form>
              </div>
            ) : null}

            {/* LIVE DASHBOARD TAB */}
            {isAdminLogged && activeTab === "dashboard" && (
              <div className="space-y-6" id="dashboard_tab_viewport">
                
                {/* PAGE HEADER */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-300 pb-4" id="header_section">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900" id="dash_title">Dashboard Monitoring</h2>
                    <p className="text-xs text-slate-500">Rekapitulasi nilai evaluasi dan kepuasan peserta diklat secara real-time.</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={fetchAdminData}
                      className="flex items-center gap-1 bg-white border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                      id="btn_refresh_admin"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh Data</span>
                    </button>
                    
                    <a
                      href="/api/export-csv"
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                      id="btn_quick_export"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Ekspor Rekap CSV</span>
                    </a>
                  </div>
                </div>

                {/* CENTRALIZED LIVE SESSIONS CONTROLLER PANEL */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard_grid_row_1">
                  
                  {/* MINI STATS CARDS & CHART */}
                  <div className="lg:col-span-12 space-y-6 flex flex-col justify-between" id="dashboard_rekap_charts_area">
                    
                    {/* STATS COUNT */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" id="metric_banner_panel">
                      
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs" id="card_stat_responden">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-slate-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Responden</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 mt-1">{rekap?.totalPesertaEvaluasi || 0} <span className="text-[10px] text-slate-400 font-normal">Selesai</span></div>
                        <p className="text-[9px] text-slate-400 italic mt-1.5">Jumlah pengisian kuesioner</p>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs border-l-4 border-l-blue-500" id="card_stat_pema_overall">
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="w-4 h-4 text-blue-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rata-rata Pemateri</span>
                        </div>
                        <div className="text-2xl font-black text-blue-700 mt-1">{(rekap?.overallStats.pemateri_avg_overall || 0).toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/ 5.0</span></div>
                        <p className="text-[9px] text-slate-400 italic mt-1.5">Skor Kinerja Pemateri</p>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs border-l-4 border-l-indigo-500" id="card_stat_fasi_overall">
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="w-4 h-4 text-indigo-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rata-rata Fasilitator</span>
                        </div>
                        <div className="text-2xl font-black text-indigo-700 mt-1">{(rekap?.overallStats.fasilitator_avg_overall || 0).toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/ 5.0</span></div>
                        <p className="text-[9px] text-slate-400 italic mt-1.5">Skor Kinerja Fasilitator</p>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs border-l-4 border-l-amber-500" id="card_stat_pani_overall">
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rata-rata Panitia</span>
                        </div>
                        <div className="text-2xl font-black text-amber-700 mt-1">{(rekap?.overallStats.panitia_avg_overall || 0).toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/ 5.0</span></div>
                        <p className="text-[9px] text-slate-400 italic mt-1.5">Layanan Panitia Pelaksana</p>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs border-l-4 border-l-teal-500" id="card_stat_keg_overall">
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="w-4 h-4 text-teal-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rata-rata Kegiatan</span>
                        </div>
                        <div className="text-2xl font-black text-teal-700 mt-1">{(rekap?.overallStats.kegiatan_avg_overall || 0).toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/ 5.0</span></div>
                        <p className="text-[9px] text-slate-400 italic mt-1.5">Keseluruhan Kegiatan Diklat</p>
                      </div>

                    </div>

                    {/* SEGMENTED SUB-TABS NAVIGATION CONTROLS */}
                    <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex flex-wrap gap-1" id="sub_dashboard_segmented_tabs">
                      <button
                        onClick={() => setActiveSubTab("perbandingan")}
                        className={`flex-1 min-w-[120px] py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          activeSubTab === "perbandingan"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        📊 Perbandingan Sesi
                      </button>
                      <button
                        onClick={() => setActiveSubTab("pemateri")}
                        className={`flex-1 min-w-[120px] py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          activeSubTab === "pemateri"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        👤 Pemateri
                      </button>
                      <button
                        onClick={() => setActiveSubTab("fasilitator")}
                        className={`flex-1 min-w-[120px] py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          activeSubTab === "fasilitator"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        👥 Fasilitator
                      </button>
                      <button
                        onClick={() => setActiveSubTab("panitia")}
                        className={`flex-1 min-w-[120px] py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          activeSubTab === "panitia"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        🏢 Panitia
                      </button>
                      <button
                        onClick={() => setActiveSubTab("kegiatan")}
                        className={`flex-1 min-w-[120px] py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          activeSubTab === "kegiatan"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        🌟 Kegiatan
                      </button>
                    </div>

                    {/* SUB-DASHBOARD CONTENTS */}

                    {/* SUB-TAB 1: PERBANDINGAN SESI */}
                    {activeSubTab === "perbandingan" && (
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 animate-fadeIn" id="subtab_perbandingan_content">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Grafik Live Perbandingan Sesi</span>
                            <p className="text-[10px] text-slate-400">Nilai tengah evaluasi kinerja narasumber & pendamping untuk tiap sesi agenda.</p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-[9px] font-semibold">
                            <span className="flex items-center gap-1 text-slate-600"><span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span> Pemateri</span>
                            <span className="flex items-center gap-1 text-slate-600"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm"></span> Fasilitator</span>
                          </div>
                        </div>

                        <div className="h-[220px]" id="recap_recharts_chart">
                          {rekap && rekap.sessionStats && sessions.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={sessions.map((s) => {
                                  const stats = rekap.sessionStats[s.id];
                                  const truncName = s.nama_sesi.split(" ")[0] + " " + (s.nama_sesi.split(" ")[1] || "");
                                  return {
                                    name: truncName,
                                    Pemateri: stats ? stats.pemateri_avg : 0,
                                    Fasilitator: stats ? stats.fasilitator_avg : 0
                                  };
                                })}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                                <Bar dataKey="Pemateri" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                                <Bar dataKey="Fasilitator" fill="#6366f1" radius={[2, 2, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">Belum ada statistik visual penilai.</div>
                          )}
                        </div>

                        {/* DATA TABLE COMPARISON */}
                        <div className="border border-slate-150 rounded-lg overflow-hidden w-full overflow-x-auto">
                          <table className="w-full text-left text-xs min-w-[540px] sm:min-w-0">
                            <thead>
                              <tr className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-150">
                                <th className="p-2.5">Sesi Agenda</th>
                                <th className="p-2.5 text-center">Responden</th>
                                <th className="p-2.5 text-blue-600 text-center">Rata-rata Pemateri</th>
                                <th className="p-2.5 text-indigo-600 text-center">Rata-rata Fasilitator</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150 text-slate-700">
                              {sessions.map(s => {
                                const stats = rekap?.sessionStats?.[s.id];
                                return (
                                  <tr key={s.id} className="hover:bg-slate-50/50">
                                    <td className="p-2.5 font-bold text-slate-900">{s.nama_sesi}</td>
                                    <td className="p-2.5 text-center font-semibold text-slate-500">{stats?.peserta_count || 0}</td>
                                    <td className="p-2.5 text-center font-extrabold text-blue-600 bg-blue-50/10">{stats?.pemateri_avg ? stats.pemateri_avg.toFixed(2) : "0.00"}</td>
                                    <td className="p-2.5 text-center font-extrabold text-indigo-600 bg-indigo-50/10">{stats?.fasilitator_avg ? stats.fasilitator_avg.toFixed(2) : "0.00"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* DESCRIPTIVE NOTICE FOR STANDALONE PANITIA & KEGIATAN */}
                        <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-lg text-[10px] text-amber-900 flex items-start gap-2">
                          <span className="font-extrabold text-amber-600 uppercase block select-none mt-0.5">ℹ️ INFO HASIL MANDIRI:</span>
                          <p className="leading-relaxed">
                            Penilaian untuk <strong>Panitia Pelaksana</strong> dan <strong>Keseluruhan Kegiatan</strong> hanya dilakukan sekali oleh masing-masing peserta. Hasil evaluasi kumulatifnya disajikan secara terpisah pada tab <strong>🏢 Panitia</strong> dan <strong>🌟 Kegiatan</strong> di atas agar terhindar dari bias pembagian per sesi agenda.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 2: DETAIL PEMATERI */}
                    {activeSubTab === "pemateri" && (() => {
                      const selSession = sessions.find(s => s.id === selectedPemateriSesiId);
                      const stats = rekap?.sessionStats?.[selectedPemateriSesiId];
                      const aspectsData = PEMATERI_ASPECTS.map(asp => ({
                        name: asp.label,
                        fullDesc: asp.desc,
                        "Skor Rata-rata": rekap?.sessionAspectStats?.[selectedPemateriSesiId]?.[asp.id] || 0
                      }));
                      const comments = feedbacks.filter(f => f.nama_sesi === selSession?.nama_sesi && f.saran_pemateri && f.saran_pemateri.trim() !== "");

                      return (
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5 animate-fadeIn" id="subtab_pemateri_content">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                            <div>
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Sub-Evaluasi Pemateri</span>
                              <h3 className="text-sm font-black text-slate-800">Analisis Kinerja Pemateri / Narasumber</h3>
                            </div>
                            
                            {/* Session selector */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400">Pilih Sesi/Pemateri:</span>
                              <select
                                value={selectedPemateriSesiId}
                                onChange={e => setSelectedPemateriSesiId(Number(e.target.value))}
                                className="px-2 py-1 text-xs font-bold border rounded-lg bg-white text-slate-700 focus:outline-none focus:border-blue-500"
                              >
                                {sessions.map(s => (
                                  <option key={s.id} value={s.id}>{s.nama_sesi.split(" ")[0]} ({s.nama_pemateri || "N/A"})</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {selSession ? (
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                              
                              {/* Left profile info & aspects bar chart */}
                              <div className="md:col-span-7 space-y-4">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                                  <div>
                                    <span className="text-[9px] font-extrabold text-slate-400 uppercase">Nama Narasumber Sesi</span>
                                    <h4 className="text-xs font-black text-slate-800">{selSession.nama_pemateri || "N/A"}</h4>
                                    <p className="text-[10px] text-slate-500">{selSession.nama_sesi}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[9px] font-extrabold text-blue-500 uppercase block">Rerata Skor</span>
                                    <span className="text-xl font-black text-blue-700">{stats?.pemateri_avg ? stats.pemateri_avg.toFixed(2) : "0.00"}/5.0</span>
                                    <span className="text-[8px] text-slate-400 block">{stats?.peserta_count || 0} responden</span>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Skor Unsur Penilaian (U-1 s/d U-6)</span>
                                  <div className="h-[180px] border border-slate-50 rounded-lg p-2 bg-slate-50/30">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={aspectsData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                                        <YAxis domain={[0, 5]} tick={{ fontSize: 9 }} />
                                        <Tooltip 
                                          contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                                          formatter={(value, name, props) => [`${value} / 5.00`, "Skor"]}
                                          labelFormatter={(value) => {
                                            const item = aspectsData.find(d => d.name === value);
                                            return `${value}: ${item ? item.fullDesc : ""}`;
                                          }}
                                        />
                                        <Bar dataKey="Skor Rata-rata" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                          {aspectsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry["Skor Rata-rata"] >= 4 ? "#2563eb" : entry["Skor Rata-rata"] >= 3 ? "#3b82f6" : "#f43f5e"} />
                                          ))}
                                        </Bar>
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>

                                {/* Custom Legend description */}
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2 bg-slate-50 rounded-lg text-[9px] text-slate-500 whitespace-normal">
                                  {PEMATERI_ASPECTS.map(asp => (
                                    <div key={asp.id} className="flex gap-1 items-start">
                                      <span className="font-extrabold text-blue-600 block min-w-[20px]">{asp.label}:</span>
                                      <span className="truncate" title={asp.desc}>{asp.desc}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Right Feedback list specific to Pemateri narasumber */}
                              <div className="md:col-span-5 flex flex-col justify-between">
                                <div className="space-y-2 flex-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                                    Komentar & Saran Peserta ({comments.length})
                                  </span>
                                  
                                  <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                                    {comments.length === 0 ? (
                                      <div className="py-8 bg-slate-50 border border-dashed rounded-lg text-center text-slate-400 text-[11px] italic">
                                        Belum ada saran atau kritik khusus pemateri yang tertulis untuk sesi ini.
                                      </div>
                                    ) : (
                                      comments.map(c => (
                                        <div key={c.id} className="p-3 bg-blue-50/20 border border-blue-50/50 rounded-xl space-y-1">
                                          <p className="text-[11px] italic text-slate-600 font-medium leading-relaxed">"{c.saran_pemateri}"</p>
                                          <div className="flex justify-between items-center text-[9px] text-slate-400">
                                            <span className="font-bold">{c.nama_peserta}</span>
                                            <span>{c.asal_instansi}</span>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>

                            </div>
                          ) : (
                            <div className="text-center py-6 text-slate-400 text-xs italic">Silakan buat modul sesi terlebih dahulu.</div>
                          )}
                        </div>
                      );
                    })()}

                    {/* SUB-TAB 3: DETAIL FASILITATOR (B) */}
                    {activeSubTab === "fasilitator" && (() => {
                      const selSession = sessions.find(s => s.id === selectedFasilitatorSesiId);
                      const stats = rekap?.sessionStats?.[selectedFasilitatorSesiId];
                      const aspectsData = FASILITATOR_ASPECTS.map(asp => ({
                        name: asp.label,
                        fullDesc: asp.desc,
                        "Skor Rata-rata": rekap?.sessionAspectStats?.[selectedFasilitatorSesiId]?.[asp.id] || 0
                      }));
                      const comments = feedbacks.filter(f => f.nama_sesi === selSession?.nama_sesi && f.saran_fasilitator && f.saran_fasilitator.trim() !== "");

                      return (
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5 animate-fadeIn" id="subtab_fasilitator_content">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                            <div>
                              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Sub-Evaluasi Fasilitator</span>
                              <h3 className="text-sm font-black text-slate-800">Analisis Kinerja Fasilitator / Moderator</h3>
                            </div>
                            
                            {/* Session selector */}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400">Pilih Sesi/Fasilitator:</span>
                              <select
                                value={selectedFasilitatorSesiId}
                                onChange={e => setSelectedFasilitatorSesiId(Number(e.target.value))}
                                className="px-2 py-1 text-xs font-bold border rounded-lg bg-white text-slate-700 focus:outline-none focus:border-indigo-500"
                              >
                                {sessions.map(s => (
                                  <option key={s.id} value={s.id}>{s.nama_sesi.split(" ")[0]} ({s.nama_fasilitator || "N/A"})</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {selSession ? (
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                              
                              {/* Left profile info & aspects bar chart */}
                              <div className="md:col-span-7 space-y-4">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                                  <div>
                                    <span className="text-[9px] font-extrabold text-slate-400 uppercase">Nama Fasilitator Sesi</span>
                                    <h4 className="text-xs font-black text-slate-800">{selSession.nama_fasilitator || "N/A"}</h4>
                                    <p className="text-[10px] text-slate-500">{selSession.nama_sesi}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[9px] font-extrabold text-indigo-500 uppercase block">Rerata Skor</span>
                                    <span className="text-xl font-black text-indigo-700">{stats?.fasilitator_avg ? stats.fasilitator_avg.toFixed(2) : "0.00"}/5.0</span>
                                    <span className="text-[8px] text-slate-400 block">{stats?.peserta_count || 0} responden</span>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Skor Unsur Penilaian (U-1 s/d U-5)</span>
                                  <div className="h-[180px] border border-slate-50 rounded-lg p-2 bg-slate-50/30">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={aspectsData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                                        <YAxis domain={[0, 5]} tick={{ fontSize: 9 }} />
                                        <Tooltip 
                                          contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                                          formatter={(value, name, props) => [`${value} / 5.00`, "Skor"]}
                                          labelFormatter={(value) => {
                                            const item = aspectsData.find(d => d.name === value);
                                            return `${value}: ${item ? item.fullDesc : ""}`;
                                          }}
                                        />
                                        <Bar dataKey="Skor Rata-rata" fill="#6366f1" radius={[4, 4, 0, 0]}>
                                          {aspectsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry["Skor Rata-rata"] >= 4 ? "#4f46e5" : entry["Skor Rata-rata"] >= 3 ? "#6366f1" : "#ec4899"} />
                                          ))}
                                        </Bar>
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>

                                {/* Custom Legend description */}
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2 bg-slate-50 rounded-lg text-[9px] text-slate-500 whitespace-normal">
                                  {FASILITATOR_ASPECTS.map(asp => (
                                    <div key={asp.id} className="flex gap-1 items-start">
                                      <span className="font-extrabold text-indigo-600 block min-w-[20px]">{asp.label}:</span>
                                      <span className="truncate" title={asp.desc}>{asp.desc}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Right Feedback list specific to Fasilitator */}
                              <div className="md:col-span-5 flex flex-col justify-between">
                                <div className="space-y-2 flex-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                                    <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                                    Masukan & Saran Peserta ({comments.length})
                                  </span>
                                  
                                  <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                                    {comments.length === 0 ? (
                                      <div className="py-8 bg-slate-50 border border-dashed rounded-lg text-center text-slate-400 text-[11px] italic">
                                        Belum ada saran atau kritik khusus fasilitator yang tertulis untuk sesi ini.
                                      </div>
                                    ) : (
                                      comments.map(c => (
                                        <div key={c.id} className="p-3 bg-indigo-50/20 border border-indigo-50/50 rounded-xl space-y-1">
                                          <p className="text-[11px] italic text-slate-600 font-medium leading-relaxed">"{c.saran_fasilitator}"</p>
                                          <div className="flex justify-between items-center text-[9px] text-slate-400">
                                            <span className="font-bold">{c.nama_peserta}</span>
                                            <span>{c.asal_instansi}</span>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>

                            </div>
                          ) : (
                            <div className="text-center py-6 text-slate-400 text-xs italic">Silakan buat modul sesi terlebih dahulu.</div>
                          )}
                        </div>
                      );
                    })()}

                    {/* SUB-TAB 4: PENILAIAN PANITIA (C) */}
                    {activeSubTab === "panitia" && (() => {
                      const aspectsData = PANITIA_ASPECTS.map(asp => {
                        const match = rekap?.charts?.panitiaByAspect?.find(p => p.name === `U-${asp.id - 11}`);
                        return {
                          name: asp.label,
                          fullDesc: asp.desc,
                          "Skor Rata-rata": match ? match.avgScore : 0
                        };
                      });
                      const comments = feedbacks.filter(f => f.saran_panitia && f.saran_panitia.trim() !== "");

                      return (
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5 animate-fadeIn" id="subtab_panitia_content">
                          <div className="border-b border-slate-100 pb-3">
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Sub-Evaluasi Panitia</span>
                            <h3 className="text-sm font-black text-slate-800">Evaluasi Kinerja Pelayanan Panitia / Kesekretariatan</h3>
                            <p className="text-[10px] text-slate-400">Data gabungan dari seluruh sesi pelaksanaan diklat pengawasan.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                            {/* Left part: overall aspects chart */}
                            <div className="md:col-span-7 space-y-4">
                              <div className="bg-amber-50/30 border border-amber-100 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                  <h4 className="text-xs font-black text-slate-800">Pelayanan Panitia Bawaslu Paser</h4>
                                  <p className="text-[10px] text-slate-500">Kumulatif dari seluruh koresponden terdaftar</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] font-extrabold text-amber-500 uppercase block">Rerata Kumulatif</span>
                                  <span className="text-xl font-black text-amber-700">{(rekap?.overallStats.panitia_avg_overall || 0).toFixed(2)}/5.0</span>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Skor Unsur Layanan (U-1 s/d U-6)</span>
                                <div className="h-[180px] border border-slate-50 rounded-lg p-2 bg-slate-50/30">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={aspectsData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                                      <YAxis domain={[0, 5]} tick={{ fontSize: 9 }} />
                                      <Tooltip 
                                        contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                                        formatter={(value, name, props) => [`${value} / 5.00`, "Skor"]}
                                        labelFormatter={(value) => {
                                          const item = aspectsData.find(d => d.name === value);
                                          return `${value}: ${item ? item.fullDesc : ""}`;
                                        }}
                                      />
                                      <Bar dataKey="Skor Rata-rata" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                                        {aspectsData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry["Skor Rata-rata"] >= 4 ? "#d97706" : entry["Skor Rata-rata"] >= 3 ? "#f59e0b" : "#f43f5e"} />
                                        ))}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>

                              {/* Aspect labels layout */}
                              <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2 bg-slate-50 rounded-lg text-[9px] text-slate-500">
                                {PANITIA_ASPECTS.map(asp => (
                                  <div key={asp.id} className="flex gap-1 items-start">
                                    <span className="font-extrabold text-amber-600 block min-w-[20px]">{asp.label}:</span>
                                    <span className="truncate" title={asp.desc}>{asp.desc}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Right part: suggestions */}
                            <div className="md:col-span-5 flex flex-col justify-between">
                              <div className="space-y-2 flex-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                                  <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                                  Usulan & Evaluasi Panitia ({comments.length})
                                </span>
                                
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                  {comments.length === 0 ? (
                                    <div className="py-8 bg-slate-50 border border-dashed rounded-lg text-center text-slate-400 text-[11px] italic">
                                      Belum ada saran kritis/masukan khusus panitia pelaksana.
                                    </div>
                                  ) : (
                                    comments.map(c => (
                                      <div key={c.id} className="p-3 bg-amber-50/10 border border-amber-50 rounded-xl space-y-1">
                                        <p className="text-[11px] italic text-slate-600 font-medium leading-relaxed">"{c.saran_panitia}"</p>
                                        <div className="flex justify-between items-center text-[9px] text-slate-400">
                                          <span className="font-bold">{c.nama_peserta}</span>
                                          <span>Sesi: {c.nama_sesi.split(" ")[0]}</span>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* SUB-TAB 5: PENILAIAN SELURUH KEGIATAN (D) */}
                    {activeSubTab === "kegiatan" && (() => {
                      const aspectsData = KEGIATAN_ASPECTS.map(asp => {
                        const match = rekap?.charts?.kegiatanByAspect?.find(k => k.name === `U-${asp.id - 17}`);
                        return {
                          name: asp.label,
                          fullDesc: asp.desc,
                          "Skor Rata-rata": match ? match.avgScore : 0
                        };
                      });

                      // Extract qualitative responses
                      const tlList = feedbacks.filter(f => f.tindak_lanjut && f.tindak_lanjut.trim() !== "");
                      const wishesList = feedbacks.filter(f => f.harapan && f.harapan.trim() !== "");

                      return (
                        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6 animate-fadeIn" id="subtab_kegiatan_content">
                          <div className="border-b border-slate-100 pb-3">
                            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block">Sub-Evaluasi Kegiatan</span>
                            <h3 className="text-sm font-black text-slate-800">Evaluasi Menyeluruh & Komitmen Luaran Pelatihan</h3>
                            <p className="text-[10px] text-slate-400">Hasil tinjauan efektivitas, kegunaan materi, tindak lanjut pengawasan partisipatif pasca kegiatan.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            {/* Graphic area */}
                            <div className="md:col-span-6 space-y-4">
                              <div className="bg-teal-50/30 border border-teal-100 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                  <h4 className="text-xs font-black text-slate-800">Tingkat Kepuasan Kegiatan (Overall)</h4>
                                  <p className="text-[10px] text-slate-500">Tinjauan manfaat & ketercapaian target</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] font-extrabold text-teal-500 uppercase block">Rerata Skor</span>
                                  <span className="text-xl font-black text-teal-700">{(rekap?.overallStats.kegiatan_avg_overall || 0).toFixed(2)}/5.0</span>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Skor Unsur Kegiatan (U-1 s/d U-3)</span>
                                <div className="h-[150px] border border-slate-50 rounded-lg p-2 bg-slate-50/30">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={aspectsData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                                      <YAxis domain={[0, 5]} tick={{ fontSize: 9 }} />
                                      <Tooltip 
                                        contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                                        formatter={(value, name, props) => [`${value} / 5.00`, "Skor"]}
                                        labelFormatter={(value) => {
                                          const item = aspectsData.find(d => d.name === value);
                                          return `${value}: ${item ? item.fullDesc : ""}`;
                                        }}
                                      />
                                      <Bar dataKey="Skor Rata-rata" fill="#14b8a6" radius={[4, 4, 0, 0]}>
                                        {aspectsData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry["Skor Rata-rata"] >= 4 ? "#0d9488" : entry["Skor Rata-rata"] >= 3 ? "#14b8a6" : "#f43f5e"} />
                                        ))}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>

                              <div className="space-y-1 bg-slate-50 p-2 rounded-lg text-[9px] text-slate-500">
                                {KEGIATAN_ASPECTS.map(asp => (
                                  <div key={asp.id} className="flex gap-1 items-start">
                                    <span className="font-extrabold text-teal-600 block min-w-[20px]">{asp.label}:</span>
                                    <span>{asp.desc}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Qualitative summary statistics card */}
                            <div className="md:col-span-6 bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                              <div className="text-center py-4 bg-white/60 rounded-lg border border-dashed border-slate-200">
                                <Sparkles className="w-4 h-4 text-teal-600 mx-auto mb-1" />
                                <span className="font-bold text-slate-700 text-xs">Analisis Kualitatif & Rekomendasi</span>
                                <p className="text-[10px] text-slate-400 mt-0.5">Pantau rencana implementasi taktis dan komitmen pasca pelatihan di bawah ini.</p>
                              </div>

                              <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="p-3 bg-white rounded-lg border border-slate-100 text-center shadow-2xs">
                                  <span className="text-xl font-black text-teal-600 block">{tlList.length}</span>
                                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block mt-1">Saran / TL Masuk</span>
                                </div>
                                <div className="p-3 bg-white rounded-lg border border-slate-100 text-center shadow-2xs">
                                  <span className="text-xl font-black text-indigo-600 block">{wishesList.length}</span>
                                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block mt-1">Harapan / Usulan</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* BENTO GRID: TINDAK LANJUT / KOMITMEN VS HARAPAN / USULAN */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-100" id="comitment_wishes_bento">
                            
                            {/* Tindak Lanjut & Komitmen */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-1.5 bg-rose-50 text-rose-800 px-3 py-1.5 rounded-lg border border-rose-100">
                                <CheckCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span className="text-xs font-black uppercase tracking-wider block">Saran Komitmen & Tindak Lanjut Peserta</span>
                              </div>
                              <p className="text-[10px] text-slate-500 italic">Rencana aksi nyata yang akan dilakukan peserta pasca kegiatan:</p>
                              
                              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {tlList.length === 0 ? (
                                  <div className="text-center py-10 bg-slate-50 border border-dashed text-slate-400 text-xs italic rounded-lg">
                                    Belum ada data komitmen rencana tindak lanjut yang terekam.
                                  </div>
                                ) : (
                                  tlList.map((f, i) => (
                                    <div key={`tl-${f.id}-${i}`} className="p-3 bg-white hover:bg-slate-50 border border-slate-200/60 rounded-lg shadow-2xs transition-colors">
                                      <p className="text-[11px] font-semibold text-slate-800 leading-relaxed italic">"{f.tindak_lanjut}"</p>
                                      <div className="flex justify-between items-center text-[9px] text-slate-400 mt-2">
                                        <span className="font-extrabold text-slate-600">{f.nama_peserta}</span>
                                        <span>{f.asal_instansi}</span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Harapan / Usulan */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-800 px-3 py-1.5 rounded-lg border border-indigo-100">
                                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                                <span className="text-xs font-black uppercase tracking-wider block">Harapan & Usulan Kegiatan Berikutnya</span>
                              </div>
                              <p className="text-[10px] text-slate-500 italic">Aspirasi topik, metode, serta usulan konstruktif untuk kegiatan mendatang:</p>
                              
                              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {wishesList.length === 0 ? (
                                  <div className="text-center py-10 bg-slate-50 border border-dashed text-slate-400 text-xs italic rounded-lg">
                                    Belum ada aspirasi harapan/usulan kegiatan berikutnya yang terekam.
                                  </div>
                                ) : (
                                  wishesList.map((f, i) => (
                                    <div key={`wish-${f.id}-${i}`} className="p-3 bg-white hover:bg-slate-50 border border-slate-200/60 rounded-lg shadow-2xs transition-colors">
                                      <p className="text-[11px] font-semibold text-slate-800 leading-relaxed italic">"{f.harapan}"</p>
                                      <div className="flex justify-between items-center text-[9px] text-slate-400 mt-2">
                                        <span className="font-extrabold text-slate-600">{f.nama_peserta}</span>
                                        <span>{f.asal_instansi}</span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })()}

                  </div>

                </div>

                {/* RINCIAN RESPONDEN DI BAGIAN PALING BAWAH DASHBOARD */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 mt-6" id="dashboard_detailed_reports_section">
                  <div className="border-b border-slate-150 pb-3">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-rose-600" />
                      <span>Rincian Lengkap Hasil Penilaian Responden</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">Tabel tabulasi data mentah / raw dan saran yang diisi oleh masing-masing peserta diklat.</p>
                  </div>
                  {renderRespondentDetailsWidget()}
                </div>

              </div>
            )}

            {/* MASTER DATA SESI & MAPPING TAB */}
            {isAdminLogged && activeTab === "master-sesi" && (
              <div className="space-y-6" id="master_sesi_tab_viewport">
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-300 pb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Manajemen Data Sesi & Form Mapping</h2>
                    <p className="text-xs text-slate-500">Sesuaikan atau tambah daftar Sesi Kegiatan utama, nama pemateri/fasilitator, serta seting visibilitas sub-form.</p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        if (confirm("Apakah Anda yakin ingin menonaktifkan seluruh sesi kuesioner yang sedang aktif?")) {
                          handleDeactivateAll();
                        }
                      }}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs cursor-pointer transition-all"
                      id="btn_deactivate_all_sessions"
                    >
                      <Power className="w-3.5 h-3.5 text-rose-600" />
                      <span>Matikan Semua Sesi</span>
                    </button>

                    <button
                      onClick={() => handleOpenSessionModal()}
                      className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                      id="btn_add_session_modal"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Aksi Sesi Baru</span>
                    </button>
                  </div>
                </div>

                {/* MODUL KEGIATAN UTAMA EDITOR */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs" id="kegiatan_utama_editor_module">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider block">ID Kegiatan Utama (Bawaslu Agenda)</h4>
                      <p className="text-xs text-slate-700 font-bold mt-1 inline-block bg-slate-100 px-2.5 py-1 rounded border border-slate-200">{kegiatanForm.judul || "Mengambil judul..."}</p>
                    </div>
                    <button
                      onClick={() => setShowKegiatanEditor(!showKegiatanEditor)}
                      className="px-2.5 py-1 border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 text-xs rounded-lg cursor-pointer"
                    >
                      {showKegiatanEditor ? "Sembunyikan Form" : "Edit Nama Kegiatan"}
                    </button>
                  </div>

                  {showKegiatanEditor && (
                    <form onSubmit={handleUpdateKegiatan} className="mt-4 p-4 bg-slate-50 border rounded-lg space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Judul Agenda Utuh</label>
                        <input
                          type="text"
                          required
                          value={kegiatanForm.judul}
                          onChange={e => setKegiatanForm(prev => ({ ...prev, judul: e.target.value }))}
                          className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Deskripsi Kegiatan</label>
                        <textarea
                          rows={2}
                          value={kegiatanForm.deskripsi}
                          onChange={e => setKegiatanForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                          className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowKegiatanEditor(false)}
                          className="px-3 py-1 text-xs border rounded-lg cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Simpan Perubahan
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* SESSIONS TABLE */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 border-b border-slate-200 text-[9px] font-bold uppercase tracking-wider">
                        <th className="p-4">ID / No</th>
                        <th className="p-4">Nama Sesi & Judul</th>
                        <th className="p-4">Pemateri</th>
                        <th className="p-4">Fasilitator</th>
                        <th className="p-4">Mapping Form Aktif</th>
                        <th className="p-4">Status Live</th>
                        <th className="p-4 text-center">Operasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sessions.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-slate-50 text-slate-700">
                          <td className="p-4 font-bold text-slate-400">{s.id}</td>
                          <td className="p-4">
                            <span className="block font-bold text-slate-900">{s.nama_sesi}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">Ditambahkan otomatis pada master</span>
                          </td>
                          <td className="p-4">
                            <span className="block font-semibold text-slate-800">{s.nama_pemateri || "N/A"}</span>
                            {s.show_pemateri ? (
                              <span className="text-[9px] text-green-600 font-bold bg-green-50 px-1 py-0.2 rounded">Dinilai</span>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-bold bg-slate-50 px-1 py-0.2 rounded">Sembunyi</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="block font-semibold text-slate-800">{s.nama_fasilitator || "N/A"}</span>
                            {s.show_fasilitator ? (
                              <span className="text-[9px] text-green-600 font-bold bg-green-50 px-1 py-0.2 rounded">Dinilai</span>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-bold bg-slate-50 px-1 py-0.2 rounded">Sembunyi</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {s.show_pemateri && <span className="bg-blue-50 text-blue-600 text-[9px] px-1 py-0.2 rounded font-bold">PEMATERI (A)</span>}
                              {s.show_fasilitator && <span className="bg-indigo-50 text-indigo-600 text-[9px] px-1 py-0.2 rounded font-bold">FASILITATOR (B)</span>}
                              {s.show_panitia && <span className="bg-amber-50 text-amber-600 text-[9px] px-1 py-0.2 rounded font-bold">PANITIA (C)</span>}
                              {s.show_kegiatan && <span className="bg-teal-50 text-teal-600 text-[9px] px-1 py-0.2 rounded font-bold">KEGIATAN (D)</span>}
                            </div>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleSession(s.id, s.status_aktif)}
                              className={`flex items-center gap-1 text-[10px] font-extrabold px-2 py-1 rounded-full cursor-pointer transition-all ${
                                s.status_aktif 
                                  ? "bg-green-100 text-green-800 border border-green-300"
                                  : "bg-slate-100 text-slate-500 border border-slate-200"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${s.status_aktif ? "bg-green-600 animate-pulse" : "bg-slate-400"}`}></span>
                              <span>{s.status_aktif ? "AKTIF / LIVE" : "MATI / DRAFT"}</span>
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenSessionModal(s)}
                                className="p-1 hover:bg-slate-100 text-blue-600 rounded cursor-pointer"
                                title="Edit Sesi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSession(s.id)}
                                className="p-1 hover:bg-slate-100 text-rose-600 rounded cursor-pointer"
                                title="Hapus Sesi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MODAL EDIT / ADD SESSIONS */}
                {sessionModalOpen && (
                  <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl border w-full max-w-lg p-6 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                        <h3 className="text-sm font-extrabold text-slate-900">{sessionForm.id ? "Edit Detail Sesi Penilaian" : "Tambah Sesi Kegiatan Baru"}</h3>
                        <button onClick={() => setSessionModalOpen(false)} className="text-slate-400 text-xs font-bold hover:text-slate-700 cursor-pointer">✕</button>
                      </div>

                      <form onSubmit={handleSaveSession} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Nama / Judul Sesi Penilai</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Sesi 4 (Wewenang & Pelanggaran)"
                            value={sessionForm.nama_sesi}
                            onChange={e => setSessionForm(prev => ({ ...prev, nama_sesi: e.target.value }))}
                            className="w-full px-3 py-1.5 border rounded-lg text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">Nama Pemateri</label>
                            <input
                              type="text"
                              value={sessionForm.nama_pemateri}
                              onChange={e => setSessionForm(prev => ({ ...prev, nama_pemateri: e.target.value }))}
                              placeholder="Ketik Nama Pemateri..."
                              className="w-full px-3 py-1.5 border rounded-lg text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">Nama Fasilitator</label>
                            <input
                              type="text"
                              value={sessionForm.nama_fasilitator}
                              onChange={e => setSessionForm(prev => ({ ...prev, nama_fasilitator: e.target.value }))}
                              placeholder="Ketik Nama Fasilitator..."
                              className="w-full px-3 py-1.5 border rounded-lg text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1 bg-slate-50 p-4 border rounded-xl">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Visibilitas Penilaian (Form Mapping)</label>
                          <div className="grid grid-cols-2 gap-2.5 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer font-medium">
                              <input
                                type="checkbox"
                                checked={sessionForm.show_pemateri}
                                onChange={e => setSessionForm(prev => ({ ...prev, show_pemateri: e.target.checked }))}
                              />
                              <span>A. Form Pemateri</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer font-medium">
                              <input
                                type="checkbox"
                                checked={sessionForm.show_fasilitator}
                                onChange={e => setSessionForm(prev => ({ ...prev, show_fasilitator: e.target.checked }))}
                              />
                              <span>B. Form Fasilitator</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer font-medium">
                              <input
                                type="checkbox"
                                checked={sessionForm.show_panitia}
                                onChange={e => setSessionForm(prev => ({ ...prev, show_panitia: e.target.checked }))}
                              />
                              <span>C. Form Panitia</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer font-medium">
                              <input
                                type="checkbox"
                                checked={sessionForm.show_kegiatan}
                                onChange={e => setSessionForm(prev => ({ ...prev, show_kegiatan: e.target.checked }))}
                              />
                              <span>D. Form Kegiatan Akhir</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t">
                          <button
                            type="button"
                            onClick={() => setSessionModalOpen(false)}
                            className="px-3.5 py-1.5 border rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 cursor-pointer"
                          >
                            {sessionForm.id ? "Simpan Perubahan" : "Terbitkan Sesi Baru"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* MASTER ASPEK PENILAIAN */}
            {isAdminLogged && activeTab === "master-aspek" && (
              <div className="space-y-6" id="master_aspek_tab_viewport">
                
                <div className="border-b border-slate-300 pb-4">
                  <h2 className="text-xl font-extrabold text-slate-900">Pengaturan Aspek / Pertanyaan Kuesioner</h2>
                  <p className="text-xs text-slate-500">Sesuaikan butir-butir pertanyaan skala Likert 1-5 untuk masing-masing kategori penilaian Bawaslu.</p>
                </div>

                {aspectSuccessMsg && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between shadow-2xs animate-fadeIn" id="aspect_success_banner">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">✓</span>
                      <span>{aspectSuccessMsg}</span>
                    </div>
                    <button onClick={() => setAspectSuccessMsg("")} className="text-emerald-500 hover:text-emerald-700 font-extrabold text-xs cursor-pointer">✕</button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* CATEGORIES PREVIEW CARDS */}
                  {['A', 'B', 'C', 'D'].map((catCode) => {
                    const relatedQuestions = allQuestions.filter(q => q.kategori === catCode);
                    let titleLabel = "";
                    if (catCode === 'A') titleLabel = "A. Aspek Penilaian untuk Pemateri";
                    if (catCode === 'B') titleLabel = "B. Aspek Penilaian untuk Fasilitator";
                    if (catCode === 'C') titleLabel = "C. Aspek Penilaian untuk Panitia Pelaksana";
                    if (catCode === 'D') titleLabel = "D. Aspek Kegiatan Secara Keseluruhan";

                    return (
                      <div key={catCode} className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{titleLabel}</h3>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{relatedQuestions.length} Butir</span>
                          </div>

                          <div className="divide-y divide-slate-100 space-y-1 max-h-[300px] overflow-y-auto pr-1">
                            {relatedQuestions.map((q) => (
                              <div key={q.id} className="py-2.5 flex items-start gap-2 justify-between">
                                <div className="flex items-start gap-2.5 text-xs text-slate-700">
                                  <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-500 flex-shrink-0 mt-0.5">{q.no_urut || (q as any).noUrut}</span>
                                  <p className="leading-relaxed">{q.pertanyaan}</p>
                                </div>
                                <button
                                  onClick={() => handleOpenQuestionModal(q)}
                                  className="p-1 hover:bg-slate-100 rounded text-blue-600 cursor-pointer flex-shrink-0"
                                  title="Edit Pertanyaan"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                </div>

                {/* MODAL REDAKSI PERTANYAAN */}
                {questionModalOpen && (
                  <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl border w-full max-w-md p-6 space-y-4">
                      <div className="flex justify-between items-center border-b pb-3">
                        <div className="flex items-center gap-2">
                          {getSesiBadge(questionForm.kategori || "A")}
                          <h3 className="text-xs font-extrabold text-slate-900">Butir Ke-{questionForm.no_urut}</h3>
                        </div>
                        <button onClick={() => setQuestionModalOpen(false)} className="text-slate-400 text-xs font-bold hover:text-slate-700 cursor-pointer">✕</button>
                      </div>

                      <form onSubmit={handleSaveQuestion} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Redaksi Aspek Kalimat Pertanyaan</label>
                          <textarea
                            required
                            rows={4}
                            value={questionForm.pertanyaan}
                            onChange={e => setQuestionForm(prev => ({ ...prev, pertanyaan: e.target.value }))}
                            className="w-full px-3 py-1.5 border rounded-lg text-xs leading-relaxed focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t">
                          <button
                            type="button"
                            onClick={() => setQuestionModalOpen(false)}
                            className="px-3.5 py-1.5 border rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 cursor-pointer"
                          >
                            Simpan Perubahan
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* MASTER DATA ADMINISTRATOR CRUD TAB */}
            {isAdminLogged && activeTab === "master-admin" && (
              <div className="space-y-6 animate-fadeIn" id="master_admin_tab_viewport">
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-300 pb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">Manajemen User Administrator</h2>
                    <p className="text-xs text-slate-500">Kelola akun dan kredensial akses petugas administrator Bawaslu Kabupaten Paser.</p>
                  </div>

                  <button
                    onClick={() => handleOpenAdminModal()}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer shadow-xs"
                    id="btn_add_admin_user"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah User Admin</span>
                  </button>
                </div>

                {adminSuccessMsg && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between shadow-2xs animate-fadeIn" id="admin_success_banner_notice">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">✓</span>
                      <span>{adminSuccessMsg}</span>
                    </div>
                    <button onClick={() => setAdminSuccessMsg("")} className="text-emerald-500 hover:text-emerald-700 font-extrabold text-xs cursor-pointer">✕</button>
                  </div>
                )}

                {/* ADMINS LIST TABLE */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">Daftar Akun Admin Terdaftar</span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{adminUsers.length} User</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-white text-slate-400 border-b border-slate-200 text-[9px] font-bold uppercase tracking-wider">
                          <th className="p-4 w-12">No</th>
                          <th className="p-4">Nama Lengkap</th>
                          <th className="p-4">Username</th>
                          <th className="p-4 text-center">Aksi Kendali</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                        {adminUsers.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-slate-400 italic">Belum ada user admin terdaftar.</td>
                          </tr>
                        ) : (
                          adminUsers.map((u, index) => (
                            <tr key={u.id} className="hover:bg-slate-50">
                              <td className="p-4 text-slate-400 font-mono text-[10px]">{index + 1}</td>
                              <td className="p-4 font-bold text-slate-900">{u.fullName}</td>
                              <td className="p-4 font-mono text-slate-600 text-[11px] bg-slate-50/50">{u.username}</td>
                              <td className="p-4 flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleOpenAdminModal(u)}
                                  className="p-1 px-2.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                                  title="Edit Admin"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => setDeleteAdminCandidate(u)}
                                  className="p-1 px-2.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-950 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                                  title="Hapus Admin"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Hapus</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MODAL EDIT / TAMBAH USER ADMIN */}
                {adminModalOpen && (
                  <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="admin_editor_overlay">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-150 overflow-hidden" id="admin_editor_modal">
                      <div className="bg-[#0f172a] p-5 text-white flex justify-between items-center">
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider">{adminForm.id ? "Edit User Admin" : "Tambah User Admin Baru"}</h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">Kelola kredensial login akses sistem penilaian.</p>
                        </div>
                        <button 
                          onClick={() => setAdminModalOpen(false)} 
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <form onSubmit={handleSaveAdmin} className="p-5 space-y-4">
                        {adminError && (
                          <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs font-bold rounded">
                            {adminError}
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block font-sans">Nama Lengkap</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Contoh: Farhan Syahputra, S.Pt"
                            value={adminForm.fullName}
                            onChange={e => setAdminForm({...adminForm, fullName: e.target.value})}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block font-sans">Username Admin</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Contoh: adminpaser"
                            value={adminForm.username}
                            onChange={e => setAdminForm({...adminForm, username: e.target.value})}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block font-sans">Password / PIN Baru</label>
                            {adminForm.id && (
                              <span className="text-[8px] text-slate-400 italic">Isi jika ingin diubah</span>
                            )}
                          </div>
                          <input 
                            type="password" 
                            required={!adminForm.id}
                            placeholder={adminForm.id ? "Kosongkan sandi jika tidak ingin dirubah..." : "Tulis kata sandi baru..."}
                            value={adminForm.password}
                            onChange={e => setAdminForm({...adminForm, password: e.target.value})}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block font-sans">Konfirmasi Password / PIN Baru</label>
                          <input 
                            type="password" 
                            required={!!adminForm.password?.trim()}
                            placeholder="Konfirmasi ulang sandi di atas..."
                            value={adminConfirmPassword}
                            onChange={e => setAdminConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 font-mono bg-white"
                          />
                        </div>

                        <div className="pt-3 border-t flex justify-end gap-2 text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => setAdminModalOpen(false)}
                            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm cursor-pointer"
                          >
                            Simpan Kredensial
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* CUSTOM DELETE CONFIRMATION BANNER DIALOG OVERLAY */}
                {deleteAdminCandidate && (
                  <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="delete_confirm_overlay">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-extrabold text-xl mx-auto">⚠️</div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 leading-snug">Konfirmasi Hapus Admin</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Apakah Anda yakin akan menghapus hak akses administrator milik <strong>{deleteAdminCandidate.fullName}</strong>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
                        </p>
                      </div>
                      <div className="flex gap-2 text-xs font-bold justify-center pt-2">
                        <button
                          type="button"
                          onClick={() => setDeleteAdminCandidate(null)}
                          className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (deleteAdminCandidate.id) executeDeleteAdmin(deleteAdminCandidate.id);
                          }}
                          className="px-4 py-2 bg-rose-650 hover:bg-rose-700 text-white rounded-xl cursor-pointer"
                        >
                          Ya, Hapus Sekarang
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DETAIL HASIL PENILAIAN RESPONDEN TAB */}
            {isAdminLogged && activeTab === "detail-hasil" && (
              <div className="space-y-6 animate-fadeIn" id="detail_hasil_tab_viewport">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-300 pb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 leading-snug">Rincian Hasil Penilaian Responden</h2>
                    <p className="text-xs text-slate-500">Analisis lengkap tanggapan kuantitatif (Likert) dan evaluasi kualitatif (saran, kritik, tindak lanjut) per responden.</p>
                  </div>

                  <button
                    onClick={fetchAdminData}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs cursor-pointer transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Segarkan Data</span>
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
                  {renderRespondentDetailsWidget()}
                </div>
              </div>
            )}

          </main>
        </div>
      ) : (

        /* RENDER MODE PESERTA (FRONTEND) */
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-start" id="peserta_workspace">
          
          {/* PROFILE CARD IDENTITAS */}
          <div className={`bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col ${isIdentitySaved ? "sm:flex-row sm:items-center sm:justify-between" : "gap-4"} mb-6`} id="identity_card">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0 mt-0.5">
                <User className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                {isIdentitySaved ? (
                  <>
                    <h3 className="text-slate-900 text-sm font-black">{namaPeserta}</h3>
                    <p className="text-slate-500 text-xs flex items-center gap-1 font-medium">
                      <School className="w-3.5 h-3.5 text-slate-400" />
                      Asal Kampus / Instansi: <strong className="text-slate-700">{asalInstansi}</strong>
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-slate-900 text-base font-black">Masukan Identitas Peserta</h3>
                    <p className="text-slate-500 text-xs font-medium">Lengkapi nama dan asal instansi Anda sebelum mengisi penilaian.</p>
                  </>
                )}
              </div>
            </div>

            {isIdentitySaved ? (
              <button
                onClick={handleResetIdentity}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer self-start sm:self-center transition-all bg-white"
                id="btn_reset_identity"
              >
                Ganti Nama/Identitas &larr;
              </button>
            ) : (
              <div className="flex flex-col gap-4 w-full" id="inputs_identity_form">
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label htmlFor="input_id_nama" className="text-slate-600 text-[11px] font-bold tracking-wider uppercase">Nama Lengkap</label>
                    <input
                      type="text"
                      placeholder="Contoh: Ahmad Rizky"
                      value={namaPeserta}
                      onChange={e => setNamaPeserta(e.target.value)}
                      className="px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-white transition-all w-full"
                      id="input_id_nama"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label htmlFor="input_id_instansi" className="text-slate-600 text-[11px] font-bold tracking-wider uppercase">Asal Kampus / Instansi</label>
                    <input
                      type="text"
                      placeholder="Contoh: Universitas Mulawarman"
                      value={asalInstansi}
                      onChange={e => setAsalInstansi(e.target.value)}
                      className="px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-white transition-all w-full"
                      id="input_id_instansi"
                    />
                  </div>
                </div>

                {/* Persetujuan / Consent Checkbox */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 mt-1" id="consent_checkbox_container">
                  <input
                    type="checkbox"
                    id="checkbox_participation_consent"
                    checked={agreeConsent}
                    onChange={e => setAgreeConsent(e.target.checked)}
                    className="w-4.5 h-4.5 text-rose-600 border-slate-300 rounded-md focus:ring-rose-500 focus:ring-offset-0 cursor-pointer mt-0.5 accent-rose-600 animate-pulse"
                  />
                  <label htmlFor="checkbox_participation_consent" className="text-xs text-slate-600 font-semibold leading-relaxed cursor-pointer select-none">
                    Saya setuju untuk berpartisipasi dan mengisi penilaian ini secara sadar tanpa paksaan.
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveIdentity}
                    disabled={!agreeConsent}
                    className={`px-6 py-2.5 text-sm font-extrabold rounded-xl shadow cursor-pointer transition-all flex items-center justify-center gap-2 ${
                      agreeConsent 
                        ? "bg-rose-600 text-white hover:bg-rose-700 hover:shadow-md" 
                        : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-100"
                    }`}
                    id="btn_submit_identity"
                  >
                    <span>Mulai Menilai</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {!isIdentitySaved ? (
            /* IF DRAFT OR BLANK IDENTITY SCREEN FIRST */
            <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm my-4" id="div_need_identity_layer">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-700">
                <Info className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Form Evaluasi Belum Terbuka</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">Tolong lengkapi form Nama & Asal Kampus di atas terlebih dahulu agar sistem kami dapat memproses penilaian Anda pada sesi harian Bawaslu Paser.</p>
              </div>
            </div>
          ) : (
            /* OTHERWISE RENDER PENILAIAN */
            <div className="space-y-6" id="div_kuesioner_main_payload">
              {loadingActiveSession ? (
                <div className="text-center py-12" id="loader_state">
                  <div className="w-8 h-8 rounded-full border-4 border-slate-300 border-t-rose-600 animate-spin mx-auto mb-3"></div>
                  <p className="text-xs text-slate-500">Mencari sesi penilaian live dari panitia...</p>
                </div>
              ) : !activeSessionData ? (
                /* SCREEN IF NO SESIAN OPENED BY HOST ADMIN */
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-5 shadow-2xs" id="no_active_session_card">
                  <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 mx-auto flex items-center justify-center text-red-600">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <h3 className="text-base font-extrabold text-slate-900">Belum Ada Sesi Penilaian yang Dibuka</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">Silakan tunggu instruksi Panitia Pelaksana Bawaslu Kabupaten Paser di ruangan untuk memulai pengisian kuisioner evaluasi.</p>
                  </div>
                  <div className="pt-2">
                    <button 
                      onClick={fetchActiveSession}
                      className="flex items-center gap-1.5 bg-white border border-slate-300 px-4 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 mx-auto cursor-pointer shadow-2xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                      <span>Cari Sesi Aktif Baru</span>
                    </button>
                  </div>
                </div>
              ) : submitSuccess ? (
                /* SUCCESS SCREEN SUBMISSION */
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs text-center space-y-5" id="submission_success_card">
                  <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 mx-auto flex items-center justify-center text-green-600">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <h3 className="text-base font-extrabold text-slate-900">Penilaian Berhasil Dikirim!</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">Terima kasih banyak atas partisipasi aktif Anda, <strong className="text-slate-900">{namaPeserta}</strong>. Masukan Anda sangat berharga bagi kelancaran kegiatan Bawaslu Kabupaten Paser kedepannya.</p>
                  </div>
                  
                  <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                    <button
                      onClick={() => {
                        setSubmitSuccess(false);
                        fetchActiveSession();
                      }}
                      className="px-4 py-2 bg-slate-900 text-white text-xs font-extrabold rounded-lg hover:bg-slate-800 transition-all cursor-pointer shadow"
                    >
                      Kembali ke Beranda Diskusi
                    </button>
                    <button
                      onClick={handleResetIdentity}
                      className="px-4 py-2 border border-slate-300 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer bg-white"
                    >
                      Ganti Akun Responden &rarr;
                    </button>
                  </div>
                </div>
              ) : (
                /* COMPACT EVALUATION SUBMISSION CARD */
                <div className="space-y-6" id="evaluation_form_container">
                  
                  {/* SESSION META HEADER BANNER */}
                  <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 font-bold text-7xl select-none translate-y-2 pointer-events-none">BAWASLU</div>
                    <div>
                      <span className="bg-rose-600 text-white font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-widest inline-block mb-2">SESI EVALUASI LIVE</span>
                      <h2 className="text-base sm:text-lg font-black">{activeSessionData.session.nama_sesi}</h2>
                      <p className="text-[11px] text-slate-300 font-medium mt-1">Kegiatan: {activeSessionData.kegiatan.judul}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-3" id="speakers_meta_sec">
                      {activeSessionData.session.show_pemateri && activeSessionData.session.nama_pemateri && (
                        <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700 text-xs">
                          <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Pemateri Sesi</span>
                          <span className="font-extrabold text-blue-300 block mt-0.5">{activeSessionData.session.nama_pemateri}</span>
                        </div>
                      )}
                      {activeSessionData.session.show_fasilitator && activeSessionData.session.nama_fasilitator && (
                        <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700 text-xs">
                          <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Fasilitator Sesi</span>
                          <span className="font-extrabold text-indigo-300 block mt-0.5">{activeSessionData.session.nama_fasilitator}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* FORM SECTIONS FOR RATINGS */}
                  <div className="space-y-6" id="form_evaluation_sections">
                    
                    {/* SECTION A: PEMATERI */}
                    {activeSessionData.session.show_pemateri && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4" id="form_section_pemateri">
                        <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pemateri</span>
                            <h3 className="text-xs sm:text-sm font-black text-slate-900">Penilaian Kinerja Pemateri / Narasumber</h3>
                          </div>
                          <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md">
                            {activeSessionData.session.nama_pemateri || "Pemateri"}
                          </span>
                        </div>

                        <div className="space-y-5 divide-y divide-slate-100" id="pemateri_questions">
                          {activeSessionData.questions.filter(q => q.kategori === 'A').map((q) => (
                            <div key={q.id} className="pt-4 first:pt-0 space-y-3" id={`quest_container_${q.id}`}>
                              <div className="flex items-start gap-2 text-xs">
                                <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">{q.no_urut || (q as any).noUrut}</span>
                                <p className="leading-relaxed font-semibold text-slate-800">{q.pertanyaan}</p>
                              </div>

                              {/* LIKERT RADIO INPUT SECTOR */}
                              <div className="flex justify-between items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200" id={`likert_selector_${q.id}`}>
                                <div className="flex justify-around items-center gap-1.5 mx-auto sm:mx-0">
                                  {[1, 2, 3, 4, 5].map((score) => (
                                    <button
                                      key={score}
                                      type="button"
                                      onClick={() => handleRatingSelect(q.id, score)}
                                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center border font-black text-xs transition-all cursor-pointer ${
                                        ratings[q.id] === score
                                          ? "bg-blue-600 border-blue-700 text-white shadow-sm scale-105"
                                          : "/1/2/3".includes(score.toString())
                                            ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                      }`}
                                      id={`btn_score_${q.id}_${score}`}
                                    >
                                      <span>{score}</span>
                                      <span className="text-[7px] font-normal opacity-70 block">
                                        {score === 1 && "S. Buruk"}
                                        {score === 2 && "Buruk"}
                                        {score === 3 && "Cukup"}
                                        {score === 4 && "Baik"}
                                        {score === 5 && "S. Baik"}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                                <span className={`text-[10px] uppercase tracking-wider hidden sm:inline ${getQuestionIndicatorColor(q.id)}`}>
                                  {getQuestionIndicatorText(q.id)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* COMMENTS FOR PEMATERI (A) */}
                        <div className="pt-4 border-t border-slate-100 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Saran, Masukan, atau Kritik Untuk Pemateri</label>
                          <textarea
                            rows={2}
                            placeholder="Tuliskan masukan konkret agar pemateri semakin baik menyampaikan materi..."
                            value={saranPemateri}
                            onChange={e => setSaranPemateri(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                            id="area_saran_pemateri"
                          />
                        </div>
                      </div>
                    )}

                    {/* SECTION B: FASILITATOR */}
                    {activeSessionData.session.show_fasilitator && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4" id="form_section_fasilitator">
                        <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Fasilitator</span>
                            <h3 className="text-xs sm:text-sm font-black text-slate-900">Penilaian Kinerja Fasilitator / Pendamping</h3>
                          </div>
                          <span className="bg-indigo-50 text-indigo-600 border border-indigo-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md">
                            {activeSessionData.session.nama_fasilitator || "Fasilitator"}
                          </span>
                        </div>

                        <div className="space-y-5 divide-y divide-slate-100 animate-fade-in" id="fasilitator_questions">
                          {activeSessionData.questions.filter(q => q.kategori === 'B').map((q) => (
                            <div key={q.id} className="pt-4 first:pt-0 space-y-3" id={`quest_container_${q.id}`}>
                              <div className="flex items-start gap-2 text-xs">
                                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">{q.no_urut || (q as any).noUrut}</span>
                                <p className="leading-relaxed font-semibold text-slate-800">{q.pertanyaan}</p>
                              </div>

                              {/* LIKERT RADIO INPUT SECTOR */}
                              <div className="flex justify-between items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200" id={`likert_selector_${q.id}`}>
                                <div className="flex justify-around items-center gap-1.5 mx-auto sm:mx-0">
                                  {[1, 2, 3, 4, 5].map((score) => (
                                    <button
                                      key={score}
                                      type="button"
                                      onClick={() => handleRatingSelect(q.id, score)}
                                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center border font-black text-xs transition-all cursor-pointer ${
                                        ratings[q.id] === score
                                          ? "bg-indigo-600 border-indigo-700 text-white shadow-sm scale-105"
                                          : "/1/2/3".includes(score.toString())
                                            ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                      }`}
                                      id={`btn_score_${q.id}_${score}`}
                                    >
                                      <span>{score}</span>
                                      <span className="text-[7px] font-normal opacity-70 block">
                                        {score === 1 && "S. Buruk"}
                                        {score === 2 && "Buruk"}
                                        {score === 3 && "Cukup"}
                                        {score === 4 && "Baik"}
                                        {score === 5 && "S. Baik"}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                                <span className={`text-[10px] uppercase tracking-wider hidden sm:inline ${getQuestionIndicatorColor(q.id)}`}>
                                  {getQuestionIndicatorText(q.id)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* COMMENTS FOR FASILITATOR (B) */}
                        <div className="pt-4 border-t border-slate-100 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Saran, Masukan, atau Kritik Untuk Fasilitator</label>
                          <textarea
                            rows={2}
                            placeholder="Tuliskan masukan konkret agar pendampingan kelompok semakin interaktif..."
                            value={saranFasilitator}
                            onChange={e => setSaranFasilitator(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                            id="area_saran_fasilitator"
                          />
                        </div>
                      </div>
                    )}

                    {/* SECTION C: PANITIA */}
                    {activeSessionData.session.show_panitia && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4" id="form_section_panitia">
                        <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Panitia</span>
                            <h3 className="text-xs sm:text-sm font-black text-slate-900">Penilaian Kinerja Panitia Pelaksana</h3>
                          </div>
                          <span className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md">
                            Panitia Pelaksana
                          </span>
                        </div>

                        <div className="space-y-5 divide-y divide-slate-100" id="panitia_questions">
                          {activeSessionData.questions.filter(q => q.kategori === 'C').map((q) => (
                            <div key={q.id} className="pt-4 first:pt-0 space-y-3" id={`quest_container_${q.id}`}>
                              <div className="flex items-start gap-2 text-xs">
                                <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">{q.no_urut || (q as any).noUrut}</span>
                                <p className="leading-relaxed font-semibold text-slate-800">{q.pertanyaan}</p>
                              </div>

                              {/* LIKERT RADIO INPUT SECTOR */}
                              <div className="flex justify-between items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200" id={`likert_selector_${q.id}`}>
                                <div className="flex justify-around items-center gap-1.5 mx-auto sm:mx-0">
                                  {[1, 2, 3, 4, 5].map((score) => (
                                    <button
                                      key={score}
                                      type="button"
                                      onClick={() => handleRatingSelect(q.id, score)}
                                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center border font-black text-xs transition-all cursor-pointer ${
                                        ratings[q.id] === score
                                          ? "bg-amber-600 border-amber-700 text-white shadow-sm scale-105"
                                          : "/1/2/3".includes(score.toString())
                                            ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                      }`}
                                      id={`btn_score_${q.id}_${score}`}
                                    >
                                      <span>{score}</span>
                                      <span className="text-[7px] font-normal opacity-70 block">
                                        {score === 1 && "S. Buruk"}
                                        {score === 2 && "Buruk"}
                                        {score === 3 && "Cukup"}
                                        {score === 4 && "Baik"}
                                        {score === 5 && "S. Baik"}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                                <span className={`text-[10px] uppercase tracking-wider hidden sm:inline ${getQuestionIndicatorColor(q.id)}`}>
                                  {getQuestionIndicatorText(q.id)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* COMMENTS FOR PANITIA (C) */}
                        <div className="pt-4 border-t border-slate-100 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Saran, Masukan, atau Kritik Untuk Panitia Pelaksana</label>
                          <textarea
                            rows={2}
                            placeholder="Tuliskan kritik/saran mengenai ruangan, konsumsi, atau kelayakan tas/alat tulis..."
                            value={saranPanitia}
                            onChange={e => setSaranPanitia(e.target.value)}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                            id="area_saran_panitia"
                          />
                        </div>
                      </div>
                    )}

                    {/* SECTION D: KEGIATAN KESELURUHAN */}
                    {activeSessionData.session.show_kegiatan && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4" id="form_section_kegiatan">
                        <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Kegiatan</span>
                            <h3 className="text-xs sm:text-sm font-black text-slate-900">Penilaian Kegiatan Diklat Secara Keseluruhan</h3>
                          </div>
                          <span className="bg-teal-50 text-teal-600 border border-teal-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md">
                            Kegiatan Utama
                          </span>
                        </div>

                        <div className="space-y-5 divide-y divide-slate-100" id="kegiatan_questions">
                          {activeSessionData.questions.filter(q => q.kategori === 'D').map((q) => (
                            <div key={q.id} className="pt-4 first:pt-0 space-y-3" id={`quest_container_${q.id}`}>
                              <div className="flex items-start gap-2 text-xs">
                                <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">{q.no_urut || (q as any).noUrut}</span>
                                <p className="leading-relaxed font-semibold text-slate-800">{q.pertanyaan}</p>
                              </div>

                              {/* LIKERT RADIO INPUT SECTOR */}
                              <div className="flex justify-between items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200" id={`likert_selector_${q.id}`}>
                                <div className="flex justify-around items-center gap-1.5 mx-auto sm:mx-0">
                                  {[1, 2, 3, 4, 5].map((score) => (
                                    <button
                                      key={score}
                                      type="button"
                                      onClick={() => handleRatingSelect(q.id, score)}
                                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center border font-black text-xs transition-all cursor-pointer ${
                                        ratings[q.id] === score
                                          ? "bg-teal-600 border-teal-700 text-white shadow-sm scale-105"
                                          : "/1/2/3".includes(score.toString())
                                            ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                      }`}
                                      id={`btn_score_${q.id}_${score}`}
                                    >
                                      <span>{score}</span>
                                      <span className="text-[7px] font-normal opacity-70 block">
                                        {score === 1 && "S. Buruk"}
                                        {score === 2 && "Buruk"}
                                        {score === 3 && "Cukup"}
                                        {score === 4 && "Baik"}
                                        {score === 5 && "S. Baik"}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                                <span className={`text-[10px] uppercase tracking-wider hidden sm:inline ${getQuestionIndicatorColor(q.id)}`}>
                                  {getQuestionIndicatorText(q.id)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* HIGH VALUE SESSIONS 3 SPECIAL QUESTIONS */}
                        <div className="pt-4 border-t border-slate-100 space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Tindak lanjut dan Komitmen Peserta dalam Pengawasan Partisipatif Pasca Kegiatan (Wajib)</label>
                            <textarea
                              rows={3}
                              placeholder="Tuliskan aksi nyata atau implementasi pengawasan partisipatif yang akan dilakukan pasca pelatihan..."
                              value={tindakLanjut}
                              onChange={e => setTindakLanjut(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-rose-500 bg-white"
                              id="area_tindak_lanjut"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Harapan/Usulan Kegiatan Berikutnya (Opsional)</label>
                            <textarea
                              rows={3}
                              placeholder="Tuliskan usulan topik, metode, atau harapan perbaikan untuk penyelenggaraan kegiatan berikutnya..."
                              value={harapan}
                              onChange={e => setHarapan(e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                              id="area_harapan"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  {submitError && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl flex items-start gap-2.5 shadow-xs animate-fadeIn" id="div_eval_submit_err">
                      <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">!</span>
                      <div>
                        <h4 className="font-extrabold text-rose-900 mb-0.5">Pertanyaan Belum Lengkap</h4>
                        <p className="font-semibold text-slate-700 opacity-90">{submitError}</p>
                      </div>
                    </div>
                  )}

                  {/* FORM ACTION SUBMIT CHECK */}
                  <div className="bg-white border rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="final_submit_action_card">
                    <p className="text-xs text-slate-500 font-bold">Pastikan Anda sudah memberikan nilai di seluruh aspek yang bertanda bintang / diujikan.</p>
                    
                    <button
                      onClick={handleSubmitEvaluation}
                      disabled={submitLoading}
                      className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 text-white text-xs font-black rounded-lg transition-all shadow cursor-pointer flex items-center justify-center gap-1.5"
                      id="btn_submit_real_evaluation"
                    >
                      {submitLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"></div>
                          <span>Mengirim Evaluasi...</span>
                        </>
                      ) : (
                        <>
                          <span>Kirim Seluruh Penilaian</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* GLOBAL TOAST COMPONENT */}
      {toast.show && (
        <div 
          className={`fixed bottom-6 right-6 z-100 flex items-center gap-3 px-4 py-3 border rounded-xl shadow-lg transition-all duration-300 transform translate-y-0 animate-slideUp ${
            toast.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}
          id="global_toast_popup"
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
            toast.type === 'success' ? 'bg-emerald-200 text-emerald-800' :
            toast.type === 'error' ? 'bg-rose-200 text-rose-800' :
            'bg-indigo-200 text-indigo-800'
          }`}>
            {toast.type === 'success' && "✓"}
            {toast.type === 'error' && "✕"}
            {toast.type === 'info' && "i"}
          </span>
          <p className="text-xs font-bold leading-normal">{toast.message}</p>
          <button 
            type="button" 
            onClick={() => setToast(prev => ({ ...prev, show: false }))} 
            className="text-slate-400 hover:text-slate-600 font-extrabold text-xs ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* GLOBAL CONFIRM MODAL COMPONENT */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-100 animate-fadeIn" id="global_confirm_modal_overlay">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden p-6 space-y-5 animate-scaleUp" id="global_confirm_modal_box">
            <div className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                confirmModal.isDanger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {confirmModal.isDanger ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <HelpCircle className="w-5 h-5" />
                )}
              </span>
              <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{confirmModal.title}</h3>
            </div>
            
            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer"
                id="global_confirm_modal_cancel"
              >
                {confirmModal.cancelText || "Batal"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  if (confirmModal.onConfirm) {
                    try {
                      await confirmModal.onConfirm();
                    } catch (e) {
                      console.error(e);
                    }
                  }
                }}
                className={`px-4 py-2 text-xs font-black text-white rounded-lg transition-all cursor-pointer ${
                  confirmModal.isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
                id="global_confirm_modal_submit"
              >
                {confirmModal.confirmText || "Setuju"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER BAR */}
      <footer className="bg-slate-900 text-slate-300 text-xs text-center py-6 border-t border-slate-950 mt-12" id="footer_container">
        <div className="max-w-4xl mx-auto px-4 space-y-1">
          <p className="font-semibold leading-relaxed tracking-wide">
            Penilaian Kegiatan Pendidikan Pengawas Partisipatif Bawaslu Kabupaten Paser 
          </p>
          <p className="text-[11px] text-slate-400">
            Copyright© meteru.my.id 2026. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
