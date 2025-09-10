import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const toTitle = (s = "") =>
  s
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());

function formatSubheading(key) {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export default function Report({ plan, loading }) {
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
    <div className="mt-12 w-full max-w-5xl mx-auto px-4">
      {/* Header with better hierarchy */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Your Marketing Strategy
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          A comprehensive plan organized into actionable sections
        </p>
      </div>

      {/* Content sections with proper UX flow */}
      <ContentSections data={data} />

      {/* Action bar with better spacing */}
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
        >
          📄 Download JSON
        </button>
        <button
          onClick={() => window.print()}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
        >
          🖨️ Print Strategy
        </button>
      </div>
    </div>
  );
}

function ContentSections({ data }) {
  const sections = [
    {
      id: "foundation",
      title: "Market Foundation",
      description: "Understanding your market position and target audience",
      icon: "🎯",
      color: "blue",
      priority: "high",
      items: [
        {
          title: "Market Analysis & Positioning",
          data: data.stp || data.Market_Analysis_and_Positioning || data.MarketAnalysisAndPositioning,
        },
        {
          title: "Positioning Strategy", 
          data: data.stp?.positioning || data.positioning,
        },
      ],
    },
    {
      id: "strategy",
      title: "Strategic Framework", 
      description: "Your marketing mix and channel strategy",
      icon: "⚡",
      color: "purple",
      priority: "high",
      items: [
        {
          title: "Marketing Mix (7 Ps)",
          data: data.mix_7ps || data.Marketing_Mix || data.MarketingMix,
        },
        {
          title: "Channel Strategy",
          data: data.channel_intent_map,
        },
      ],
    },
    {
      id: "execution",
      title: "Execution Plan",
      description: "Budget allocation and 90-day timeline",
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
      title: "Measurement & Optimization",
      description: "KPIs, experiments, and performance tracking",
      icon: "📊",
      color: "indigo",
      priority: "medium",
      items: [
        { title: "Key Performance Indicators", data: data.kpis },
        { title: "Marketing Experiments", data: data.experiments },
        { title: "Evidence Tracking", data: data.evidence_ledger },
        { title: "Funnel Analysis", data: data.funnel_math },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <ContentSection key={section.id} section={section} />
      ))}
    </div>
  );
}

function ContentSection({ section }) {
  const [isExpanded, setIsExpanded] = useState(section.priority === "high");
  
  const colors = {
    blue: "from-blue-500 to-blue-600 border-blue-200 bg-blue-50",
    purple: "from-purple-500 to-purple-600 border-purple-200 bg-purple-50", 
    green: "from-green-500 to-green-600 border-green-200 bg-green-50",
    indigo: "from-indigo-500 to-indigo-600 border-indigo-200 bg-indigo-50",
  };

  const hasContent = section.items.some(item => item.data);
  if (!hasContent) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Section header with progressive disclosure */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 text-left hover:bg-gray-50 transition-colors duration-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${colors[section.color].split(' ')[0]} ${colors[section.color].split(' ')[1]} flex items-center justify-center text-white text-xl`}>
              {section.icon}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {section.title}
              </h3>
              <p className="text-sm text-gray-600 max-w-2xl">
                {section.description}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          <div className="p-6 space-y-6">
            {section.items
              .filter(item => item.data)
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
  const colors = {
    blue: "border-blue-200 bg-blue-50",
    purple: "border-purple-200 bg-purple-50",
    green: "border-green-200 bg-green-50", 
    indigo: "border-indigo-200 bg-indigo-50",
  };

  return (
    <div className={`border ${colors[color]} rounded-lg p-5`}>
      <h4 className="text-lg font-semibold text-gray-900 mb-4">{title}</h4>
      <div className="prose prose-sm max-w-none">
        <OptimizedContent data={data} />
      </div>
    </div>
  );
}

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
    // Special formatting for budget data
    if (data.items && data.rationale && data.within_budget !== undefined) {
      return (
        <div className="space-y-5">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h5 className="font-semibold text-gray-900 mb-2">Strategy Rationale</h5>
            <p className="text-gray-700 leading-relaxed">
              <FormattedText text={data.rationale} />
            </p>
          </div>
          
          <div>
            <h5 className="font-semibold text-gray-900 mb-3">Budget Breakdown</h5>
            <div className="grid gap-3">
              {data.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.task}</div>
                    <div className="text-sm text-gray-600">{item.channel}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{item.percent}%</div>
                    {item.fits === false && (
                      <div className="text-xs text-amber-600">Backlog</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {Array.isArray(data.backlog) && data.backlog.length > 0 && (
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Future Opportunities</h5>
              <div className="space-y-2">
                {data.backlog.map((item, i) => (
                  <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="font-medium text-gray-900">{item.task}</div>
                    <div className="text-sm text-gray-600">{item.reason || "Requires additional budget"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Standard object formatting with better hierarchy
    return (
      <div className="space-y-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key}>
            <h5 className="font-medium text-gray-900 mb-2 text-base">
              {formatSubheading(key)}
            </h5>
            <div className="ml-3 text-gray-700">
              <OptimizedContent data={value} />
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

function FormattedText({ text }) {
  // Convert long text blocks into more readable format
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  
  if (paragraphs.length === 1) {
    // Single paragraph - check if it contains list-like content
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length > 4 && text.length > 300) {
      // Long content - break into readable chunks
      return (
        <div className="space-y-2">
          {sentences.map((sentence, i) => {
            const trimmed = sentence.trim();
            if (!trimmed) return null;
            return (
              <p key={i} className="leading-relaxed">
                {trimmed}.
              </p>
            );
          })}
        </div>
      );
    }
  }

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="leading-relaxed">
          {paragraph.trim()}
        </p>
      ))}
    </div>
  );
}

function SkeletonTimeline() {
  return (
    <div className="mt-12 w-full max-w-5xl mx-auto px-4">
      <div className="text-center mb-12">
        <div className="h-8 bg-gray-200 rounded-lg w-64 mx-auto mb-3 animate-pulse"></div>
        <div className="h-5 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
      </div>
      
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
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