import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import { saveAs } from "file-saver";

/* ── helpers ────────────────────────────────────────────── */
const formatSubheading = (k) =>
  k
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());

/* prettier headings for intent / role */
const friendlyLabel = (k) => {
  if (k === "intent") return "Purchase intent level";
  if (k === "role") return "Funnel job";
  return formatSubheading(k);
};

/* ── main ───────────────────────────────────────────────── */
export default function Report({ plan, loading, streaming, streamingContent }) {
  if (loading) return <SkeletonTimeline />;

  // Show streaming content while it's being generated
  if (streaming && streamingContent) {
    return <StreamingDisplay content={streamingContent} />;
  }

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
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
          Your Marketing Strategy
        </h2>
        <p className="text-xl text-white max-w-3xl mx-auto leading-relaxed font-medium">
          A marketing strategy organised into actionable sections for immediate
          implementation
        </p>
      </div>

      <ContentSections data={data} />

      {/* actions */}
      <div className="mt-16 bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-8">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Download Your Strategy
          </h3>
          <p className="text-slate-600 text-sm">
            Export your marketing strategy in your preferred format
          </p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => downloadWord(data)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
          >
            📄 Word Document
          </button>
          <button
            onClick={() => window.print()}
            className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
          >
            🖨️ Print Text Only
          </button>
        </div>
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
        { title: "Market Foundation", data: data.market_foundation },
        {
          title: "Differentiation Moves",
          data: data.differentiators || data.differentiation_moves,
        },
        { title: "Risks and Safety Nets", data: data.risks_and_safety_nets },
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
        { title: "Strategy Pillars", data: data.strategy_pillars },
        { title: "Competitor Analysis", data: data.competitors_brief },
        {
          title: "Marketing Mix (7 Ps)",
          data: data.seven_ps || data.marketing_mix_7ps,
        },
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
      priority: "high",
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
      priority: "medium",
      items: [{ title: "Key Performance Indicators", data: data.kpis }],
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

/* ── UI blocks (REDESIGNED) ─────────────────────────────── */
function ContentSection({ section, isFirst }) {
  const [isOpen, setOpen] = useState(isFirst);
  const colors = {
    blue: {
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
    },
    purple: {
      gradient: "from-purple-500 to-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-700",
    },
    green: {
      gradient: "from-green-500 to-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
    },
    indigo: {
      gradient: "from-indigo-500 to-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      text: "text-indigo-700",
    },
  };

  const hasContent = section.items.some((i) => i.data);
  if (!hasContent) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      <button
        onClick={() => setOpen(!isOpen)}
        className="w-full p-8 text-left hover:bg-slate-50 transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${colors[section.color].gradient} flex items-center justify-center text-white text-2xl`}
            >
              {section.icon}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
                {section.title}
              </h3>
              <p className="text-base text-slate-700 font-medium leading-relaxed">
                {section.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isFirst && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                START HERE
              </span>
            )}
            {isOpen ? (
              <ChevronDownIcon className="w-6 h-6 text-slate-400" />
            ) : (
              <ChevronRightIcon className="w-6 h-6 text-slate-400" />
            )}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-100">
          <div className="p-8 space-y-2 bg-gradient-to-b from-white to-slate-50">
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
    blue: "border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100/50",
    purple:
      "border-purple-100 bg-gradient-to-br from-purple-50 to-purple-100/50",
    green: "border-green-100 bg-gradient-to-br from-green-50 to-green-100/50",
    indigo:
      "border-indigo-100 bg-gradient-to-br from-indigo-50 to-indigo-100/50",
  };

  return (
    <div className={`border-2 ${colours[color]} rounded-xl p-6 shadow-sm`}>
      <h4 className="text-xl font-bold text-slate-900 mb-5 tracking-tight">
        {title}
      </h4>
      <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed">
        <OptimizedContent data={data} />
      </div>
    </div>
  );
}

