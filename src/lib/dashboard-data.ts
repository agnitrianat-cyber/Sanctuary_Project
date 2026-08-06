// Projects, metrics, activities, and attention items now come from Neon
// (see src/lib/queries.ts) instead of being hardcoded here.

export type Project = {
  id: string;
  name: string;
  location: string;
};

export type Metric = {
  label: string;
  value: string;
  delta: string;
  deltaColor: string;
};

export type MenuKey = "feasibility" | "supervision" | "estimate" | "overlay";

export type MenuItem = {
  key: MenuKey;
  title: string;
  desc: string;
};

export const MENUS: MenuItem[] = [
  { key: "feasibility", title: "Studi Kelayakan", desc: "Hitung kelayakan rencana proyek sebelum diputuskan." },
  { key: "supervision", title: "Supervisi Lapangan", desc: "Pantau laporan harian, progres, dan temuan di lokasi." },
  { key: "estimate", title: "Estimasi Biaya", desc: "Hitung volume & biaya langsung dari gambar konstruksi." },
  { key: "overlay", title: "Komposit Gambar", desc: "Tumpuk gambar STR/ARS/MEP/INT untuk cek bentrok." },
];

export type Activity = {
  icon: "doc" | "camera" | "layers";
  title: string;
  meta: string;
};

export type AttentionItem = {
  tagLabel: string;
  overdue: string;
  title: string;
  location: string;
};

export type NavKey = "dashboard" | MenuKey;

export type NavItem = {
  key: NavKey;
  label: string;
};

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "feasibility", label: "Studi Kelayakan" },
  { key: "supervision", label: "Supervisi Lapangan" },
  { key: "estimate", label: "Estimasi Biaya" },
  { key: "overlay", label: "Komposit Gambar" },
];
