import Dashboard from "@/components/Dashboard";
import NoticeScreen from "@/components/NoticeScreen";
import { describeDbError } from "@/lib/db-errors";
import { getDashboardData } from "@/lib/queries";

// Data comes from Neon and should reflect the latest reports/findings,
// not be frozen at build time.
export const dynamic = "force-dynamic";

export default async function Page() {
  let data;
  try {
    data = await getDashboardData();
  } catch (err) {
    // Surface the real reason instead of a generic failure.
    return <NoticeScreen {...describeDbError(err)} />;
  }
  const { projects, metrics, activities, attention } = data;

  // Every screen depends on a selected project (PRD §4), so without any project
  // there is nothing to render — show the fix instead of crashing.
  if (projects.length === 0) {
    return (
      <NoticeScreen
        title="Belum ada data proyek"
        message="Database sudah terhubung, tapi tabel proyek masih kosong."
        hint="Buka /api/setup untuk membuat tabel dan mengisi data contoh, lalu muat ulang halaman ini."
        showSetup
      />
    );
  }

  return (
    <Dashboard
      projects={projects}
      metrics={metrics}
      activities={activities}
      attention={attention}
    />
  );
}
