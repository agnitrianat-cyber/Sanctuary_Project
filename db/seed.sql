-- Seed data matching the original design-handoff sample data.
-- Safe to re-run: clears and re-inserts.

DELETE FROM projects;
DELETE FROM dashboard_metrics;
DELETE FROM activities;
DELETE FROM attention_items;

INSERT INTO projects (id, name, location) VALUES
  ('p1', 'Green Valley – Cluster Anggrek', 'Bogor, Jawa Barat'),
  ('p2', 'Kavling Mutiara Timur', 'Sidoarjo, Jawa Timur'),
  ('p3', 'Perumahan Cempaka Asri', 'Karawang, Jawa Barat');

INSERT INTO dashboard_metrics (label, value, delta, delta_color, sort_order) VALUES
  ('Progres realisasi vs rencana', '62% / 68%', '▼ 6% di bawah rencana', 'var(--color-accent-700)', 1),
  ('Deviasi jadwal', '-12 hari', '▼ Terlambat', 'var(--color-accent-700)', 2),
  ('Nilai kontrak vs realisasi', 'Rp 11,2 M', 'dari Rp 18,4 M kontrak', 'var(--color-neutral-700)', 3),
  ('Temuan terbuka', '7', '▲ 2 prioritas tinggi', 'var(--color-accent-700)', 4);

INSERT INTO activities (icon, title, meta, sort_order) VALUES
  ('doc', 'Laporan harian – Blok C', 'Oleh Pengawas Rudi · 2 jam lalu', 1),
  ('camera', 'Estimasi Rangka Atap Blok B', 'Rp 842.500.000 · dibuat kemarin', 2),
  ('layers', 'Temuan koordinasi baru', 'Bentrok ducting vs balok, Lt.2 Zona A', 3);

INSERT INTO attention_items (tag_label, overdue, title, location, sort_order) VALUES
  ('Prioritas Tinggi', 'Lewat tenggat 3 hari', 'Retak dinding struktur', 'Blok A, Unit 12', 1),
  ('Prioritas Tinggi', 'Lewat tenggat 1 hari', 'Kebocoran pipa MEP', 'Blok C, Lantai 1', 2);
