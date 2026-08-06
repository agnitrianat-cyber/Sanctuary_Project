"use client";

import type { CSSProperties, MouseEventHandler, ReactNode } from "react";

/**
 * The design was authored inside a fixed 402px iPhone-frame preview, where
 * sheets/drawers/toasts are positioned absolutely relative to that frame.
 * Here there's no frame — the page itself is the mobile viewport — so this
 * mirrors the same effect: full-viewport fixed backdrop, with an inner
 * column capped at the design's content width so overlays line up with the
 * page content on wide (desktop) browsers too.
 */
export const MOBILE_MAX_WIDTH = 480;

export default function MobileOverlay({
  onClick,
  background,
  zIndex,
  children,
}: {
  onClick?: MouseEventHandler<HTMLDivElement>;
  background?: string;
  zIndex: number;
  children: ReactNode;
}) {
  const outer: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex,
    background,
    // Overlays without a backdrop (e.g. the toast) shouldn't swallow clicks
    // meant for the page underneath.
    pointerEvents: onClick ? "auto" : "none",
  };
  const inner: CSSProperties = {
    maxWidth: MOBILE_MAX_WIDTH,
    height: "100%",
    margin: "0 auto",
    position: "relative",
  };
  return (
    <div style={outer} onClick={onClick}>
      <div style={inner}>{children}</div>
    </div>
  );
}
