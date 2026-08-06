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
];

type SeedSpec = { table: string; sql: string; params: unknown[] };

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
