import KompositClient from "@/components/KompositClient";
import NoticeScreen from "@/components/NoticeScreen";
import { listAllDrawings } from "@/lib/drawings";
import { getProjects } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function KompositPage() {
  const projects = await getProjects();

  if (projects.length === 0) {
    return (
      <NoticeScreen
        title="Belum ada data proyek"
        message="Komposit gambar butuh proyek aktif lebih dulu."
        hint="Buka /api/setup sekali untuk membuat tabel dan mengisi data contoh."
      />
    );
  }

  const drawings = await listAllDrawings();
  return <KompositClient projects={projects} initialDrawings={drawings} />;
}
