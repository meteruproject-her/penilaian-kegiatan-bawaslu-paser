-- SKEMA DATABASE POSTGRESQL
-- Sistem Penilaian Kegiatan Pendidikan Pengawas Partisipatif (Bawaslu Kabupaten Paser)

-- 1. Tabel Kegiatan Utama
CREATE TABLE kegiatan_utama (
    id SERIAL PRIMARY KEY,
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Sesi (Centralized Live Sessions Mapping)
CREATE TABLE sesi (
    id SERIAL PRIMARY KEY,
    nama_sesi VARCHAR(100) NOT NULL, -- e.g., "Sesi 1", "Sesi 2", "Sesi 3"
    status_aktif BOOLEAN DEFAULT FALSE, -- Only one session is active at a time
    show_pemateri BOOLEAN DEFAULT TRUE, -- Form A (Pemateri)
    show_fasilitator BOOLEAN DEFAULT TRUE, -- Form B (Fasilitator)
    show_panitia BOOLEAN DEFAULT FALSE, -- Form C (Panitia)
    show_kegiatan BOOLEAN DEFAULT FALSE, -- Form D (Kegiatan Keseluruhan)
    nama_pemateri VARCHAR(100),
    nama_fasilitator VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Aspek Penilaian (Kategori Pertanyaan)
CREATE TABLE aspek_penilaian (
    id SERIAL PRIMARY KEY,
    kategori CHAR(1) NOT NULL CHECK (kategori IN ('A', 'B', 'C', 'D')), -- A=Pemateri, B=Fasilitator, C=Panitia, D=Kegiatan
    no_urut INT NOT NULL,
    pertanyaan TEXT NOT NULL,
    UNIQUE (kategori, no_urut)
);

-- 4. Tabel Peserta Evaluasi
CREATE TABLE peserta_evaluasi (
    id SERIAL PRIMARY KEY,
    nama_peserta VARCHAR(255) NOT NULL,
    asal_instansi VARCHAR(255) NOT NULL,
    sesi_id INT NOT NULL REFERENCES sesi(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabel Detail Penilaian (Skala Likert 1-5)
CREATE TABLE penilaian_detail (
    id SERIAL PRIMARY KEY,
    peserta_evaluasi_id INT NOT NULL REFERENCES peserta_evaluasi(id) ON DELETE CASCADE,
    aspek_id INT NOT NULL REFERENCES aspek_penilaian(id) ON DELETE CASCADE,
    nilai INT NOT NULL CHECK (nilai >= 1 AND nilai <= 5)
);

-- 6. Tabel Saran & Feedback Evaluasi
CREATE TABLE saran_masukan (
    id SERIAL PRIMARY KEY,
    peserta_evaluasi_id INT NOT NULL REFERENCES peserta_evaluasi(id) ON DELETE CASCADE,
    saran_pemateri TEXT,
    saran_fasilitator TEXT,
    saran_panitia TEXT,
    saran_kegiatan TEXT,
    tindak_lanjut TEXT, -- Khusus Kategori D
    harapan TEXT -- Khusus Kategori D
);

-- INDEKS UNTUK OPTIMASI QUERY REKAPITULASI
CREATE INDEX idx_peserta_evaluasi_sesi ON peserta_evaluasi(sesi_id);
CREATE INDEX idx_penilaian_detail_peserta ON penilaian_detail(peserta_evaluasi_id);
CREATE INDEX idx_penilaian_detail_aspek ON penilaian_detail(aspek_id);

-- DUMMY SEED DATA UNTUK PENGUJIAN AWAL / PROVISHING

-- Insert Kegiatan Utama
INSERT INTO kegiatan_utama (judul, deskripsi, aktif) VALUES 
('Pendidikan Pengawas Partisipatif Angkatan 2026', 'Pelatihan intensif tingkat kabupaten untuk kader pengawasan pemilu partisipatif di Kabupaten Paser.', true);

-- Insert Default Sesi
INSERT INTO sesi (nama_sesi, status_aktif, show_pemateri, show_fasilitator, show_panitia, show_kegiatan, nama_pemateri, nama_fasilitator) VALUES
('Sesi 1 (Pengantar Pengawasan Pemilu)', true, true, true, true, false, 'Drs. H. Syahrul, M.Si', 'Ahmad Gazali, S.E'),
('Sesi 2 (Pelaporan & Investigasi Pelanggaran)', false, true, true, false, false, 'Farida Ariyani, S.H, M.H', 'Ratna Rosilawati'),
('Sesi 3 (Rencana Tindak Lanjut & Evaluasi)', false, true, true, false, true, 'Budi Utomo, M.IP', 'Nurul Hikmah, S.Pt');

-- Insert Aspek Penilaian Pemateri (Kategori A)
INSERT INTO aspek_penilaian (kategori, no_urut, pertanyaan) VALUES
('A', 1, 'Penguasaan materi pelatihan dan kemampuan menjelaskan konsep secara konkret.'),
('A', 2, 'Sistematika penyajian materi dari pemaparan awal hingga kesimpulan.'),
('A', 3, 'Penggunaan metode pembelajaran dan media visual yang menarik serta tidak membosankan.'),
('A', 4, 'Ketepatan waktu dalam memulai dan mengakhiri sesi penjelasan.'),
('A', 5, 'Kejelasan dan ketajaman pemateri dalam menjawab tanggapan atau pertanyaan peserta.'),
('A', 6, 'Kerapihan cara berpakaian, keramahan penampilan, serta kesopanan pemateri.');

-- Insert Aspek Penilaian Fasilitator (Kategori B)
INSERT INTO aspek_penilaian (kategori, no_urut, pertanyaan) VALUES
('B', 1, 'Kemampuan memandu diskusi kelompok dengan tertib dan interaktif.'),
('B', 2, 'Sikap ramah, komunikatif, bersahabat, dan sigap membantu kesulitan peserta.'),
('B', 3, 'Kejelasan menyampaikan instruksi permainan simulasi atau kerja kelompok.'),
('B', 4, 'Kemampuan membangkitkan semangat belajar dan mencairkan suasana (ice breaking).'),
('B', 5, 'Keadilan dalam membagi kesempatan bicara, tidak memihak, dan tidak mendominasi.');

-- Insert Aspek Penilaian Panitia Pelaksana (Kategori C)
INSERT INTO aspek_penilaian (kategori, no_urut, pertanyaan) VALUES
('C', 1, 'Sikap ramah, sopan, dan efisiensi dalam pelayanan administrasi pendaftaran peserta.'),
('C', 2, 'Kebersihan, kenyamanan, kecukupan cahaya/pendingin, dan kelayakan fasilitas ruang kelas.'),
('C', 3, 'Ketepatan waktu penyediaan serta kualitas rasa dan higiene konsumsi (makanan berat & snack).'),
('C', 4, 'Kelengkapan penyediaan alat tulis kantor (ATK), tas diklat, modul cetak, dan ID card.'),
('C', 5, 'Responsivitas dan kesiapan panitia ketika melayani keperluan darurat medis/umum peserta.'),
('C', 6, 'Disiplin penyusunan dan ketepatan pelaksanaan jadwal agenda harian.');

-- Insert Aspek Penilaian Kegiatan Keseluruhan (Kategori D)
INSERT INTO aspek_penilaian (kategori, no_urut, pertanyaan) VALUES
('D', 1, 'Relevansi / kebermanfaatan materi diklat ini dengan aktivitas pengawasan pemilu di lapangan.'),
('D', 2, 'Peningkatan pengetahuan teknis, sikap mental, dan ketrampilan pengawasan Anda setelah pelatihan.'),
('D', 3, 'Kelayakan modul pelajaran dan metode evaluasi untuk diimplementasikan di wilayah asal Anda.');
