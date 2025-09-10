import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

/* ── helpers ────────────────────────────────────────────── */
const formatSubheading = (k) =>
  k
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());

/* ── main ───────────────────────────────────────────────── */
export default function Report({ plan, loading }) {
  if (loading) return <SkeletonTimeline />;
  if (!plan) return null;

  /* error handling */
  if (plan.error) {
    const tech = JSON.stringify(plan, null, 2);
    const human = plan.detail?.error?.message
      ? `API error: ${plan.detail.error.message}`
      : plan.error;

    return (
      <div className="mt-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {human}
        </div>
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
            Show technical details
          </summary>
          <pre className="whitespace-pre-wrap text-red-700 text-xs mt-2 bg-red-50 p-4 rounded">
            {tech}
          </pre>
        </details>
      </div>
    );
  }

  const data = plan.GoToMarketPlan || plan.GTM_Plan || plan;

  return (
    <div className="mt-12 w-full max-w-5xl mx-auto px-4">
      {/* header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Your Marketing Strategy
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          A comprehensive plan organised into actionable sections
        </p>
      </div>

      <ContentSections data={data} />

      {/* actions */}
      <div className="flex flex-wrap gap-4 justify-center bg-gray-50 p-6 rounded-xl mt-12">
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(plan, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "marketing-strategy.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:shadow-md"
        >
          📄 Download JSON
        </button>
        <button
          onClick={() => window.print()}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:shadow-md"
        >
          🖨️ Print Strategy
        </button>
      </div>
    </div>
  );
}

/* ── sections builder ──────────────────────────────────── */
function ContentSections({ data }) {
  const sections = [
    {
      id: "foundation",
      title: "Market Foundation",
      description: "Understanding your market and customers",
      icon: "🎯",
      color: "blue",
      priority: "high",
      items: [
        {
          title:
            "Market Analysis & Positioning (STP – Segmentation, Targeting, Positioning)",
          data: data.stp,
        },
        {
          title: "Positioning Strategy",
          data: data.stp?.positioning,
        },
        { title: "Competitor snapshot", data: data.competitors_brief },
        { title: "How we stand out", data: data.differentiation_moves },
        { title: "Risks and mitigations", data: data.risks },
      ],
    },
    {
      id: "strategy",
      title: "Strategic Framework",
      description: "Marketing mix and channel plan",
      icon: "⚡",
      color: "purple",
      priority: "high",
      items: [
        { title: "Marketing Mix (7 Ps)", data: data.mix_7ps },
        { title: "Channel Strategy", data: data.channel_intent_map },
        { title: "Strategy pillars", data: data.strategy_pillars },
        { title: "Personas", data: data.personas },
      ],
    },
    {
      id: "execution",
      title: "Execution Plan",
      description: "Budget allocation and timeline",
      icon: "🚀",
      color: "green",
      priority: "high",
      items: [
        { title: "Budget Allocation", data: data.budget },
        { title: "90-Day Action Plan", data: data.calendar_90d },
      ],
    },
    {
      id: "measurement",
      title: "Measurement & Optimisation",
      description: "KPIs, experiments, and funnel maths",
      icon: "📊",
      color: "indigo",
      priority: "medium",
      items: [
        { title: "Key Performance Indicators", data: data.kpis },
        { title: "Marketing Experiments", data: data.experiments },
        { title: "Funnel Analysis", data: data.funnel_math },
        { title: "Evidence Tracking", data: data.evidence_ledger },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {sections.map((s) => (
        <ContentSection key={s.id} section={s} />
      ))}
    </div>
  );
}

/* ── UI blocks (unchanged) ─────────────────────────────── */
function ContentSection({ section }) {
  const [isOpen, setOpen] = useState(section.priority === "high");
  const colors = {
    blue: "from-blue-500 to-blue-600 border-blue-200 bg-blue-50",
    purple: "from-purple-500 to-purple-600 border-purple-200 bg-purple-50",
    green: "from-green-500 to-green-600 border-green-200 bg-green-50",
    indigo: "from-indigo-500 to-indigo-600 border-indigo-200 bg-indigo-50",
  };

  const hasContent = section.items.some((i) => i.data);
  if (!hasContent) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!isOpen)}
        className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-lg bg-gradient-to-r ${
                colors[section.color].split(" ")[0]
              } ${colors[section.color].split(" ")[1]} flex items-center justify-center text-white text-xl`}
            >
              {section.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {section.title}
              </h3>
              <p className="text-sm text-gray-600">{section.description}</p>
            </div>
          </div>
          {isOpen ? (
            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100">
          <div className="p-6 space-y-6">
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
  const colours = {
    blue: "border-blue-200 bg-blue-50",
    purple: "border-purple-200 bg-purple-50",
    green: "border-green-200 bg-green-50",
    indigo: "border-indigo-200 bg-indigo-50",
  };

  return (
    <div className={`border ${colours[color]} rounded-lg p-5`}>
      <h4 className="text-lg font-semibold text-gray-900 mb-4">{title}</h4>
      <div className="prose prose-sm max-w-none">
        <OptimizedContent data={data} />
      </div>
    </div>
  );
}

/* Recursive content renderer (unchanged except UK spelling) */
function OptimizedContent({ data }) {
  if (!data) return <p className="text-gray-500 italic">No data available</p>;

  if (Array.isArray(data)) {
    return (
      <ul className="space-y-3">
        {data.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="text-blue-500 mt-1.5 text-sm">•</span>
            <div className="flex-1 text-gray-700 leading-relaxed">
              {typeof item === "object" ? (
                <OptimizedContent data={item} />
              ) : (
                <FormattedText text={String(item)} />
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (typeof data === "object") {
    return (
      <div className="space-y-4">
        {Object.entries(data).map(([k, v]) => (
          <div key={k}>
            <h5 className="font-medium text-gray-900 mb-2 text-base">
              {formatSubheading(k)}
            </h5>
            <div className="ml-3 text-gray-700">
              <OptimizedContent data={v} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="text-gray-700 leading-relaxed">
      <FormattedText text={String(data)} />
    </div>
  );
}

/* text splitter */
function FormattedText({ text }) {
  const paras = text.split("\n\n").filter((p) => p.trim());
  return (
    <div className="space-y-3">
      {paras.map((p, i) => (
        <p key={i} className="leading-relaxed">
          {p.trim()}
        </p>
      ))}
    </div>
  );
}

/* skeleton loader */
function SkeletonTimeline() {
  return (
    <div className="mt-12 w-full max-w-5xl mx-auto px-4">
      <div className="text-center mb-12">
        <div className="h-8 bg-gray-200 rounded-lg w-64 mx-auto mb-3 animate-pulse"></div>
        <div className="h-5 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
      </div>
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
