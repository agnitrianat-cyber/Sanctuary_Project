export type Project = {
  id: string;
  name: string;
  location: string;
};

export const PROJECTS: Project[] = [
  { id: "p1", name: "Green Valley – Cluster Anggrek", location: "Bogor, Jawa Barat" },
  { id: "p2", name: "Kavling Mutiara Timur", location: "Sidoarjo, Jawa Timur" },
  { id: "p3", name: "Perumahan Cempaka Asri", location: "Karawang, Jawa Barat" },
];

export type Metric = {
  label: string;
  value: string;
  delta: string;
  deltaColor: string;
};

export const METRICS: Metric[] = [
  { label: "Progres realisasi vs rencana", value: "62% / 68%", delta: "▼ 6% di bawah rencana", deltaColor: "var(--color-accent-700)" },
  { label: "Deviasi jadwal", value: "-12 hari", delta: "▼ Terlambat", deltaColor: "var(--color-accent-700)" },
  { label: "Nilai kontrak vs realisasi", value: "Rp 11,2 M", delta: "dari Rp 18,4 M kontrak", deltaColor: "var(--color-neutral-700)" },
  { label: "Temuan terbuka", value: "7", delta: "▲ 2 prioritas tinggi", deltaColor: "var(--color-accent-700)" },
];

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

export const ACTIVITIES: Activity[] = [
  { icon: "doc", title: "Laporan harian – Blok C", meta: "Oleh Pengawas Rudi · 2 jam lalu" },
  { icon: "camera", title: "Estimasi Rangka Atap Blok B", meta: "Rp 842.500.000 · dibuat kemarin" },
  { icon: "layers", title: "Temuan koordinasi baru", meta: "Bentrok ducting vs balok, Lt.2 Zona A" },
];

export type AttentionItem = {
  tagLabel: string;
  overdue: string;
  title: string;
  location: string;
};

export const ATTENTION: AttentionItem[] = [
  { tagLabel: "Prioritas Tinggi", overdue: "Lewat tenggat 3 hari", title: "Retak dinding struktur", location: "Blok A, Unit 12" },
  { tagLabel: "Prioritas Tinggi", overdue: "Lewat tenggat 1 hari", title: "Kebocoran pipa MEP", location: "Blok C, Lantai 1" },
];

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
