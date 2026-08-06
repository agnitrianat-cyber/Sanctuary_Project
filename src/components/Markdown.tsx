import type { ReactNode } from "react";

// A deliberately small renderer for the headings, bullets and bold text the
// analysis prompt asks for. Enough for this one output, and no dependency.
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];

  const flush = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`u${blocks.length}`} style={{ margin: "8px 0 0", paddingLeft: 20, display: "grid", gap: 6 }}>
        {list.map((item, i) => (
          <li key={i} style={{ font: "13px/1.65 var(--font-body)", color: "var(--color-text)" }}>{inline(item)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (/^#{2,3}\s+/.test(line)) {
      flush();
      blocks.push(
        <div
          key={`h${blocks.length}`}
          style={{
            font: "700 12px var(--font-heading)",
            letterSpacing: ".04em",
            textTransform: "uppercase",
            color: "var(--color-neutral-700)",
            marginTop: blocks.length ? 18 : 0,
            marginBottom: 6,
          }}
        >
          {line.replace(/^#{2,3}\s+/, "")}
        </div>,
      );
    } else if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ""));
    } else if (/^\s*\d+\.\s+/.test(line)) {
      list.push(line.replace(/^\s*\d+\.\s+/, ""));
    } else if (line.trim() === "") {
      flush();
    } else {
      flush();
      blocks.push(
        <p key={`p${blocks.length}`} style={{ font: "13px/1.7 var(--font-body)", color: "var(--color-text)", margin: "6px 0 0" }}>
          {inline(line)}
        </p>,
      );
    }
  }
  flush();

  return <div>{blocks}</div>;
}
