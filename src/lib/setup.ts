import { getDb } from "./db";

// Single source of truth for the database structure. Kept here (rather than in
// .sql files) so it can run from a deployed serverless function without needing
// to read files from disk.
const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS projects (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     location TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS dashboard_metrics (
     id SERIAL PRIMARY KEY,
     label TEXT NOT NULL,
     value TEXT NOT NULL,
     delta TEXT NOT NULL,
     delta_color TEXT NOT NULL,
     sort_order INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE IF NOT EXISTS activities (
     id SERIAL PRIMARY KEY,
     icon TEXT NOT NULL,
     title TEXT NOT NULL,
     meta TEXT NOT NULL,
     sort_order INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE TABLE IF NOT EXISTS attention_items (
     id SERIAL PRIMARY KEY,
     tag_label TEXT NOT NULL,
     overdue TEXT NOT NULL,
     title TEXT NOT NULL,
     location TEXT NOT NULL,
     sort_order INTEGER NOT NULL DEFAULT 0
   )`,
  // Only the Blob address and metadata are stored here; the file itself lives
  // in Vercel Blob (PRD section 7).
  `CREATE TABLE IF NOT EXISTS drawings (
     id SERIAL PRIMARY KEY,
     project_id TEXT NOT NULL,
     discipline TEXT NOT NULL,
     level TEXT NOT NULL,
     filename TEXT NOT NULL,
     url TEXT NOT NULL,
     content_type TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'siap',
     uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS drawings_project_level_idx
     ON drawings (project_id, level)`,
  // — Supervisi Lapangan (PRD section 5.3) —
  `CREATE TABLE IF NOT EXISTS daily_reports (
     id SERIAL PRIMARY KEY,
     project_id TEXT NOT NULL,
     report_date DATE NOT NULL,
     weather TEXT NOT NULL DEFAULT '',
     workers INTEGER NOT NULL DEFAULT 0,
     materials TEXT NOT NULL DEFAULT '',
     equipment TEXT NOT NULL DEFAULT '',
     notes TEXT NOT NULL DEFAULT '',
     author TEXT NOT NULL DEFAULT '',
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS daily_reports_project_date_idx
     ON daily_reports (project_id, report_date DESC)`,
  `CREATE TABLE IF NOT EXISTS progress_items (
     id SERIAL PRIMARY KEY,
     project_id TEXT NOT NULL,
     work_item TEXT NOT NULL,
     weight NUMERIC(6,2) NOT NULL DEFAULT 0,
     planned_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
     actual_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
     sort_order INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE INDEX IF NOT EXISTS progress_items_project_idx
     ON progress_items (project_id)`,
  `CREATE TABLE IF NOT EXISTS findings (
     id SERIAL PRIMARY KEY,
     project_id TEXT NOT NULL,
     title TEXT NOT NULL,
     location TEXT NOT NULL DEFAULT '',
     discipline TEXT NOT NULL DEFAULT '',
     priority TEXT NOT NULL DEFAULT 'Sedang',
     pic TEXT NOT NULL DEFAULT '',
     due_date DATE,
     status TEXT NOT NULL DEFAULT 'Terbuka',
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS findings_project_status_idx
     ON findings (project_id, status)`,
  // Like drawings, only the Blob address is stored (PRD section 7).
  `CREATE TABLE IF NOT EXISTS field_photos (
     id SERIAL PRIMARY KEY,
     project_id TEXT NOT NULL,
     category TEXT NOT NULL DEFAULT 'Progres',
     location TEXT NOT NULL DEFAULT '',
     url TEXT NOT NULL,
     caption TEXT NOT NULL DEFAULT '',
     taken_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS field_photos_project_idx
     ON field_photos (project_id, taken_at DESC)`,
];

type SeedSpec = { table: string; sql: string; params: unknown[] };

// Sample supervision data is dated relative to today, so a freshly seeded
// database does not look abandoned months ago.
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function inDays(n: number) {
  return daysAgo(-n);
}

const SEEDS: SeedSpec[] = [
  {
    table: "projects",
    sql: `INSERT INTO projects (id, name, location) VALUES
            ($1,$2,$3), ($4,$5,$6), ($7,$8,$9)`,
    params: [
      "p1", "Green Valley – Cluster Anggrek", "Bogor, Jawa Barat",
      "p2", "Kavling Mutiara Timur", "Sidoarjo, Jawa Timur",
      "p3", "Perumahan Cempaka Asri", "Karawang, Jawa Barat",
    ],
  },
  {
    table: "dashboard_metrics",
    sql: `INSERT INTO dashboard_metrics (label, value, delta, delta_color, sort_order) VALUES
            ($1,$2,$3,$4,1), ($5,$6,$7,$8,2), ($9,$10,$11,$12,3), ($13,$14,$15,$16,4)`,
    params: [
      "Progres realisasi vs rencana", "62% / 68%", "▼ 6% di bawah rencana", "var(--color-accent-700)",
      "Deviasi jadwal", "-12 hari", "▼ Terlambat", "var(--color-accent-700)",
      "Nilai kontrak vs realisasi", "Rp 11,2 M", "dari Rp 18,4 M kontrak", "var(--color-neutral-700)",
      "Temuan terbuka", "7", "▲ 2 prioritas tinggi", "var(--color-accent-700)",
    ],
  },
  {
    table: "activities",
    sql: `INSERT INTO activities (icon, title, meta, sort_order) VALUES
            ($1,$2,$3,1), ($4,$5,$6,2), ($7,$8,$9,3)`,
    params: [
      "doc", "Laporan harian – Blok C", "Oleh Pengawas Rudi · 2 jam lalu",
      "camera", "Estimasi Rangka Atap Blok B", "Rp 842.500.000 · dibuat kemarin",
      "layers", "Temuan koordinasi baru", "Bentrok ducting vs balok, Lt.2 Zona A",
    ],
  },
  {
    table: "attention_items",
    sql: `INSERT INTO attention_items (tag_label, overdue, title, location, sort_order) VALUES
            ($1,$2,$3,$4,1), ($5,$6,$7,$8,2)`,
    params: [
      "Prioritas Tinggi", "Lewat tenggat 3 hari", "Retak dinding struktur", "Blok A, Unit 12",
      "Prioritas Tinggi", "Lewat tenggat 1 hari", "Kebocoran pipa MEP", "Blok C, Lantai 1",
    ],
  },
  {
    table: "daily_reports",
    sql: `INSERT INTO daily_reports
            (project_id, report_date, weather, workers, materials, equipment, notes, author) VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8), ($9,$10,$11,$12,$13,$14,$15,$16),
            ($17,$18,$19,$20,$21,$22,$23,$24), ($25,$26,$27,$28,$29,$30,$31,$32)`,
    params: [
      "p1", daysAgo(0), "Cerah", 24, "Besi D13 2 ton, semen 120 sak", "Molen 1, vibrator 2",
      "Pengecoran kolom lantai 2 Blok C selesai 80%.", "Pengawas Rudi",
      "p1", daysAgo(1), "Hujan siang", 18, "Bata ringan 3 kubik", "Scaffolding 40 set",
      "Pekerjaan dinding berhenti 3 jam karena hujan.", "Pengawas Rudi",
      "p1", daysAgo(3), "Berawan", 26, "Pasir 8 kubik, split 6 kubik", "Molen 2",
      "Bekisting balok lantai 2 dipasang, siap cor besok.", "Pengawas Rudi",
      "p2", daysAgo(1), "Cerah", 12, "Paving 400 buah", "Stamper 1",
      "Pemadatan jalan lingkungan blok B.", "Pengawas Sari",
    ],
  },
  {
    table: "progress_items",
    sql: `INSERT INTO progress_items
            (project_id, work_item, weight, planned_pct, actual_pct, sort_order) VALUES
            ($1,$2,$3,$4,$5,1), ($6,$7,$8,$9,$10,2), ($11,$12,$13,$14,$15,3),
            ($16,$17,$18,$19,$20,4), ($21,$22,$23,$24,$25,5), ($26,$27,$28,$29,$30,6),
            ($31,$32,$33,$34,$35,1), ($36,$37,$38,$39,$40,2), ($41,$42,$43,$44,$45,3)`,
    params: [
      "p1", "Persiapan & pembersihan lahan", 5, 100, 100,
      "p1", "Pondasi", 15, 100, 100,
      "p1", "Struktur beton", 30, 85, 74,
      "p1", "Dinding & plesteran", 20, 60, 48,
      "p1", "Atap & rangka", 15, 40, 30,
      "p1", "MEP & finishing", 15, 20, 8,
      "p2", "Cut & fill", 25, 100, 96,
      "p2", "Jalan lingkungan", 40, 70, 62,
      "p2", "Saluran & utilitas", 35, 45, 40,
    ],
  },
  {
    table: "findings",
    sql: `INSERT INTO findings
            (project_id, title, location, discipline, priority, pic, due_date, status) VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8), ($9,$10,$11,$12,$13,$14,$15,$16),
            ($17,$18,$19,$20,$21,$22,$23,$24), ($25,$26,$27,$28,$29,$30,$31,$32),
            ($33,$34,$35,$36,$37,$38,$39,$40)`,
    params: [
      "p1", "Retak dinding struktur", "Blok A, Unit 12", "STR", "Tinggi", "Andi (Struktur)", daysAgo(3), "Terbuka",
      "p1", "Kebocoran pipa MEP", "Blok C, Lantai 1", "MEP", "Tinggi", "Joko (MEP)", daysAgo(1), "Perbaikan",
      "p1", "Bentrok ducting vs balok", "Lantai 2, Zona A", "MEP", "Sedang", "Joko (MEP)", inDays(4), "Terbuka",
      "p1", "Pekerja tanpa helm di area cor", "Blok C, Lantai 2", "K3", "Sedang", "Rudi (Pengawas)", inDays(1), "Verifikasi",
      "p2", "Elevasi paving tidak rata", "Blok B, Jalan utama", "ARS", "Rendah", "Sari (Pengawas)", inDays(9), "Selesai",
    ],
  },
];

/**
 * Creates the tables and fills in sample data. Safe to run repeatedly: tables
 * use IF NOT EXISTS, and a table is only seeded while it is still empty, so
 * real data entered later is never overwritten.
 */
export async function setupDatabase() {
  const sql = getDb();

  for (const statement of SCHEMA) {
    await sql.query(statement);
  }

  const seeded: Record<string, string> = {};
  for (const { table, sql: insert, params } of SEEDS) {
    const rows = (await sql.query(`SELECT COUNT(*)::int AS count FROM ${table}`)) as { count: number }[];
    if (rows[0].count > 0) {
      seeded[table] = `dilewati (sudah ada ${rows[0].count} baris)`;
      continue;
    }
    await sql.query(insert, params);
    seeded[table] = "diisi data contoh";
  }

  return { tables: SCHEMA.length, seeded };
}
