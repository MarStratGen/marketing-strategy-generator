import { useState } from "react";

const toTitle = (s = "") =>
  s
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());

/* Helper function to format subheadings with proper Sentence case */
function formatSubheading(key) {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export default function Report({ plan, loading }) {
  const [viewMode] = useState("cards"); // simple view

  if (loading) return <SkeletonTimeline />;
  if (!plan) return null;

  // Error handling
  if (plan.error) {
    const errorMessage =
      typeof plan === "object" ? JSON.stringify(plan, null, 2) : String(plan);
    let userMessage = "An error occurred while generating your marketing plan.";
    if (plan.detail?.error?.message)
      userMessage = `API Error: ${plan.detail.error.message}`;
    else if (plan.error) userMessage = `Error: ${plan.error}`;

    return (
      <div className="mt-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {userMessage}
        </div>
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
            Show technical details
          </summary>
          <pre className="whitespace-pre-wrap text-red-700 text-xs mt-2 bg-red-50 p-4 rounded">
            {errorMessage}
          </pre>
        </details>
      </div>
    );
  }

  const data = plan.GoToMarketPlan || plan.GTM_Plan || plan;

  return (
    <div className="mt-8 w-full max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          🚀 Your Marketing Plan
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
          Organised into clear, scannable sections
        </p>
      </div>

      {/* Card Groups */}
      <CardGroups data={data} />

      {/* Action Bar */}
      <div className="flex flex-wrap gap-3 justify-center bg-gray-50 p-4 rounded-lg">
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(plan, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "marketing-plan.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          📄 Download JSON
        </button>
        <button
          onClick={() => window.print()}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          🖨️ Print Plan
        </button>
      </div>
    </div>
  );
}

function CardGroups({ data }) {
  const groups = [
    {
      title: "🎯 Market foundation",
      description: "Segmentation, targeting, positioning and proof",
      color: "blue",
      items: [
        {
          title: "STP",
          icon: "🧭",
          data:
            data.stp ||
            data.Market_Analysis_and_Positioning ||
            data.MarketAnalysisAndPositioning,
        },
        {
          title: "Positioning",
          icon: "📌",
          data:
            data.stp && data.stp.positioning
              ? data.stp.positioning
              : data.positioning,
        },
      ],
    },
    {
      title: "🔧 Strategy Framework",
      description: "Marketing mix and channels",
      color: "purple",
      items: [
        {
          title: "Marketing Mix (7 Ps)",
          icon: "⚡",
          data: data.mix_7ps || data.Marketing_Mix || data.MarketingMix,
        },
        {
          title: "Channels and intent",
          icon: "🧭",
          data: data.channel_intent_map,
        },
      ],
    },
    {
      title: "💰 Investment and Timeline",
      description: "Budget split and 90 day plan",
      color: "green",
      items: [
        { title: "Budget", icon: "💸", data: data.budget },
        { title: "90 day calendar", icon: "📅", data: data.calendar_90d },
      ],
    },
    {
      title: "📈 Measurement and Tests",
      description: "KPIs, experiments and evidence",
      color: "indigo",
      items: [
        { title: "KPIs", icon: "🎯", data: data.kpis },
        { title: "Experiments", icon: "🧪", data: data.experiments },
        { title: "Evidence ledger", icon: "📂", data: data.evidence_ledger },
        { title: "Funnel maths", icon: "🧮", data: data.funnel_math },
      ],
    },
  ];

  return (
    <div className="space-y-12">
      {groups.map((g, i) => (
        <CardGroup key={i} group={g} />
      ))}
    </div>
  );
}

function CardGroup({ group }) {
  const colors = {
    blue: "from-blue-500 to-blue-600 border-blue-200",
    purple: "from-purple-500 to-purple-600 border-purple-200",
    green: "from-green-500 to-green-600 border-green-200",
    indigo: "from-indigo-500 to-indigo-600 border-indigo-200",
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{group.title}</h3>
        <p className="text-gray-600 max-w-lg mx-auto">{group.description}</p>
      </div>

      <div
        className={`grid gap-6 ${group.items.length === 1 ? "grid-cols-1 max-w-4xl mx-auto" : "grid-cols-1 md:grid-cols-2"}`}
      >
        {group.items
          .filter((it) => it.data)
          .map((it, idx) => (
            <BusinessCard
              key={idx}
              title={it.title}
              icon={it.icon}
              color={colors[group.color]}
              data={it.data}
            />
          ))}
      </div>
    </div>
  );
}

function BusinessCard({ title, icon, color, data }) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition duration-200 overflow-hidden`}
    >
      <div className={`bg-gradient-to-r ${color} text-white p-4`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h4 className="text-lg font-semibold">{title}</h4>
        </div>
      </div>
      <div className="p-4">{renderData(data)}</div>
    </div>
  );
}

function renderData(data, depth = 0) {
  if (!data) return <p className="text-gray-500 italic">No data</p>;

  if (Array.isArray(data)) {
    return (
      <ul className="space-y-2">
        {data.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-gray-700">
            <span className="text-blue-500 mt-1">•</span>
            <span>
              {typeof item === "object"
                ? renderData(item, depth + 1)
                : String(item)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (typeof data === "object") {
    // Pretty print known shapes
    if (data.items && data.rationale && data.within_budget !== undefined) {
      // budget shape
      return (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            <strong>Rationale:</strong> {data.rationale}
          </p>
          <h5 className="font-semibold">Items</h5>
          <ul className="space-y-1">
            {data.items.map((it, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{it.task}</span> — {it.channel} —{" "}
                {it.percent}% {it.fits === false ? "(move to backlog)" : ""}
              </li>
            ))}
          </ul>
          {Array.isArray(data.backlog) && data.backlog.length > 0 && (
            <>
              <h5 className="font-semibold mt-2">Backlog</h5>
              <ul className="space-y-1">
                {data.backlog.map((b, i) => (
                  <li key={i} className="text-sm">
                    {b.task} — {b.reason || "Unfunded"}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {Object.entries(data).map(([k, v]) => (
          <div key={k}>
            <h5 className="font-semibold text-gray-800 text-sm mb-1">
              {formatSubheading(k)}
            </h5>
            <div className="ml-2 text-sm text-gray-700">
              {renderData(v, depth + 1)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-gray-700">{String(data)}</p>;
}

/* Skeleton loader */
function SkeletonTimeline() {
  return (
    <div className="mt-8 w-full max-w-6xl mx-auto px-4">
      <div className="text-center mb-12">
        <div className="h-10 bg-gray-200 rounded-lg w-3/4 mx-auto mb-4 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"></div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="h-6 bg-gray-200 rounded w-2/3 mb-4 animate-pulse"></div>
            <div className="space-y-2">
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
