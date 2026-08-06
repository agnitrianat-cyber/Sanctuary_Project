"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import MobileOverlay, { MOBILE_MAX_WIDTH } from "./MobileOverlay";
import {
  MENUS,
  NAV_ITEMS,
  type Activity,
  type AttentionItem,
  type MenuKey,
  type Metric,
  type NavKey,
  type Project,
} from "@/lib/dashboard-data";
import {
  CameraIcon,
  ChevronDownIcon,
  DocIcon,
  EstimateIcon,
  FeasibilityIcon,
  HamburgerIcon,
  HomeIcon,
  LayersIcon,
  OverlayIcon,
  SupervisionIcon,
} from "./icons";

const TOPBAR_HEIGHT = 58;

const MENU_ICONS: Record<MenuKey, ComponentType<{ size?: number }>> = {
  feasibility: FeasibilityIcon,
  supervision: SupervisionIcon,
  estimate: EstimateIcon,
  overlay: OverlayIcon,
};

const ACTIVITY_ICONS = { doc: DocIcon, camera: CameraIcon, layers: LayersIcon };

// Only Komposit Gambar is built so far; the rest still show a placeholder.
const MENU_ROUTES: Partial<Record<MenuKey, string>> = { overlay: "/komposit" };

function todayLabel() {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

type DashboardProps = {
  projects: Project[];
  metrics: Metric[];
  activities: Activity[];
  attention: AttentionItem[];
};

export default function Dashboard({ projects, metrics, activities, attention }: DashboardProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(projects[0].id);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const activeProject = projects.find((p) => p.id === activeProjectId)!;

  function showToast(msg: string) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }

  function selectProject(id: string) {
    const p = projects.find((p) => p.id === id)!;
    setActiveProjectId(id);
    setProjectPickerOpen(false);
    showToast("Proyek diubah ke " + p.name);
  }

  function navigate(key: NavKey, label: string) {
    setSidebarOpen(false);
    const route = key === "dashboard" ? null : MENU_ROUTES[key as MenuKey];
    if (route) router.push(route);
    else if (key !== "dashboard") showToast(label + " belum dibangun.");
  }

  function openMenu(key: MenuKey, title: string) {
    const route = MENU_ROUTES[key];
    if (route) router.push(route);
    else showToast(title + " belum dibangun.");
  }

  return (
    <div style={{ maxWidth: MOBILE_MAX_WIDTH, margin: "0 auto", position: "relative", minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Topbar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "10px 16px",
          background: "var(--color-bg)",
          borderBottom: "2px solid var(--color-divider)",
        }}
      >
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Menu"
          style={{ width: 36, height: 36, border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, cursor: "pointer" }}
        >
          <HamburgerIcon />
        </button>

        <button
          onClick={() => setProjectPickerOpen((v) => !v)}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, height: 36, border: "2px solid var(--color-divider)", background: "var(--color-neutral-100)", padding: "0 12px", cursor: "pointer", maxWidth: 230 }}
        >
          <span style={{ font: "600 13px/1.2 var(--font-heading)", color: "var(--color-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {activeProject.name}
          </span>
          <ChevronDownIcon />
        </button>

        <div style={{ width: 36, height: 36, border: "2px solid var(--color-text)", display: "flex", alignItems: "center", justifyContent: "center", font: "700 12px var(--font-heading)", color: "var(--color-text)", flexShrink: 0 }}>
          BS
        </div>
      </div>

      {/* Project picker sheet */}
      {projectPickerOpen && (
        <MobileOverlay zIndex={6} background="rgba(32,30,29,0.4)" onClick={() => setProjectPickerOpen(false)}>
          <div
            className="fadein"
            style={{ position: "absolute", top: TOPBAR_HEIGHT, left: 0, right: 0, background: "var(--color-bg)", borderBottom: "2px solid var(--color-text)", padding: "14px 16px 18px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ font: "700 11px var(--font-heading)", letterSpacing: ".04em", textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: 10 }}>
              Pilih Proyek
            </div>
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => selectProject(p.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "12px 4px", background: "transparent", border: "none", borderBottom: "1px solid var(--color-divider)", cursor: "pointer", textAlign: "left" }}
              >
                <div>
                  <div style={{ font: "600 14px var(--font-heading)", color: "var(--color-text)" }}>{p.name}</div>
                  <div style={{ font: "12px var(--font-body)", color: "var(--color-neutral-700)", marginTop: 2 }}>{p.location}</div>
                </div>
                {p.id === activeProjectId && <div style={{ width: 9, height: 9, background: "var(--color-accent)" }} />}
              </button>
            ))}
          </div>
        </MobileOverlay>
      )}

      {/* Greeting */}
      <div style={{ padding: "18px 16px 14px" }}>
        <div style={{ font: "700 22px/1.2 var(--font-heading)", color: "var(--color-text)" }}>Halo, Pak Budi</div>
        <div style={{ font: "13px var(--font-body)", color: "var(--color-neutral-700)", marginTop: 3 }}>
          {todayLabel()} · {activeProject.name}
        </div>
      </div>

      {/* Metrics row */}
      <div className="no-scrollbar" style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px 6px" }}>
        {metrics.map((m) => (
          <div key={m.label} className="card" style={{ flex: "0 0 148px", padding: 14, boxSizing: "border-box" }}>
            <div style={{ font: "11px var(--font-body)", color: "var(--color-neutral-700)", lineHeight: 1.3, minHeight: 28 }}>{m.label}</div>
            <div style={{ font: "700 26px var(--font-heading)", color: "var(--color-text)", marginTop: 6, letterSpacing: "-.01em" }}>{m.value}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
              <span style={{ font: "600 11px var(--font-body)", color: m.deltaColor }}>{m.delta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Menu cards */}
      <div style={{ padding: "22px 16px 6px" }}>
        <div style={{ font: "700 11px var(--font-heading)", letterSpacing: ".04em", textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: 10 }}>
          Menu
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          {MENUS.map((menu) => {
            const Icon = MENU_ICONS[menu.key];
            return (
              <div key={menu.key} className="card" style={{ padding: 16, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ width: 38, height: 38, border: "2px solid var(--color-text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--color-text)" }}>
                  <Icon />
                </div>
                <div>
                  <div style={{ font: "700 15px var(--font-heading)", color: "var(--color-text)" }}>{menu.title}</div>
                  <div style={{ font: "12.5px/1.4 var(--font-body)", color: "var(--color-neutral-700)", marginTop: 4 }}>{menu.desc}</div>
                </div>
                <button className="btn btn-primary btn-block" style={{ marginTop: 2 }} onClick={() => openMenu(menu.key, menu.title)}>
                  Buka
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Aktivitas terakhir */}
      <div style={{ padding: "22px 16px 6px" }}>
        <div style={{ font: "700 11px var(--font-heading)", letterSpacing: ".04em", textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: 10 }}>
          Aktivitas Terakhir
        </div>
        <div className="card" style={{ padding: "4px 14px" }}>
          {activities.map((a, i) => {
            const Icon = ACTIVITY_ICONS[a.icon];
            return (
              <div key={i} style={{ display: "flex", gap: 10, padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
                <div style={{ width: 30, height: 30, border: "2px solid var(--color-divider)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--color-text)" }}>
                  <Icon />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: "600 13px var(--font-heading)", color: "var(--color-text)" }}>{a.title}</div>
                  <div style={{ font: "12px var(--font-body)", color: "var(--color-neutral-700)", marginTop: 2 }}>{a.meta}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Perlu perhatian */}
      <div style={{ padding: "22px 16px 28px" }}>
        <div style={{ font: "700 11px var(--font-heading)", letterSpacing: ".04em", textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: 10 }}>
          Perlu Perhatian
        </div>
        <div className="card" style={{ padding: "4px 14px", borderColor: "var(--color-accent-300)" }}>
          {attention.map((t, i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="tag tag-accent">{t.tagLabel}</span>
                <span style={{ font: "12px var(--font-body)", color: "var(--color-accent-700)" }}>{t.overdue}</span>
              </div>
              <div style={{ font: "600 13.5px var(--font-heading)", color: "var(--color-text)", marginTop: 6 }}>{t.title}</div>
              <div style={{ font: "12px var(--font-body)", color: "var(--color-neutral-700)", marginTop: 2 }}>{t.location}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar drawer */}
      {sidebarOpen && (
        <MobileOverlay zIndex={10} background="rgba(32,30,29,0.45)" onClick={() => setSidebarOpen(false)}>
          <div
            className="fadein"
            style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 270, maxWidth: "85%", background: "var(--color-bg)", borderRight: "2px solid var(--color-text)", boxSizing: "border-box", padding: "20px 0", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "0 20px 20px", borderBottom: "2px solid var(--color-divider)", marginBottom: 6 }}>
              <div style={{ font: "700 16px var(--font-heading)", color: "var(--color-text)" }}>Divisi Proyek</div>
              <div style={{ font: "12px var(--font-body)", color: "var(--color-neutral-700)", marginTop: 2 }}>Workspace internal</div>
            </div>
            {NAV_ITEMS.map((n) => {
              const active = n.key === "dashboard";
              const Icon = n.key === "dashboard" ? HomeIcon : MENU_ICONS[n.key];
              return (
                <button
                  key={n.key}
                  onClick={() => navigate(n.key, n.label)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "13px 20px",
                    background: active ? "var(--color-accent-100)" : "transparent",
                    border: "none",
                    borderLeft: active ? "3px solid var(--color-accent)" : "3px solid transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ width: 20, height: 20, flexShrink: 0, color: active ? "var(--color-accent-700)" : "var(--color-text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon />
                  </div>
                  <span style={{ font: "600 14px var(--font-heading)", color: active ? "var(--color-accent-700)" : "var(--color-text)" }}>{n.label}</span>
                </button>
              );
            })}
          </div>
        </MobileOverlay>
      )}

      {/* Toast */}
      {toast && (
        <MobileOverlay zIndex={20}>
          <div
            className="fadein"
            style={{ position: "absolute", left: 16, right: 16, bottom: 26, background: "var(--color-text)", color: "var(--color-bg)", padding: "12px 16px", font: "600 13px var(--font-body)", boxShadow: "var(--shadow-md)" }}
          >
            {toast}
          </div>
        </MobileOverlay>
      )}
    </div>
  );
}
