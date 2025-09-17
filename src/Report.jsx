
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
    <div className="mt-12 w-full max-w-6xl mx-auto px-4">
      {/* Enhanced header */}
      <div className="text-center mb-20">
        <h2 className="text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
          Your Marketing Strategy
        </h2>
        <p className="text-xl text-white/90 max-w-4xl mx-auto leading-relaxed font-medium">
          A comprehensive marketing strategy organised into actionable sections for immediate implementation
        </p>
      </div>

      <ContentSections data={data} />

      {/* Enhanced actions section */}
      <div className="mt-20 bg-gradient-to-br from-slate-50 via-white to-blue-50 border-2 border-slate-200 rounded-3xl p-10 shadow-lg">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
            Download Your Strategy
          </h3>
          <p className="text-slate-600 text-base leading-relaxed">
            Export your marketing strategy in your preferred format for easy sharing and implementation
          </p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => downloadWord(data)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            📄 Word Document
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            🖨️ Print Report
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
      description: "Understanding your market landscape and opportunities",
      icon: "🎯",
      color: "blue",
      priority: "high",
      items: [
        { title: "Market Foundation", data: data.market_foundation },
        {
          title: "Differentiation Strategy",
          data: data.differentiators || data.differentiation_moves,
        },
        { title: "Risk Management", data: data.risks_and_safety_nets },
      ],
    },
    {
      id: "strategy",
      title: "Strategic Framework", 
      description: "Core strategy pillars and competitive positioning",
      icon: "⚡",
      color: "purple",
      priority: "high",
      items: [
        { title: "Strategy Pillars", data: data.strategy_pillars },
        { title: "Competitor Intelligence", data: data.competitors_brief },
        {
          title: "Marketing Mix (7 Ps)",
          data: data.seven_ps || data.marketing_mix_7ps,
        },
        { title: "Channel Strategy", data: data.channel_playbook },
        { title: "Customer Personas", data: data.personas },
      ],
    },
    {
      id: "execution",
      title: "Implementation Plan",
      description: "Budget allocation and actionable timeline",
      icon: "🚀",
      color: "emerald",
      priority: "high",
      items: [
        { title: "Budget Framework", data: data.budget },
        { title: "90-Day Roadmap", data: data.calendar_next_90_days },
      ],
    },
    {
      id: "measurement",
      title: "Performance Tracking",
      description: "KPIs and success metrics for your strategy",
      icon: "📊",
      color: "indigo",
      priority: "medium",
      items: [{ title: "Key Performance Indicators", data: data.kpis }],
    },
  ];

  return (
    <div className="space-y-6">
      {sections.map((s, index) => (
        <ContentSection key={s.id} section={s} isFirst={index === 0} />
      ))}
    </div>
  );
}

