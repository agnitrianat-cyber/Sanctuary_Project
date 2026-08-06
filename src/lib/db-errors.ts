// Postgres reports a missing table as SQLSTATE 42P01. This is the expected
// state before /api/setup has been run, so it deserves its own instruction
// rather than a generic "connection failed".
export function isMissingTableError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /42P01/.test(message) || /relation ".*" does not exist/i.test(message);
}

export function describeDbError(err: unknown) {
  const raw = err instanceof Error ? err.message : String(err);
  // Never echo the credentials half of a connection URL.
  const message = raw.replace(/([a-z][a-z0-9+.-]*:\/\/)[^\s/@]+@/gi, "$1<redacted>@");

  if (isMissingTableError(err)) {
    return {
      title: "Tabel database belum dibuat",
      message: "Database terhubung, tapi tabelnya belum ada. Ini normal kalau /api/setup belum pernah dibuka, atau ada tabel baru sejak update terakhir.",
      hint: message,
      showSetup: true,
    };
  }

  return {
    title: "Gagal memuat data",
    message: "Data tidak bisa diambil dari database.",
    hint: message,
    showSetup: false,
  };
}
