import { getDb } from "./db";

// Findings move through a fixed lifecycle (PRD section 5.3). The order here is
// also the order the "next status" button walks through.
export const FINDING_STATUSES = ["Terbuka", "Perbaikan", "Verifikasi", "Selesai"] as const;
export type FindingStatus = (typeof FINDING_STATUSES)[number];

// Badge colours are fixed by the PRD section 6: red / yellow / blue / green.
export const STATUS_STYLES: Record<FindingStatus, { bg: string; fg: string }> = {
  Terbuka: { bg: "#fee2e2", fg: "#991b1b" },
  Perbaikan: { bg: "#fef3c7", fg: "#854d0e" },
  Verifikasi: { bg: "#dbeafe", fg: "#1e40af" },
  Selesai: { bg: "#dcfce7", fg: "#166534" },
};

export const PRIORITIES = ["Tinggi", "Sedang", "Rendah"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PHOTO_CATEGORIES = ["Progres", "Temuan", "K3"] as const;
export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export function isFindingStatus(value: unknown): value is FindingStatus {
  return typeof value === "string" && (FINDING_STATUSES as readonly string[]).includes(value);
}

export function isPhotoCategory(value: unknown): value is PhotoCategory {
  return typeof value === "string" && (PHOTO_CATEGORIES as readonly string[]).includes(value);
}

/** The status that follows `current`, or null when the finding is already done. */
export function nextStatus(current: FindingStatus): FindingStatus | null {
  const i = FINDING_STATUSES.indexOf(current);
  return i < FINDING_STATUSES.length - 1 ? FINDING_STATUSES[i + 1] : null;
}

export type DailyReport = {
  id: number;
  projectId: string;
  reportDate: string;
  weather: string;
  workers: number;
  materials: string;
  equipment: string;
  notes: string;
  author: string;
  createdAt: string;
};

export type ProgressItem = {
  id: number;
  projectId: string;
  workItem: string;
  weight: number;
  plannedPct: number;
  actualPct: number;
};

export type Finding = {
  id: number;
  projectId: string;
  title: string;
  location: string;
  discipline: string;
  priority: Priority;
  pic: string;
  dueDate: string;
  status: FindingStatus;
  createdAt: string;
};

export type FieldPhoto = {
  id: number;
  projectId: string;
  category: PhotoCategory;
  location: string;
  url: string;
  caption: string;
  takenAt: string;
};

export type NewDailyReport = Omit<DailyReport, "id" | "createdAt">;

// Dates arrive from Postgres as Date objects; the client only ever formats
// them, so they are narrowed to ISO strings at the boundary.
function asIsoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
}

function asIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

export async function listDailyReports(): Promise<DailyReport[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, project_id AS "projectId", report_date AS "reportDate", weather,
           workers, materials, equipment, notes, author, created_at AS "createdAt"
    FROM daily_reports
    ORDER BY report_date DESC, id DESC
  `;
  return (rows as DailyReport[]).map((r) => ({
    ...r,
    reportDate: asIsoDate(r.reportDate),
    createdAt: asIso(r.createdAt),
  }));
}

export async function addDailyReport(r: NewDailyReport): Promise<DailyReport> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO daily_reports
      (project_id, report_date, weather, workers, materials, equipment, notes, author)
    VALUES (${r.projectId}, ${r.reportDate}, ${r.weather}, ${r.workers},
            ${r.materials}, ${r.equipment}, ${r.notes}, ${r.author})
    RETURNING id, project_id AS "projectId", report_date AS "reportDate", weather,
              workers, materials, equipment, notes, author, created_at AS "createdAt"
  `;
  const row = rows[0] as DailyReport;
  return { ...row, reportDate: asIsoDate(row.reportDate), createdAt: asIso(row.createdAt) };
}

export async function listProgressItems(): Promise<ProgressItem[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, project_id AS "projectId", work_item AS "workItem", weight,
           planned_pct AS "plannedPct", actual_pct AS "actualPct"
    FROM progress_items
    ORDER BY project_id, sort_order, id
  `;
  // NUMERIC comes back as a string from the driver; the UI does arithmetic on it.
  return (rows as ProgressItem[]).map((r) => ({
    ...r,
    weight: Number(r.weight),
    plannedPct: Number(r.plannedPct),
    actualPct: Number(r.actualPct),
  }));
}

export async function listFindings(): Promise<Finding[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, project_id AS "projectId", title, location, discipline, priority,
           pic, due_date AS "dueDate", status, created_at AS "createdAt"
    FROM findings
    ORDER BY
      CASE priority WHEN 'Tinggi' THEN 1 WHEN 'Sedang' THEN 2 ELSE 3 END,
      due_date
  `;
  return (rows as Finding[]).map((r) => ({
    ...r,
    dueDate: asIsoDate(r.dueDate),
    createdAt: asIso(r.createdAt),
  }));
}

export async function setFindingStatus(id: number, status: FindingStatus): Promise<Finding | null> {
  const sql = getDb();
  const rows = await sql`
    UPDATE findings SET status = ${status} WHERE id = ${id}
    RETURNING id, project_id AS "projectId", title, location, discipline, priority,
              pic, due_date AS "dueDate", status, created_at AS "createdAt"
  `;
  if (rows.length === 0) return null;
  const row = rows[0] as Finding;
  return { ...row, dueDate: asIsoDate(row.dueDate), createdAt: asIso(row.createdAt) };
}

export async function listFieldPhotos(): Promise<FieldPhoto[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, project_id AS "projectId", category, location, url, caption,
           taken_at AS "takenAt"
    FROM field_photos
    ORDER BY taken_at DESC, id DESC
  `;
  return (rows as FieldPhoto[]).map((r) => ({ ...r, takenAt: asIso(r.takenAt) }));
}

export async function addFieldPhoto(
  p: Omit<FieldPhoto, "id" | "takenAt">,
): Promise<FieldPhoto> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO field_photos (project_id, category, location, url, caption)
    VALUES (${p.projectId}, ${p.category}, ${p.location}, ${p.url}, ${p.caption})
    RETURNING id, project_id AS "projectId", category, location, url, caption,
              taken_at AS "takenAt"
  `;
  const row = rows[0] as FieldPhoto;
  return { ...row, takenAt: asIso(row.takenAt) };
}

export async function getSupervisionData() {
  const [reports, progress, findings, photos] = await Promise.all([
    listDailyReports(),
    listProgressItems(),
    listFindings(),
    listFieldPhotos(),
  ]);
  return { reports, progress, findings, photos };
}

/** Weighted realisation of a project's work items, 0–100. */
export function weightedProgress(items: ProgressItem[], key: "plannedPct" | "actualPct") {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  if (totalWeight === 0) return 0;
  const done = items.reduce((sum, i) => sum + (i.weight * i[key]) / 100, 0);
  return (done / totalWeight) * 100;
}
