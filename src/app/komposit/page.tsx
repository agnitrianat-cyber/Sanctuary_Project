import KompositClient from "@/components/KompositClient";
import NoticeScreen from "@/components/NoticeScreen";
import { describeDbError } from "@/lib/db-errors";
import { listAllDrawings } from "@/lib/drawings";
import { getProjects } from "@/lib/queries";
import type { Drawing } from "@/lib/drawings";
import type { Project } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function KompositPage() {
  let projects: Project[];
  let drawings: Drawing[];
  try {
    [projects, drawings] = await Promise.all([getProjects(), listAllDrawings()]);
  } catch (err) {
    // Show what actually failed. The shared boundary hid the cause, which made
    // a missing table look like a connection problem.
    return <NoticeScreen {...describeDbError(err)} />;
  }

  if (projects.length === 0) {
    return (
      <NoticeScreen
        title="Belum ada data proyek"
        message="Komposit gambar butuh proyek aktif lebih dulu."
        hint="Buka /api/setup untuk membuat tabel dan mengisi data contoh."
        showSetup
      />
    );
  }

  return <KompositClient projects={projects} initialDrawings={drawings} />;
}
