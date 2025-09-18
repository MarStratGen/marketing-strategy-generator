import { useState } from "react";

/* ── Normaliser: turn ANY value into tidy blocks ───────── */
function toBlocks(value) {
  // Return an array of { type: 'p'|'ul'|'dl', items?:string[], rows?:[key,val][], text?:string }
  if (value == null) return [];
  if (typeof value === "string") return normaliseString(value);
  if (Array.isArray(value)) {
    // Flatten arrays of strings/objects into blocks
    const blocks = [];
    value.forEach((item) => blocks.push(...toBlocks(item)));
    return mergeLists(blocks);
  }
  if (typeof value === "object") {
    // Objects become definition lists (label + content)
    const rows = Object.entries(value).filter(([_, v]) => v != null && String(v).trim() !== "");
    // If object really looks like a “channel” card, let OptimizedContent handle it later
    if (rows.length && rows.every(([k, v]) => typeof v !== "object")) {
      // Try to keep key order stable
      return [{ type: "dl", rows }];
    }
    // For nested objects, recurse each value as its own mini-block set
    const blocks = [];
    for (const [k, v] of rows) {
      const inner = toBlocks(v);
      if (inner.length === 0) continue;
      blocks.push({ type: "p", text: titleCase(k.replace(/_/g, " ")) });
      blocks.push(...inner);
    }
    return mergeLists(blocks);
  }
  return [{ type: "p", text: String(value) }];
}

function normaliseString(s) {
  const text = (s || "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  // Split into lines and detect bullets: •, -, *, numbered "1.", "1)"
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const bulletRe = /^(?:•|\-|\*|\d+[.)])\s+/;
  const items = [];
  let nonBullets = [];

  for (const line of lines) {
    if (bulletRe.test(line)) {
      const item = line.replace(bulletRe, "").trim();
      if (nonBullets.length) {
        items.push({ type: "p", text: nonBullets.join(" ") });
        nonBullets = [];
      }
      items.push({ type: "li", text: item });
    } else if (/^\#{1,6}\s+/.test(line)) {
      // markdown headings become simple paragraphs
      const t = line.replace(/^\#{1,6}\s+/, "").trim();
      if (nonBullets.length) {
        items.push({ type: "p", text: nonBullets.join(" ") });
        nonBullets = [];
      }
      items.push({ type: "p", text: t });
    } else if (line === "—" || line === "---") {
      // hr: flush current paragraph
      if (nonBullets.length) {
        items.push({ type: "p", text: nonBullets.join(" ") });
        nonBullets = [];
      }
    } else {
      nonBullets.push(line);
    }
  }
  if (nonBullets.length) items.push({ type: "p", text: nonBullets.join(" ") });

  // If we collected any list items, group them into a single UL
  const blocks = [];
  const list = items.filter((i) => i.type === "li");
  const paras = items.filter((i) => i.type === "p");
  if (paras.length) blocks.push(...paras);
  if (list.length) blocks.push({ type: "ul", items: list.map((i) => i.text) });
  // If no bullets detected, return one paragraph
  if (!list.length && paras.length === 0) return [{ type: "p", text }];
  return blocks;
}

function mergeLists(blocks) {
  // Merge consecutive ULs into one UL; keep paragraphs as-is
  const out = [];
  for (const b of blocks) {
    const last = out[out.length - 1];
    if (b.type === "ul" && last && last.type === "ul") {
      last.items.push(...b.items);
    } else {
      out.push(b);
    }
  }
  return out;
}

function titleCase(s) {
  return s.replace(/\s+/g, " ").trim().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

/* ── helpers ────────────────────────────────────────────── */
const formatSubheading = (k) =>
  k
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());

const friendlyLabel = (k) => {
  if (k === "intent") return "Purchase intent level";
  if (k === "role") return "Funnel job";
  return formatSubheading(k);
};

/* ── main ───────────────────────────────────────────────── */
export default function Report({ plan, loading }) {
  if (loading) return <Skeleton />;
  if (!plan) return null;

  if (plan.error) {
    return (
      <div className="bg-red-100 border border-red-300 text-red-800 rounded p-4">
        <p className="font-semibold">Error</p>
        <pre className="text-xs mt-2 whitespace-pre-wrap">{JSON.stringify(plan, null, 2)}</pre>
      </div>
    );
  }

  const data = plan;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <header className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white">Your Marketing Strategy</h2>
        <p className="text-slate-300 mt-2">Actionable plan with clear KPIs</p>
      </header>

      <ContentSections data={data} />
    </div>
  );
}

