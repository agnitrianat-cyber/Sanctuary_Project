import NoticeScreen from "@/components/NoticeScreen";
import SupervisiClient from "@/components/SupervisiClient";
import { describeDbError } from "@/lib/db-errors";
import { getProjects } from "@/lib/queries";
import { getSupervisionData } from "@/lib/supervision";
import type { Project } from "@/lib/dashboard-data";

// Reports, findings, and photos change during the day, so nothing here may be
// frozen at build time.
export const dynamic = "force-dynamic";

export default async function SupervisiPage() {
  let projects: Project[];
  let data: Awaited<ReturnType<typeof getSupervisionData>>;
  try {
    [projects, data] = await Promise.all([getProjects(), getSupervisionData()]);
  } catch (err) {
    return <NoticeScreen {...describeDbError(err)} />;
  }

  if (projects.length === 0) {
    return (
      <NoticeScreen
        title="Belum ada data proyek"
        message="Supervisi lapangan butuh proyek aktif lebih dulu."
        hint="Buka /api/setup untuk membuat tabel dan mengisi data contoh."
        showSetup
      />
    );
  }

  return (
    <SupervisiClient
      projects={projects}
      reports={data.reports}
      progress={data.progress}
      findings={data.findings}
      photos={data.photos}
    />
  );
}