/* ── Enhanced UI blocks ─────────────────────────────── */
function ContentSection({ section, isFirst }) {
  const [isOpen, setOpen] = useState(isFirst);
  const colors = {
    blue: {
      gradient: "from-blue-500 via-blue-600 to-blue-700",
      bg: "bg-gradient-to-br from-blue-50 to-blue-100/70",
      border: "border-blue-200",
      text: "text-blue-800",
      accent: "bg-blue-100 text-blue-800",
    },
    purple: {
      gradient: "from-purple-500 via-purple-600 to-purple-700",
      bg: "bg-gradient-to-br from-purple-50 to-purple-100/70",
      border: "border-purple-200",
      text: "text-purple-800",
      accent: "bg-purple-100 text-purple-800",
    },
    emerald: {
      gradient: "from-emerald-500 via-emerald-600 to-emerald-700",
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/70",
      border: "border-emerald-200",
      text: "text-emerald-800",
      accent: "bg-emerald-100 text-emerald-800",
    },
    indigo: {
      gradient: "from-indigo-500 via-indigo-600 to-indigo-700",
      bg: "bg-gradient-to-br from-indigo-50 to-indigo-100/70",
      border: "border-indigo-200",
      text: "text-indigo-800",
      accent: "bg-indigo-100 text-indigo-800",
    },
  };

  const hasContent = section.items.some((i) => i.data);
  if (!hasContent) return null;

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/60 shadow-xl overflow-hidden mb-8 hover:shadow-2xl transition-all duration-300">
      <button
        onClick={() => setOpen(!isOpen)}
        className="w-full p-10 text-left hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100/50 transition-all duration-300"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div
              className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${colors[section.color].gradient} flex items-center justify-center text-white text-3xl shadow-lg`}
            >
              {section.icon}
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight leading-tight">
                {section.title}
              </h3>
              <p className="text-lg text-slate-700 font-medium leading-relaxed max-w-2xl">
                {section.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isFirst && (
              <span className={`px-4 py-2 ${colors[section.color].accent} text-sm font-bold rounded-full shadow-sm`}>
                START HERE
              </span>
            )}
            <div className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors duration-200">
              {isOpen ? (
                <ChevronDownIcon className="w-7 h-7 text-slate-600" />
              ) : (
                <ChevronRightIcon className="w-7 h-7 text-slate-600" />
              )}
            </div>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="border-t-2 border-slate-100">
          <div className={`p-10 space-y-6 ${colors[section.color].bg}`}>
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
    blue: "border-blue-200/80 bg-gradient-to-br from-white via-blue-50/30 to-blue-100/40 shadow-lg",
    purple: "border-purple-200/80 bg-gradient-to-br from-white via-purple-50/30 to-purple-100/40 shadow-lg",
    emerald: "border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/30 to-emerald-100/40 shadow-lg",
    indigo: "border-indigo-200/80 bg-gradient-to-br from-white via-indigo-50/30 to-indigo-100/40 shadow-lg",
  };

  return (
    <div className={`border-2 ${colours[color]} rounded-2xl p-8 hover:shadow-xl transition-all duration-300`}>
      <h4 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight leading-tight border-b border-slate-200/50 pb-3">
        {title}
      </h4>
      <div className="prose prose-slate prose-lg max-w-none text-slate-700 leading-relaxed">
        <OptimizedContent data={data} title={title} />
      </div>
    </div>
  );
}

/* Enhanced content renderer */
function OptimizedContent({ data, title }) {
  if (!data) return <p className="text-slate-500 italic text-lg">No data available</p>;
  
  // Determine section type from title using registry
  const sectionType = SECTION_RENDERERS[title] || 'default';

  // Special handling for budget band capitalization and context
  if (typeof data === "object" && data.band && data.allocation) {
    const bandMap = {
      none: "No paid budget",
      low: "Low",
      medium: "Medium",
      high: "High",
    };

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
          <h6 className="font-bold text-slate-900 text-lg mb-2 flex items-center gap-2">
            💰 Budget Level
          </h6>
          <p className="text-slate-700 text-base leading-relaxed">
            <span className="font-semibold">{bandMap[data.band] || data.band}</span> - This indicates your overall budget tier for marketing activities, allowing the strategy to scale with your investment level.
          </p>
        </div>
        <div className="text-slate-700 leading-relaxed">
          <FormattedText text={String(data.allocation)} sectionType={sectionType} />
        </div>
      </div>
    );
  }

  if (Array.isArray(data)) {
    // Enhanced Channel Playbook renderer
    if (
      data.length > 0 &&
      data[0] &&
      typeof data[0] === "object" &&
      data[0].channel &&
      data[0].intent &&
      data[0].role
    ) {
      return (
        <div className="space-y-8">
          {data.map((channel, i) => (
            <div key={i} className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl p-6 border-2 border-slate-200/50 hover:border-slate-300/60 transition-all duration-300 shadow-sm hover:shadow-md">
              <h4 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></span>
                {channel.channel}
              </h4>

              {channel.summary && (
                <div className="mb-4">
                  <p className="text-slate-700 leading-relaxed text-base bg-slate-50/50 p-4 rounded-xl border border-slate-200/50">
                    {channel.summary}
                  </p>
                </div>
              )}

              {channel.why_it_works && (
                <div className="mb-4">
                  <p className="text-slate-700 leading-relaxed text-base italic bg-blue-50/30 p-4 rounded-xl border border-blue-200/30">
                    💡 <strong>Why it works:</strong> {channel.why_it_works}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/60 p-3 rounded-lg border border-slate-200/50">
                  <p className="text-xs uppercase font-semibold text-slate-500 mb-1">Intent Level</p>
                  <p className="text-slate-800 font-medium">{channel.intent}</p>
                </div>
                <div className="bg-white/60 p-3 rounded-lg border border-slate-200/50">
                  <p className="text-xs uppercase font-semibold text-slate-500 mb-1">Funnel Role</p>
                  <p className="text-slate-800 font-medium text-sm">{channel.role}</p>
                </div>
                {channel.success_metric && (
                  <div className="bg-white/60 p-3 rounded-lg border border-slate-200/50 col-span-2 md:col-span-1">
                    <p className="text-xs uppercase font-semibold text-slate-500 mb-1">Success Metric</p>
                    <p className="text-slate-800 font-medium text-sm">{channel.success_metric}</p>
                  </div>
                )}
                {channel.budget_percent !== undefined && (
                  <div className="bg-white/60 p-3 rounded-lg border border-slate-200/50">
                    <p className="text-xs uppercase font-semibold text-slate-500 mb-1">Budget Share</p>
                    <p className="text-slate-800 font-bold text-lg">{channel.budget_percent}%</p>
                  </div>
                )}
              </div>

              {channel.key_actions && channel.key_actions.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-50/50 to-green-50/30 p-5 rounded-xl border border-emerald-200/40">
                  <h6 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
                    🎯 Key Actions
                  </h6>
                  <ul className="text-slate-700 text-base space-y-3">
                    {channel.key_actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="flex items-start gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></span>
                        <span className="leading-relaxed">{action}</span>
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

    // Enhanced array renderer 
    return (
      <ul className="space-y-3">
        {data.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
            {typeof item === "object" ? (
              <OptimizedContent data={item} title={title} />
            ) : (
              <div className="flex-1">
                <FormattedText text={String(item)} sectionType={sectionType} />
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof data === "object") {
    // Enhanced channel object renderer
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
        <div className="bg-gradient-to-br from-white to-slate-50/50 rounded-2xl p-6 border-2 border-slate-200/50">
          {channelName && (
            <h6 className="font-bold text-slate-900 text-xl mb-4 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></span>
              {channelName}
            </h6>
          )}

          {data.summary && (
            <div className="mb-4">
              <p className="text-slate-700 leading-relaxed text-base bg-slate-50/50 p-4 rounded-xl border border-slate-200/50">
                {data.summary}
              </p>
            </div>
          )}

          {data.why_it_works && (
            <div className="mb-4">
              <p className="text-slate-700 leading-relaxed text-base italic bg-blue-50/30 p-4 rounded-xl border border-blue-200/30">
                💡 <strong>Why it works:</strong> {data.why_it_works}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/60 p-3 rounded-lg border border-slate-200/50">
              <p className="text-xs uppercase font-semibold text-slate-500 mb-1">Intent Level</p>
              <p className="text-slate-800 font-medium">{intent}</p>
            </div>
            <div className="bg-white/60 p-3 rounded-lg border border-slate-200/50">
              <p className="text-xs uppercase font-semibold text-slate-500 mb-1">Funnel Role</p>
              <p className="text-slate-800 font-medium text-sm">{role}</p>
            </div>
            {data.success_metric && (
              <div className="bg-white/60 p-3 rounded-lg border border-slate-200/50 col-span-2">
                <p className="text-xs uppercase font-semibold text-slate-500 mb-1">Success Metric</p>
                <p className="text-slate-800 font-medium text-sm">{data.success_metric}</p>
              </div>
            )}
            {data.budget_percent !== undefined && (
              <div className="bg-white/60 p-3 rounded-lg border border-slate-200/50">
                <p className="text-xs uppercase font-semibold text-slate-500 mb-1">Budget Share</p>
                <p className="text-slate-800 font-bold text-lg">{data.budget_percent}%</p>
              </div>
            )}
          </div>

          {data.key_actions && data.key_actions.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-50/50 to-green-50/30 p-5 rounded-xl border border-emerald-200/40">
              <h6 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
                🎯 Key Actions
              </h6>
              <ul className="text-slate-700 text-base space-y-3">
                {data.key_actions.map((action, actionIndex) => (
                  <li key={actionIndex} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></span>
                    <span className="leading-relaxed">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    // Enhanced object renderer
    const entries = Object.entries(data);
    return (
      <div className="space-y-8">
        {entries.map(([k, v], index) => (
          <div key={k}>
            <h5 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2 pb-2 border-b border-slate-200/50">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              {friendlyLabel(k)}
            </h5>
            <div className="text-slate-700 pl-4 border-l-2 border-slate-200/50">
              <OptimizedContent data={v} title={title} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="text-slate-700 leading-relaxed">
      <FormattedText text={String(data)} sectionType={sectionType} />
    </div>
  );
}

/* ROBUST TEXT PARSER - Creates structured AST from marketing content */
function parseTextToAst(text) {
  if (!text || typeof text !== 'string') return [];
  
  const lines = text.split('\n').map(line => line.trimRight());
  const blocks = [];
  let currentBlock = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines (used as separators)
    if (!trimmed) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }
    
    // Detect unordered list items (•, -, *)
    const unorderedMatch = line.match(/^(\s*)([•\-\*])\s+(.+)$/);
    if (unorderedMatch) {
      const [, indent, bullet, content] = unorderedMatch;
      const level = Math.floor(indent.length / 2);
      
      if (!currentBlock || currentBlock.type !== 'unordered_list') {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'unordered_list', items: [] };
      }
      currentBlock.items.push({ content: content.trim(), level });
      continue;
    }
    
    // Detect ordered list items (1., 1), a., etc.)
    const orderedMatch = line.match(/^(\s*)(\d+|[a-zA-Z]+)[.)]\s+(.+)$/);
    if (orderedMatch) {
      const [, indent, marker, content] = orderedMatch;
      const level = Math.floor(indent.length / 2);
      
      if (!currentBlock || currentBlock.type !== 'ordered_list') {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'ordered_list', items: [] };
      }
      currentBlock.items.push({ content: content.trim(), level, marker });
      continue;
    }
    
    // Detect definition items (Label: content)
    const definitionMatch = line.match(/^(\s*)([^:]{2,40}):\s+(.+)$/);
    if (definitionMatch && line.length < 120) {
      const [, indent, label, content] = definitionMatch;
      
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { 
        type: 'definition', 
        label: label.trim(), 
        content: content.trim() 
      };
      blocks.push(currentBlock);
      currentBlock = null;
      continue;
    }
    
    // Check if it's a heading (short line, starts with capital, followed by blank line or end)
    const nextLine = lines[i + 1];
    const isHeading = (
      trimmed.length < 80 &&
      trimmed.length > 3 &&
      /^[A-Z]/.test(trimmed) &&
      !trimmed.includes('.') &&
      (!nextLine || !nextLine.trim() || i === lines.length - 1)
    );
    
    if (isHeading) {
      if (currentBlock) blocks.push(currentBlock);
      blocks.push({ type: 'heading', content: trimmed });
      currentBlock = null;
      continue;
    }
    
    // Regular paragraph content
    if (!currentBlock || currentBlock.type !== 'paragraph') {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'paragraph', content: trimmed };
    } else {
      currentBlock.content += ' ' + trimmed;
    }
  }
  
  if (currentBlock) blocks.push(currentBlock);
  return blocks;
}

/* Enhanced content renderer */
function ContentRenderer({ ast }) {
  return (
    <>
      {ast.map((block, index) => {
        switch (block.type) {
          case 'heading':
            return (
              <h4 key={index} className="text-xl font-bold text-slate-900 mb-4 mt-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {block.content}
              </h4>
            );
            
          case 'unordered_list':
            // Build nested list structure based on item.level
            const buildNestedUL = (items) => {
              const result = [];
              let currentLevel = 0;
              let stack = [result];
              
              for (const item of items) {
                const level = item.level || 0;
                
                while (level > currentLevel) {
                  const newUL = [];
                  const lastItem = stack[stack.length - 1][stack[stack.length - 1].length - 1];
                  if (!lastItem) {
                    stack[stack.length - 1].push({ content: '', children: newUL });
                  } else {
                    lastItem.children = newUL;
                  }
                  stack.push(newUL);
                  currentLevel++;
                }
                
                while (level < currentLevel) {
                  stack.pop();
                  currentLevel--;
                }
                
                stack[stack.length - 1].push({ content: item.content, children: null });
              }
              
              return result;
            };
            
            const renderNestedUL = (items) => (
              <ul className="space-y-2 ml-4">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                    <div className="flex-1">
                      {item.content}
                      {item.children && renderNestedUL(item.children)}
                    </div>
                  </li>
                ))}
              </ul>
            );
            
            return <div key={index}>{renderNestedUL(buildNestedUL(block.items))}</div>;
            
          case 'ordered_list':
            // Similar nested structure for ordered lists
            const buildNestedOL = (items) => {
              const result = [];
              let currentLevel = 0;
              let stack = [result];
              
              for (const item of items) {
                const level = item.level || 0;
                
                while (level > currentLevel) {
                  const newOL = [];
                  const lastItem = stack[stack.length - 1][stack[stack.length - 1].length - 1];
                  if (!lastItem) {
                    stack[stack.length - 1].push({ content: '', children: newOL });
                  } else {
                    lastItem.children = newOL;
                  }
                  stack.push(newOL);
                  currentLevel++;
                }
                
                while (level < currentLevel) {
                  stack.pop();
                  currentLevel--;
                }
                
                stack[stack.length - 1].push({ content: item.content, children: null });
              }
              
              return result;
            };
            
            const renderNestedOL = (items) => (
              <ol className="space-y-2 ml-4 list-decimal">
                {items.map((item, i) => (
                  <li key={i} className="leading-relaxed">
                    {item.content}
                    {item.children && renderNestedOL(item.children)}
                  </li>
                ))}
              </ol>
            );
            
            return <div key={index}>{renderNestedOL(buildNestedOL(block.items))}</div>;
            
          case 'definition':
            return (
              <dl key={index} className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/50 mb-4">
                <dt className="font-bold text-slate-900 text-base mb-2">{block.label}</dt>
                <dd className="text-slate-700 leading-relaxed pl-4 border-l-2 border-slate-300/50">{block.content}</dd>
              </dl>
            );
            
          case 'paragraph':
            // Handle embedded bullets within paragraphs
            if (block.content.includes('•') && (block.content.match(/•/g) || []).length > 1) {
              const items = block.content.split('•').filter(item => item.trim()).map(item => item.trim());
              return (
                <ul key={index} className="space-y-2 ml-4 mb-4">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            
            return <p key={index} className="leading-relaxed mb-4 text-base">{block.content}</p>;
            
          default:
            return null;
        }
      })}
    </>
  );
}

/* SECTION REGISTRY - Maps content types to specialized renderers */
const SECTION_RENDERERS = {
  'Customer Personas': 'personas',
  'Target Personas': 'personas', 
  'Strategy Pillars': 'strategy_pillars',
  'Differentiation Strategy': 'differentiation',
  'Key Differentiators': 'differentiation',
  'Marketing Mix (7 Ps)': 'marketing_mix',
  '90-Day Roadmap': 'action_plan',
  '90-Day Action Plan': 'action_plan',
  'Channel Strategy': 'channels',
  'Budget Framework': 'budget',
  'Key Performance Indicators': 'kpis',
  'Risk Management': 'risks',
  'Risks & Safety Nets': 'risks'
};

/* Enhanced specialized renderers */
function renderPersonas(ast) {
  const personas = [];
  let current = null;
  
  for (const block of ast) {
    if (block.type === 'heading') {
      if (current) personas.push(current);
      current = { title: block.content, content: [] };
    } else if (current) {
      current.content.push(block);
    }
  }
  if (current) personas.push(current);
  
  return (
    <div className="space-y-8">
      {personas.map((persona, index) => (
        <div key={index} className="bg-gradient-to-br from-blue-50/30 to-indigo-50/20 p-6 rounded-2xl border-2 border-blue-200/40">
          <h4 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            {persona.title}
          </h4>
          <div className="pl-4 border-l-2 border-blue-300/30">
            <ContentRenderer ast={persona.content} />
          </div>
        </div>
      ))}
    </div>
  );
}

function renderMarketingMix(ast) {
  const sevenPs = ['Product', 'Price', 'Place', 'Promotion', 'People', 'Process', 'Physical Evidence'];
  const sections = [];
  
  let currentSection = null;
  let currentBlocks = [];
  
  for (const block of ast) {
    const isP = block.type === 'heading' && sevenPs.some(p => 
      block.content.toLowerCase().includes(p.toLowerCase())
    );
    
    const isPDefinition = block.type === 'definition' && sevenPs.some(p => 
      block.label.toLowerCase().includes(p.toLowerCase())
    );
    
    if (isP || isPDefinition) {
      if (currentSection && currentBlocks.length > 0) {
        sections.push({ title: currentSection, content: currentBlocks });
      }
      
      if (isP) {
        currentSection = sevenPs.find(p => block.content.toLowerCase().includes(p.toLowerCase()));
        currentBlocks = [];
      } else if (isPDefinition) {
        currentSection = sevenPs.find(p => block.label.toLowerCase().includes(p.toLowerCase()));
        currentBlocks = [{ type: 'paragraph', content: block.content }];
      }
    } else if (currentSection) {
      currentBlocks.push(block);
    }
  }
  
  if (currentSection && currentBlocks.length > 0) {
    sections.push({ title: currentSection, content: currentBlocks });
  }
  
  if (sections.length === 0) {
    return <ContentRenderer ast={ast} />;
  }
  
  return (
    <div className="grid gap-6">
      {sections.map((section, index) => (
        <div key={index} className="bg-gradient-to-br from-purple-50/30 to-pink-50/20 p-6 rounded-2xl border-2 border-purple-200/40">
          <h4 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            {section.title}
          </h4>
          <div className="pl-4 border-l-2 border-purple-300/30">
            <ContentRenderer ast={section.content} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* Enhanced text formatter */
function FormattedText({ text, sectionType }) {
  if (!text || typeof text !== 'string') return null;
  
  const ast = parseTextToAst(text);
  
  switch (sectionType) {
    case 'personas':
      return renderPersonas(ast);
    case 'marketing_mix':
      return renderMarketingMix(ast);
    default:
      return <ContentRenderer ast={ast} />;
  }
}

/* Download Functions (unchanged but with enhanced styling mentions) */
const downloadExcel = (data) => {
  try {
    const workbook = XLSX.utils.book_new();

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

    const summaryData = [
      ["Marketing Strategy Report"],
      ["Generated:", new Date().toLocaleDateString()],
      ["Country:", data.meta?.country || ""],
      ["Sector:", data.meta?.sector || ""],
      ["Goal:", data.meta?.goal || ""],
      [""],
      ...textToRows(data.market_foundation, "Market Foundation"),
      ...textToRows(data.strategy_pillars, "Strategy Pillars"),
      ...textToRows(data.personas, "Customer Personas"),
      ...textToRows(data.competitors_brief, "Competitor Intelligence"),
      ...textToRows(
        data.differentiators || data.differentiation_moves,
        "Differentiation Strategy",
      ),
      ...textToRows(
        data.seven_ps || data.marketing_mix_7ps,
        "Marketing Mix (7 Ps)",
      ),
      ...textToRows(data.calendar_next_90_days, "90-Day Roadmap"),
      ...textToRows(data.kpis, "Performance Tracking"),
      ...textToRows(data.risks_and_safety_nets, "Risk Management"),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Marketing Strategy");

    if (data.budget) {
      const budgetData = [
        ["Budget Framework"],
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

    if (data.channel_playbook && Array.isArray(data.channel_playbook)) {
      const channelData = [
        ["Channel Strategy"],
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
            ...textToParagraphs(data.personas, "Customer Personas"),
            ...textToParagraphs(data.competitors_brief, "Competitor Intelligence"),
            ...textToParagraphs(
              data.differentiators || data.differentiation_moves,
              "Differentiation Strategy",
            ),
            ...textToParagraphs(
              data.seven_ps || data.marketing_mix_7ps,
              "Marketing Mix (7 Ps)",
            ),
            ...textToParagraphs(
              data.calendar_next_90_days,
              "90-Day Roadmap",
            ),
            ...textToParagraphs(data.kpis, "Performance Tracking"),
            ...textToParagraphs(
              data.risks_and_safety_nets,
              "Risk Management",
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

const InfoBox = ({ label, value }) => (
  <div className="bg-white rounded-xl border-2 border-slate-200 p-4 shadow-sm">
    <div className="text-xs uppercase font-bold text-slate-500 mb-2 tracking-wide">
      {label}
    </div>
    <div className="text-slate-900 font-semibold text-base">{value}</div>
  </div>
);

/* Enhanced skeleton loader */
function SkeletonTimeline() {
  return (
    <div className="mt-12 w-full max-w-6xl mx-auto px-4">
      <div className="text-center mb-20">
        <div className="h-12 bg-gray-200 rounded-2xl w-80 mx-auto mb-6 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded-xl w-96 mx-auto animate-pulse"></div>
      </div>
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-3xl border-2 border-gray-200 p-10 shadow-xl"
          >
            <div className="flex items-center gap-8 mb-6">
              <div className="w-20 h-20 bg-gray-200 rounded-3xl animate-pulse"></div>
              <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded-xl w-64 mb-3 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded-lg w-80 animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded-lg w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-lg w-5/6 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded-lg w-4/5 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Enhanced streaming display */
function StreamingDisplay({ content }) {
  return (
    <div className="mt-12 w-full max-w-6xl mx-auto px-4">
      <div className="text-center mb-20">
        <h2 className="text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
          Your Marketing Strategy
        </h2>
        <p className="text-xl text-white/90 max-w-4xl mx-auto leading-relaxed font-medium">
          <span className="inline-flex items-center gap-3">
            <div className="animate-pulse rounded-full h-3 w-3 bg-white/80"></div>
            Generating your comprehensive strategy in real-time...
          </span>
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
        <div className="p-10">
          <div className="prose max-w-none">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 border-2 border-slate-200 font-mono text-base text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
              {content}
              <span className="animate-pulse text-blue-600 font-bold">|</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-white/80 text-base leading-relaxed">
          Once complete, your strategy will be beautifully formatted and ready for download
        </p>
      </div>
    </div>
  );
}
