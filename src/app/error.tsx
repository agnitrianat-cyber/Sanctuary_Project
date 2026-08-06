"use client";

import NoticeScreen from "@/components/NoticeScreen";

// Catches failures from the Neon query in page.tsx (DATABASE_URL missing,
// database unreachable, tables not created yet) instead of showing a raw 500.
// Note: this Next.js version passes `retry`, not the older `reset`.
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <NoticeScreen
      title="Terjadi kesalahan"
      message="Halaman ini gagal dimuat."
      hint={error.message || "Buka /api/health untuk melihat komponen mana yang bermasalah."}
    >
      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => retry()}>
        Coba lagi
      </button>
    </NoticeScreen>
  );
}