/* SUPER SIMPLE content renderer (NO CONFUSION) */
function OptimizedContent({ data }) {
  if (!data) return <p className="text-slate-500 italic">No data available</p>;

  // Special handling for budget band capitalization and context
  if (typeof data === "object" && data.band && data.allocation) {
    const bandMap = {
      none: "No paid budget",
      low: "Low",
      medium: "Medium",
      high: "High",
    };

    return (
      <div>
        <h6
          className="font-bold text-slate-900 text-base"
          style={{ marginTop: "32px", marginBottom: "0px" }}
        >
          Budget Level
        </h6>
        <p
          className="text-slate-700"
          style={{ marginTop: "0px", marginBottom: "12px", lineHeight: "1.6" }}
        >
          {bandMap[data.band] || data.band} - This indicates the overall budget
          tier for your marketing activities.
        </p>
        <div className="text-slate-700 leading-relaxed">
          <FormattedText text={String(data.allocation)} />
        </div>
      </div>
    );
  }

  if (Array.isArray(data)) {
    // SPECIAL RENDERER for Channel Playbook arrays
    if (
      data.length > 0 &&
      data[0] &&
      typeof data[0] === "object" &&
      data[0].channel &&
      data[0].intent &&
      data[0].role
    ) {
      return (
        <div>
          {data.map((channel, i) => (
            <div key={i} style={{ marginTop: i > 0 ? "32px" : "0px" }}>
              <h6
                className="font-bold text-slate-900 text-base flex items-center"
                style={{ marginTop: "0px", marginBottom: "8px" }}
              >
                <span className="text-blue-600 font-bold text-lg mr-3">•</span>
                <span>{channel.channel}</span>
              </h6>

              {channel.summary && (
                <p
                  className="text-slate-700 leading-relaxed"
                  style={{ marginTop: "0px", marginBottom: "12px", marginLeft: "20px" }}
                >
                  {channel.summary}
                </p>
              )}

              {channel.why_it_works && (
                <p
                  className="text-slate-700 leading-relaxed"
                  style={{ marginTop: "0px", marginBottom: "12px", marginLeft: "20px" }}
                >
                  {channel.why_it_works}
                </p>
              )}

              <p
                className="text-slate-700"
                style={{ marginTop: "0px", marginBottom: "4px", marginLeft: "20px" }}
              >
                Purchase intent level: {channel.intent}
              </p>
              <p
                className="text-slate-700"
                style={{ marginTop: "0px", marginBottom: "4px", marginLeft: "20px" }}
              >
                Funnel job: {channel.role}
              </p>
              {channel.success_metric && (
                <p
                  className="text-slate-700"
                  style={{ marginTop: "0px", marginBottom: "4px", marginLeft: "20px" }}
                >
                  Success metric: {channel.success_metric}
                </p>
              )}
              {channel.budget_percent !== undefined && (
                <p
                  className="text-slate-700"
                  style={{ marginTop: "0px", marginBottom: "4px", marginLeft: "20px" }}
                >
                  Budget percent: {channel.budget_percent}%
                </p>
              )}

              {/* FIXED: Key Actions moved to END with normalized font sizes */}
              {channel.key_actions && channel.key_actions.length > 0 && (
                <div style={{ marginTop: "16px", marginBottom: "12px", marginLeft: "20px" }}>
                  <h6
                    className="font-bold text-slate-900 text-base"
                    style={{ marginBottom: "8px" }}
                  >
                    Key Actions
                  </h6>
                  <ul className="text-slate-700 text-base space-y-2 ml-4">
                    {channel.key_actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="list-disc">
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Default array renderer (with bullets)
    return (
      <ul className="space-y-2 list-none">
        {data.map((item, i) => (
          <li
            key={i}
            className="flex items-baseline gap-3 text-slate-700 leading-relaxed"
          >
            <span className="text-blue-600 font-bold">•</span>
            <div className="flex-1">
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
    /* ----------------------------------------------------------
       SPECIAL RENDERER for channel objects (now works with normalized data)
       ---------------------------------------------------------- */
    if (
      !Array.isArray(data) &&
      data &&
      typeof data === "object" &&
      (data.intent || data.purchase_intent) &&
      (data.role || data.funnel_job)
    ) {
      const channelName = data.channel || data.name || data.channel_name;
      const intent = data.intent || data.purchase_intent;
      const role = data.role || data.funnel_job;

      return (
        <div>
          {channelName && (
            <h6
              className="font-bold text-slate-900 text-base"
              style={{ marginTop: "0px", marginBottom: "0px" }}
            >
              {channelName}
            </h6>
          )}

          {data.summary && (
            <p
              className="text-slate-700 leading-relaxed"
              style={{ marginTop: "12px", marginBottom: "12px" }}
            >
              {data.summary}
            </p>
          )}

          {data.why_it_works && (
            <p
              className="text-slate-700 leading-relaxed"
              style={{ marginTop: "0px", marginBottom: "12px" }}
            >
              {data.why_it_works}
            </p>
          )}

          <p
            className="text-slate-700"
            style={{ marginTop: "0px", marginBottom: "4px" }}
          >
            Purchase intent level: {intent}
          </p>
          <p
            className="text-slate-700"
            style={{ marginTop: "0px", marginBottom: "4px" }}
          >
            Funnel job: {role}
          </p>
          {data.success_metric && (
            <p
              className="text-slate-700"
              style={{ marginTop: "0px", marginBottom: "4px" }}
            >
              Success metric: {data.success_metric}
            </p>
          )}
          {data.budget_percent !== undefined && (
            <p
              className="text-slate-700"
              style={{ marginTop: "0px", marginBottom: "4px" }}
            >
              Budget percent: {data.budget_percent}%
            </p>
          )}

          {/* FIXED: Key Actions moved to END with normalized font sizes */}
          {data.key_actions && data.key_actions.length > 0 && (
            <div style={{ marginTop: "16px", marginBottom: "12px" }}>
              <h6
                className="font-bold text-slate-900 text-base"
                style={{ marginBottom: "8px" }}
              >
                Key Actions
              </h6>
              <ul className="text-slate-700 text-base space-y-2 ml-4">
                {data.key_actions.map((action, actionIndex) => (
                  <li key={actionIndex} className="list-disc">
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    /* ----- keep existing object-renderer below this line ----- */

    const entries = Object.entries(data);
    return (
      <div>
        {entries.map(([k, v], index) => (
          <div key={k} style={{ marginTop: index > 0 ? "32px" : "0px" }}>
            <h5
              className="font-semibold text-slate-900 text-base"
              style={{ marginBottom: "2px" }}
            >
              {friendlyLabel(k)}
            </h5>
            <div className="text-slate-700" style={{ marginTop: "0px" }}>
              <OptimizedContent data={v} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="text-slate-700 leading-relaxed">
      <FormattedText text={String(data)} />
    </div>
  );
}

/* COMPLETELY REWRITTEN: Smart text formatter for marketing strategy content */
function FormattedText({ text }) {
  if (!text || typeof text !== 'string') return null;
  
  // Clean the text first
  const cleanText = text.trim();
  
  // Handle 90-day action plan special case - MUCH more aggressive detection
  if (cleanText.includes('Week') || cleanText.includes('day') || cleanText.includes('Foundation') || cleanText.includes('Launch') || cleanText.includes('Month')) {
    return <ActionPlan90Days text={cleanText} />;
  }
  
  // Handle personas - detect if this looks like persona content
  if (cleanText.includes('Persona') || (cleanText.includes('Age:') && cleanText.includes('Income:')) || (cleanText.length > 500 && cleanText.includes('demographic'))) {
    return <PersonasContent text={cleanText} />;
  }
  
  // Handle marketing mix - detect 7 Ps content
  if (cleanText.includes('Product:') || cleanText.includes('Price:') || cleanText.includes('Promotion:') || cleanText.includes('Place:')) {
    return <MarketingMixContent text={cleanText} />;
  }
  
  // Handle strategy pillars - detect pillar content  
  if (cleanText.includes('Pillar') || (cleanText.includes('brand') && cleanText.includes('customer') && cleanText.length > 300)) {
    return <StrategyPillarsContent text={cleanText} />;
  }
  
  // Handle differentiation moves - detect competitive differentiation
  if (cleanText.includes('differentiat') || cleanText.includes('competi') || (cleanText.includes('advantage') && cleanText.includes('market'))) {
    return <DifferentiationContent text={cleanText} />;
  }

  // For any other text, use enhanced paragraph processing
  return <EnhancedTextContent text={cleanText} />;
}

/* SPECIALIZED CONTENT RENDERERS */

/* Handler for personas content */
function PersonasContent({ text }) {
  // Use regex to capture actual subheadings from the content
  const matches = Array.from(text.matchAll(/(?:^|\n)(?:Persona|Customer Persona|Target)\s*\d*\s*:?\s*([^\n:]{2,80})\s*[:\-–—]?\s*\n?([\s\S]*?)(?=(?:\n(?:Persona|Customer Persona|Target)\s*\d*\s*:)|$)/gi));
  
  if (matches.length > 0) {
    return (
      <div className="space-y-6">
        {matches.map((match, index) => {
          const title = match[1]?.trim() || `Persona ${index + 1}`;
          const body = match[2]?.trim() || '';
          
          return (
            <div key={index}>
              <h6 className="font-bold text-slate-900 text-base flex items-center" style={{ marginTop: index > 0 ? "24px" : "0px", marginBottom: "8px" }}>
                <span className="text-blue-600 font-bold text-lg mr-3">•</span>
                <span>{title}</span>
              </h6>
              <div style={{ marginLeft: "20px" }}>
                <EnhancedTextContent text={body} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback: split by paragraphs and use first line as heading
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim() && p.length > 50);
  return (
    <div className="space-y-6">
      {paragraphs.slice(0, 3).map((para, index) => {
        const lines = para.trim().split('\n');
        const title = lines[0]?.split(':')[0]?.trim() || `Persona ${index + 1}`;
        const body = lines.slice(0).join('\n').replace(/^[^:]*:?\s*/, '').trim();
        
        return (
          <div key={index}>
            <h6 className="font-bold text-slate-900 text-base flex items-center" style={{ marginTop: index > 0 ? "24px" : "0px", marginBottom: "8px" }}>
              <span className="text-blue-600 font-bold text-lg mr-3">•</span>
              <span>{title}</span>
            </h6>
            <div style={{ marginLeft: "20px" }}>
              <EnhancedTextContent text={body} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Handler for marketing mix (7 Ps) content */
function MarketingMixContent({ text }) {
  const sevenPs = ['Product', 'Price', 'Place', 'Promotion', 'People', 'Process', 'Physical Evidence'];
  
  return (
    <div className="space-y-6">
      {sevenPs.map((p, index) => {
        const regex = new RegExp(`${p}:(.*?)(?=${sevenPs[index + 1]}:|$)`, 'si');
        const match = text.match(regex);
        const content = match ? match[1].trim() : '';
        
        if (!content) return null;
        
        return (
          <div key={index}>
            <h6 className="font-bold text-slate-900 text-base flex items-center" style={{ marginTop: index > 0 ? "24px" : "0px", marginBottom: "8px" }}>
              <span className="text-blue-600 font-bold text-lg mr-3">•</span>
              <span>{p}</span>
            </h6>
            <p className="text-slate-700" style={{ marginLeft: "20px", lineHeight: "1.6" }}>{content}</p>
          </div>
        );
      }).filter(Boolean)}
    </div>
  );
}

/* Handler for strategy pillars content */
function StrategyPillarsContent({ text }) {
  // Use regex to capture actual subheadings from the content
  const matches = Array.from(text.matchAll(/(?:^|\n)(?:Strategic\s*)?Pillar\s*\d*\s*:?\s*([^\n:]{2,80})\s*[:\-–—]?\s*\n?([\s\S]*?)(?=(?:\n(?:Strategic\s*)?Pillar\s*\d*\s*:)|$)/gi));
  
  if (matches.length > 0) {
    return (
      <div className="space-y-6">
        {matches.map((match, index) => {
          const title = match[1]?.trim() || `Strategy Pillar ${index + 1}`;
          const body = match[2]?.trim() || '';
          
          return (
            <div key={index}>
              <h6 className="font-bold text-slate-900 text-base flex items-center" style={{ marginTop: index > 0 ? "24px" : "0px", marginBottom: "8px" }}>
                <span className="text-blue-600 font-bold text-lg mr-3">•</span>
                <span>{title}</span>
              </h6>
              <div style={{ marginLeft: "20px" }}>
                <EnhancedTextContent text={body} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback: split by paragraphs and use first line as heading
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim() && p.length > 50);
  return (
    <div className="space-y-6">
      {paragraphs.map((para, index) => {
        const lines = para.trim().split('\n');
        const title = lines[0]?.split(':')[0]?.trim() || `Strategy Element ${index + 1}`;
        const body = lines.slice(0).join('\n').replace(/^[^:]*:?\s*/, '').trim();
        
        return (
          <div key={index}>
            <h6 className="font-bold text-slate-900 text-base flex items-center" style={{ marginTop: index > 0 ? "24px" : "0px", marginBottom: "8px" }}>
              <span className="text-blue-600 font-bold text-lg mr-3">•</span>
              <span>{title}</span>
            </h6>
            <div style={{ marginLeft: "20px" }}>
              <EnhancedTextContent text={body} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Handler for differentiation moves content */
function DifferentiationContent({ text }) {
  // Use regex to capture actual subheadings from the content
  const matches = Array.from(text.matchAll(/(?:^|\n)(?:(?:Move|Differentiation)\s*\d*\s*:|\d+\.)\s*([^\n:–—-]{2,80})(?:[:–—-]\s*)?([\s\S]*?)(?=(?:\n(?:(?:Move|Differentiation)\s*\d*\s*:|\d+\.))|$)/gi));
  
  if (matches.length > 0) {
    return (
      <div className="space-y-6">
        {matches.map((match, index) => {
          const title = match[1]?.trim() || `Differentiation Move ${index + 1}`;
          const body = match[2]?.trim() || '';
          
          return (
            <div key={index}>
              <h6 className="font-bold text-slate-900 text-base flex items-center" style={{ marginTop: index > 0 ? "24px" : "0px", marginBottom: "8px" }}>
                <span className="text-blue-600 font-bold text-lg mr-3">•</span>
                <span>{title}</span>
              </h6>
              <div style={{ marginLeft: "20px" }}>
                <EnhancedTextContent text={body} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback: split by paragraphs and use first line as heading
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim() && p.length > 30);
  return (
    <div className="space-y-6">
      {paragraphs.map((para, index) => {
        const lines = para.trim().split('\n');
        const title = lines[0]?.split(/[:–—-]/)[0]?.trim() || `Differentiation Move ${index + 1}`;
        const body = lines.slice(0).join('\n').replace(/^[^:–—-]*[:–—-]?\s*/, '').trim();
        
        return (
          <div key={index}>
            <h6 className="font-bold text-slate-900 text-base flex items-center" style={{ marginTop: index > 0 ? "24px" : "0px", marginBottom: "8px" }}>
              <span className="text-blue-600 font-bold text-lg mr-3">•</span>
              <span>{title}</span>
            </h6>
            <div style={{ marginLeft: "20px" }}>
              <EnhancedTextContent text={body} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Handler for enhanced general text content */
function EnhancedTextContent({ text }) {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  
  return (
    <div className="space-y-4">
      {paragraphs.map((para, index) => {
        const trimmed = para.trim();
        
        // Check if paragraph contains multiple bullet points
        if ((trimmed.match(/•/g) || []).length > 1) {
          return <EmbeddedBulletList key={index} text={trimmed} />;
        }
        
        // Check if this looks like a subheading
        if (trimmed.length < 80 && !trimmed.includes('.') && /^[A-Z]/.test(trimmed)) {
          return (
            <h6 key={index} className="font-bold text-slate-900 text-base flex items-center" style={{ marginTop: index > 0 ? "24px" : "0px", marginBottom: "8px" }}>
              <span className="text-blue-600 font-bold text-lg mr-3">•</span>
              <span>{trimmed}</span>
            </h6>
          );
        }
        
        // Regular paragraph
        return (
          <p key={index} className="text-slate-700" style={{ lineHeight: "1.6", marginBottom: "12px" }}>
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

/* FIXED: Handler for 90-day action plans */
function ActionPlan90Days({ text }) {
  // Much more aggressive splitting for 90-day plans
  const phases = [];
  
  // Try to split by week patterns first
  if (text.includes('Week')) {
    const weekSections = text.split(/Week \d+-?\d*:?/i).filter(s => s.trim());
    if (weekSections.length >= 3) {
      phases.push(
        { title: "First 30 days", content: weekSections[0]?.trim() || "" },
        { title: "Next 30 days", content: weekSections[1]?.trim() || "" },
        { title: "Final 30 days", content: weekSections[2]?.trim() || "" }
      );
    }
  }
  
  // Try to split by month patterns
  if (phases.length === 0 && text.includes('Month')) {
    const monthSections = text.split(/Month \d+:?/i).filter(s => s.trim());
    if (monthSections.length >= 3) {
      phases.push(
        { title: "First 30 days", content: monthSections[0]?.trim() || "" },
        { title: "Next 30 days", content: monthSections[1]?.trim() || "" },
        { title: "Final 30 days", content: monthSections[2]?.trim() || "" }
      );
    }
  }
  
  // Try to split by phase names
  if (phases.length === 0) {
    const phaseSections = text.split(/Foundation Phase|Launch Phase|Scaling Phase|Optimisation Phase/i).filter(s => s.trim());
    if (phaseSections.length >= 3) {
      phases.push(
        { title: "First 30 days", content: phaseSections[0]?.trim() || "" },
        { title: "Next 30 days", content: phaseSections[1]?.trim() || "" },
        { title: "Final 30 days", content: phaseSections[2]?.trim() || "" }
      );
    }
  }
  
  // Fallback: split the text into three equal parts
  if (phases.length === 0) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const third = Math.ceil(sentences.length / 3);
    phases.push(
      { title: "First 30 days", content: sentences.slice(0, third).join('. ') + '.' },
      { title: "Next 30 days", content: sentences.slice(third, third * 2).join('. ') + '.' },
      { title: "Final 30 days", content: sentences.slice(third * 2).join('. ') + '.' }
    );
  }

  return (
    <div className="space-y-6">
      {phases.filter(p => p.content).map((phase, index) => (
        <div key={index}>
          <h6 className="font-bold text-slate-900 text-base flex items-center" style={{ marginTop: index > 0 ? "24px" : "0px", marginBottom: "8px" }}>
            <span className="text-blue-600 font-bold text-lg mr-3">•</span>
            <span>{phase.title}</span>
          </h6>
          <p className="text-slate-700" style={{ marginLeft: "20px", lineHeight: "1.6" }}>
            {phase.content}
          </p>
        </div>
      ))}
    </div>
  );
}

/* FIXED: Check if text contains embedded bullet points */
function containsEmbeddedBullets(text) {
  // Look for patterns like "• Item 1 content • Item 2 content"
  const bulletCount = (text.match(/•/g) || []).length;
  return bulletCount > 1 && !text.startsWith('•');
}

/* FIXED: Handler for embedded bullet point lists */
function EmbeddedBulletList({ text }) {
  // Split on bullet points and process each item
  const items = text.split('•').filter(item => item.trim()).map(item => item.trim());
  
  return (
    <ul className="space-y-2 list-none" style={{ marginLeft: "0px" }}>
      {items.map((item, index) => (
        <li
          key={index}
          className="flex items-start gap-3 text-slate-700 leading-relaxed"
          style={{
            marginTop: "0px",
            marginBottom: "8px",
            paddingTop: "0px",
            paddingBottom: "0px",
          }}
        >
          <span className="text-blue-600 font-bold text-lg flex-shrink-0 mt-0">•</span>
          <div className="flex-1">
            {/* Check if item has a heading pattern */}
            {item.includes(':') && item.split(':')[0].length < 40 ? (
              <>
                <span className="font-semibold text-slate-900">{item.split(':')[0]}:</span>
                <span className="ml-1">{item.split(':').slice(1).join(':')}</span>
              </>
            ) : (
              item
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ── Download Functions (NO EXTRA COST - CLIENT-SIDE) ─────── */
const downloadExcel = (data) => {
  try {
    const workbook = XLSX.utils.book_new();

    // Helper function to convert text sections to rows
    const textToRows = (text, sectionTitle) => {
      if (!text) return [];
      const rows = [[sectionTitle], [""]];
      const lines = text.split("\n").filter((line) => line.trim());
      lines.forEach((line) => {
        rows.push([line.trim()]);
      });
      rows.push([""]);
      return rows;
    };

    // Create comprehensive summary sheet with all sections
    const summaryData = [
      ["Marketing Strategy Report"],
      ["Generated:", new Date().toLocaleDateString()],
      ["Country:", data.meta?.country || ""],
      ["Sector:", data.meta?.sector || ""],
      ["Goal:", data.meta?.goal || ""],
      [""],
      ...textToRows(data.market_foundation, "Market Foundation"),
      ...textToRows(data.strategy_pillars, "Strategy Pillars"),
      ...textToRows(data.personas, "Target Personas"),
      ...textToRows(data.competitors_brief, "Competitor Analysis"),
      ...textToRows(
        data.differentiators || data.differentiation_moves,
        "Key Differentiators",
      ),
      ...textToRows(
        data.seven_ps || data.marketing_mix_7ps,
        "Marketing Mix (7 Ps)",
      ),
      ...textToRows(data.calendar_next_90_days, "90-Day Action Plan"),
      ...textToRows(data.kpis, "Measurement & Tracking"),
      ...textToRows(data.risks_and_safety_nets, "Risks & Safety Nets"),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Marketing Strategy");

    // Add budget sheet if available
    if (data.budget) {
      const budgetData = [
        ["Budget Allocation"],
        [""],
        ["Budget Band:", data.budget.band || ""],
        [""],
        ["Allocation Details:"],
        ...(data.budget.allocation
          ? data.budget.allocation
              .split("\n")
              .filter((line) => line.trim())
              .map((line) => [line.trim()])
          : []),
      ];
      const budgetSheet = XLSX.utils.aoa_to_sheet(budgetData);
      XLSX.utils.book_append_sheet(workbook, budgetSheet, "Budget");
    }

    // Add channel playbook sheet if available
    if (data.channel_playbook && Array.isArray(data.channel_playbook)) {
      const channelData = [
        ["Channel Playbook"],
        ["Channel", "Role", "Budget %", "Summary"],
      ];
      data.channel_playbook.forEach((channel) => {
        channelData.push([
          channel.channel || "",
          channel.role || "",
          channel.budget_percent ? `${channel.budget_percent}%` : "",
          channel.summary || "",
        ]);
      });
      const channelSheet = XLSX.utils.aoa_to_sheet(channelData);
      XLSX.utils.book_append_sheet(workbook, channelSheet, "Channels");
    }

    XLSX.writeFile(workbook, "marketing-strategy.xlsx");
  } catch (error) {
    console.error("Excel download failed:", error);
    alert("Excel download failed. Please try again.");
  }
};

const downloadWord = async (data) => {
  try {
    // Helper function to convert text sections to Word paragraphs
    const textToParagraphs = (text, sectionTitle) => {
      if (!text) return [];

      const paragraphs = [
        new Paragraph({
          children: [new TextRun({ text: sectionTitle, bold: true, size: 28 })],
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({ text: "" }),
      ];

      const lines = text.split("\n").filter((line) => line.trim());
      lines.forEach((line) => {
        const cleanLine = line.trim();

        // Check if it's a bullet point heading
        const isBulletHeading = /^•\s+/.test(cleanLine);

        if (isBulletHeading) {
          const headingText = cleanLine.replace(/^•\s+/, "");
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "• ",
                  bold: true,
                  size: 24,
                  color: "0066CC",
                }),
                new TextRun({ text: headingText, bold: true, size: 24 }),
              ],
            }),
          );
        } else if (cleanLine.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: cleanLine, size: 22 })],
            }),
          );
        }
      });

      paragraphs.push(new Paragraph({ text: "" }));
      return paragraphs;
    };

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Marketing Strategy Report",
                  bold: true,
                  size: 32,
                }),
              ],
              heading: HeadingLevel.TITLE,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated: ${new Date().toLocaleDateString()}`,
                  size: 20,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Country: ${data.meta?.country || ""}`,
                  size: 20,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Sector: ${data.meta?.sector || ""}`,
                  size: 20,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Goal: ${data.meta?.goal || ""}`,
                  size: 20,
                }),
              ],
            }),
            new Paragraph({ text: "" }),

            ...textToParagraphs(data.market_foundation, "Market Foundation"),
            ...textToParagraphs(data.strategy_pillars, "Strategy Pillars"),
            ...textToParagraphs(data.personas, "Target Personas"),
            ...textToParagraphs(data.competitors_brief, "Competitor Analysis"),
            ...textToParagraphs(
              data.differentiators || data.differentiation_moves,
              "Key Differentiators",
            ),
            ...textToParagraphs(
              data.seven_ps || data.marketing_mix_7ps,
              "Marketing Mix (7 Ps)",
            ),
            ...textToParagraphs(
              data.calendar_next_90_days,
              "90-Day Action Plan",
            ),
            ...textToParagraphs(data.kpis, "Measurement & Tracking"),
            ...textToParagraphs(
              data.risks_and_safety_nets,
              "Risks & Safety Nets",
            ),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    saveAs(blob, "marketing-strategy.docx");
  } catch (error) {
    console.error("Word download failed:", error);
    alert("Word download failed. Please try again.");
  }
};

/* small two-line stat box */
const InfoBox = ({ label, value }) => (
  <div className="bg-white rounded-lg border border-slate-200 p-3">
    <div className="text-xs uppercase font-semibold text-slate-500 mb-1">
      {label}
    </div>
    <div className="text-slate-800 font-medium">{value}</div>
  </div>
);

/* skeleton loader */
function SkeletonTimeline() {
  return (
    <div className="mt-12 w-full max-w-5xl mx-auto px-4">
      <div className="text-center mb-12">
        <div className="h-8 bg-gray-200 rounded-lg w-64 mx-auto mb-3 animate-pulse"></div>
        <div className="h-5 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
      </div>
      <div className="space-y-2">
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
            <div className="space-y-1">
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

/* ── streaming display component ──────────────────────────── */
function StreamingDisplay({ content }) {
  return (
    <div className="mt-12 w-full max-w-5xl mx-auto px-4">
      {/* header */}
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
          Your Marketing Strategy
        </h2>
        <p className="text-xl text-white max-w-3xl mx-auto leading-relaxed font-medium">
          <span className="inline-flex items-center">
            <div className="animate-pulse rounded-full h-2 w-2 bg-white/60 mr-2"></div>
            Streaming your strategy in real-time...
          </span>
        </p>
      </div>

      {/* streaming content display */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8">
          <div className="prose max-w-none">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 font-mono text-sm text-gray-800 whitespace-pre-wrap break-words">
              {content}
              <span className="animate-pulse">|</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-white/80 text-sm">
          Once complete, your strategy will be formatted and ready for download
        </p>
      </div>
    </div>
  );
}
