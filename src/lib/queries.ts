import { getDb } from "./db";
import type { Activity, AttentionItem, Metric, Project } from "./dashboard-data";

export async function getProjects(): Promise<Project[]> {
  const sql = getDb();
  const rows = await sql`SELECT id, name, location FROM projects ORDER BY id`;
  return rows as Project[];
}

export async function getMetrics(): Promise<Metric[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT label, value, delta, delta_color AS "deltaColor"
    FROM dashboard_metrics ORDER BY sort_order
  `;
  return rows as Metric[];
}

export async function getActivities(): Promise<Activity[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT icon, title, meta FROM activities ORDER BY sort_order
  `;
  return rows as Activity[];
}

export async function getAttentionItems(): Promise<AttentionItem[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT tag_label AS "tagLabel", overdue, title, location
    FROM attention_items ORDER BY sort_order
  `;
  return rows as AttentionItem[];
}

export async function getDashboardData() {
  const [projects, metrics, activities, attention] = await Promise.all([
    getProjects(),
    getMetrics(),
    getActivities(),
    getAttentionItems(),
  ]);
  return { projects, metrics, activities, attention };
}
