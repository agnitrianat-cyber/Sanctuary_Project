import { getDb } from "./db";

// Discipline colours are fixed by the PRD and reused everywhere (legend,
// badges, layer panel).
export const DISCIPLINES = {
  STR: { label: "Struktur", color: "#2563eb" },
  ARS: { label: "Arsitektur", color: "#4b5563" },
  MEP: { label: "MEP", color: "#ea580c" },
  INT: { label: "Interior", color: "#16a34a" },
} as const;

export type Discipline = keyof typeof DISCIPLINES;

export const DISCIPLINE_KEYS = Object.keys(DISCIPLINES) as Discipline[];

export function isDiscipline(value: string): value is Discipline {
  return value in DISCIPLINES;
}

// Browsers can render images and PDFs directly. DWG is a closed binary format
// that must be converted first, so it is stored but not yet displayable.
export const RENDERABLE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export type DrawingStatus = "siap" | "perlu-konversi";

export type Drawing = {
  id: number;
  projectId: string;
  discipline: Discipline;
  level: string;
  filename: string;
  url: string;
  contentType: string;
  status: DrawingStatus;
};

export function statusForType(contentType: string, filename: string): DrawingStatus {
  if (RENDERABLE_TYPES.includes(contentType)) return "siap";
  if (/\.(dwg|dxf|rvt)$/i.test(filename)) return "perlu-konversi";
  return "perlu-konversi";
}

export async function listDrawings(projectId: string): Promise<Drawing[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, project_id AS "projectId", discipline, level, filename, url,
           content_type AS "contentType", status
    FROM drawings
    WHERE project_id = ${projectId}
    ORDER BY level, discipline, id
  `;
  return rows as Drawing[];
}

// The viewer filters by the selected project client-side, so it needs every
// project's drawings up front rather than just the first one's.
export async function listAllDrawings(): Promise<Drawing[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, project_id AS "projectId", discipline, level, filename, url,
           content_type AS "contentType", status
    FROM drawings
    ORDER BY project_id, level, discipline, id
  `;
  return rows as Drawing[];
}

export async function addDrawing(d: Omit<Drawing, "id">): Promise<Drawing> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO drawings (project_id, discipline, level, filename, url, content_type, status)
    VALUES (${d.projectId}, ${d.discipline}, ${d.level}, ${d.filename}, ${d.url},
            ${d.contentType}, ${d.status})
    RETURNING id, project_id AS "projectId", discipline, level, filename, url,
              content_type AS "contentType", status
  `;
  return rows[0] as Drawing;
}

export async function deleteDrawing(id: number): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM drawings WHERE id = ${id}`;
}
