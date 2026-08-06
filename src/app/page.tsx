import Dashboard from "@/components/Dashboard";
import { getDashboardData } from "@/lib/queries";

// Data comes from Neon and should reflect the latest reports/findings,
// not be frozen at build time.
export const dynamic = "force-dynamic";

export default async function Page() {
  const { projects, metrics, activities, attention } = await getDashboardData();

  return (
    <Dashboard
      projects={projects}
      metrics={metrics}
      activities={activities}
      attention={attention}
    />
  );
}