/* ── sections builder ──────────────────────────────────── */
function ContentSections({ data }) {
  const kpiStruct =
    data.kpis_detailed && typeof data.kpis_detailed === "object"
      ? data.kpis_detailed
      : null;

  const measurementItems = kpiStruct
    ? [
        { title: "Measurement & Tracking", data: kpiStruct.measurement_and_tracking },
        { title: "Performance Indicators", data: kpiStruct.performance_indicators },
        { title: "Analytics Framework", data: kpiStruct.analytics_framework },
      ]
    : [{ title: "Key Performance Indicators", data: data.kpis }];

  const sections = [
    {
      id: "foundation",
      title: "Market Foundation",
      description: "Understanding your market and customers",
      icon: "🎯",
      color: "blue",
      items: [
        { title: "Market Foundation", data: data.market_foundation },
        { title: "Differentiation Moves", data: data.differentiators },
        { title: "Risks and Safety Nets", data: data.risks_and_safety_nets },
      ],
    },
    {
      id: "strategy",
      title: "Strategic Framework",
      description: "Marketing mix and channel plan",
      icon: "⚡",
      color: "purple",
      items: [
        { title: "Strategy Pillars", data: data.strategy_pillars },
        { title: "Marketing Mix (7 Ps)", data: data.seven_ps },
        { title: "Channel Playbook", data: data.channel_playbook },
        { title: "Personas", data: data.personas },
      ],
    },
    {
      id: "execution",
      title: "Execution Plan",
      description: "Budget allocation and timeline",
      icon: "🚀",
      color: "green",
      items: [
        { title: "Budget Allocation", data: data.budget },
        { title: "Next 90 Days Action Plan", data: data.calendar_next_90_days },
      ],
    },
    {
      id: "measurement",
      title: "Measurement & Analysis",
      description: "KPIs and performance tracking",
      icon: "📊",
      color: "indigo",
      items: measurementItems,
    },
  ];

  return (
    <div className="space-y-2">
      {sections.map((s, index) => (
        <ContentSection key={s.id} section={s} isFirst={index === 0} />
      ))}
    </div>
  );
}

/* ── UI blocks ─────────────────────────────────────────── */
function ContentSection({ section, isFirst }) {
  const [isOpen, setOpen] = useState(isFirst);
  const colors = {
    blue: { bg: "bg-blue-50", border: "border-blue-200" },
    purple: { bg: "bg-purple-50", border: "border-purple-200" },
    green: { bg: "bg-green-50", border: "border-green-200" },
    indigo: { bg: "bg-indigo-50", border: "border-indigo-200" },
  };

  const hasContent = section.items.some((i) => i.data);
  if (!hasContent) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      <button
        onClick={() => setOpen(!isOpen)}
        className="w-full p-6 text-left hover:bg-slate-50 transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900/10 flex items-center justify-center text-xl">
              {section.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{section.title}</h3>
              <p className="text-sm text-slate-600">{section.description}</p>
            </div>
          </div>
          <div className="text-slate-500">{isOpen ? "▾" : "▸"}</div>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-100">
          <div className="p-6 space-y-3 bg-gradient-to-b from-white to-slate-50">
            {section.items
              .filter((i) => i.data)
              .map((item, idx) => (
                <ContentCard
                  key={idx}
                  title={item.title}
                  data={item.data}
                  color={section.color}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContentCard({ title, data, color }) {
  return (
    <div className={`border-2 rounded-xl p-5 ${
      color === "blue" ? "border-blue-200 bg-blue-50" :
      color === "purple" ? "border-purple-200 bg-purple-50" :
      color === "green" ? "border-green-200 bg-green-50" :
      "border-indigo-200 bg-indigo-50"
    }`}>
      <h4 className="text-lg font-bold text-slate-900 mb-3">{title}</h4>
      <div className="prose prose-slate max-w-none text-slate-800">
        <BlockRenderer value={data} />
      </div>
    </div>
  );
}

/* ── Block renderer (uses the normaliser) ───────────────── */
function BlockRenderer({ value }) {
  const blocks = toBlocks(value);
  if (!blocks.length) return <p className="text-slate-500 italic">No data available</p>;
  return (
    <div>
      {blocks.map((b, i) => {
        if (b.type === "p") return <p key={i} className="whitespace-pre-wrap">{b.text}</p>;
        if (b.type === "ul") {
          return (
            <ul key={i} className="list-none space-y-2">
              {b.items.map((t, j) => (
                <li key={j} className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (b.type === "dl") {
          return (
            <div key={i} className="grid sm:grid-cols-3 gap-2">
              {b.rows.map(([k, v], j) => (
                <div key={j} className="sm:col-span-3">
                  <div className="text-sm font-semibold text-slate-900">{friendlyLabel(k)}</div>
                  <div className="text-slate-800">{toBlocks(v).length ? <BlockRenderer value={v} /> : String(v)}</div>
                </div>
              ))}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

/* ── Skeleton ─────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="animate-pulse bg-white/5 rounded-2xl border border-white/10 p-6">
      <div className="h-6 bg-white/20 rounded w-1/3 mb-4" />
      <div className="h-4 bg-white/10 rounded w-2/3 mb-2" />
      <div className="h-4 bg-white/10 rounded w-1/2" />
    </div>
  );
}
