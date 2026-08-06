import type { ReactNode } from "react";
import { MOBILE_MAX_WIDTH } from "./MobileOverlay";

type NoticeScreenProps = {
  title: string;
  message: string;
  hint?: string;
  /** Shows a button that opens /api/setup, for when tables are missing. */
  showSetup?: boolean;
  children?: ReactNode;
};

// Shared full-screen state for "kosong" and "gagal" cases, so the user never
// lands on a blank screen without an explanation (PRD §6).
export default function NoticeScreen({ title, message, hint, showSetup, children }: NoticeScreenProps) {
  return (
    <div
      style={{
        maxWidth: MOBILE_MAX_WIDTH,
        margin: "0 auto",
        minHeight: "100vh",
        background: "var(--color-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      <div className="card" style={{ padding: 22, width: "100%", boxSizing: "border-box" }}>
        <div style={{ font: "700 17px/1.3 var(--font-heading)", color: "var(--color-text)" }}>{title}</div>
        <div style={{ font: "13px/1.5 var(--font-body)", color: "var(--color-neutral-700)", marginTop: 8 }}>
          {message}
        </div>
        {hint && (
          <div
            style={{
              font: "12px/1.5 var(--font-body)",
              color: "var(--color-neutral-700)",
              marginTop: 12,
              padding: "10px 12px",
              background: "var(--color-neutral-100)",
              border: "1px solid var(--color-divider)",
            }}
          >
            {hint}
          </div>
        )}
        {showSetup && (
          <a
            className="btn btn-primary"
            href="/api/setup"
            style={{ marginTop: 16, display: "inline-flex", textDecoration: "none" }}
          >
            Buat tabel sekarang
          </a>
        )}
        {children}
      </div>
    </div>
  );
}
