-- Dashboard schema for Divisi Proyek.
-- Run via `npm run db:setup` (executes this file, then db/seed.sql, against DATABASE_URL).

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dashboard_metrics (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  delta TEXT NOT NULL,
  delta_color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  icon TEXT NOT NULL,
  title TEXT NOT NULL,
  meta TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS attention_items (
  id SERIAL PRIMARY KEY,
  tag_label TEXT NOT NULL,
  overdue TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
