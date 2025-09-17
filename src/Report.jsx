import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

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
        <OptimizedContent data={data} title={title} />
      </div>
    </div>
  );
}

/* SUPER SIMPLE content renderer (NO CONFUSION) */
function OptimizedContent({ data, title }) {
  if (!data) return <p className="text-slate-500 italic">No data available</p>;
  
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
          <FormattedText text={String(data.allocation)} sectionType={sectionType} />
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
                <OptimizedContent data={item} title={title} />
              ) : (
                <FormattedText text={String(item)} sectionType={sectionType} />
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

/* UNIFIED CONTENT RENDERER - Renders AST with consistent formatting */
function ContentRenderer({ ast }) {
  return (
    <div className="space-y-4">
      {ast.map((block, index) => {
        switch (block.type) {
          case 'heading':
            return (
              <h6 
                key={index} 
                className="font-bold text-slate-900 text-base flex items-center" 
                style={{ marginTop: index > 0 ? "24px" : "0px", marginBottom: "8px" }}
              >
                <span className="text-blue-600 font-bold text-lg mr-3">•</span>
                <span>{block.content}</span>
              </h6>
            );
            
          case 'unordered_list':
            return (
              <ul key={index} className="space-y-2 list-none">
                {block.items.map((item, i) => (
                  <li 
                    key={i} 
                    className="flex items-start gap-3 text-slate-700 leading-relaxed"
                    style={{ marginLeft: `${item.level * 20}px` }}
                  >
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{item.content}</span>
                  </li>
                ))}
              </ul>
            );
            
          case 'ordered_list':
            return (
              <ol key={index} className="space-y-2 list-none">
                {block.items.map((item, i) => (
                  <li 
                    key={i} 
                    className="flex items-start gap-3 text-slate-700 leading-relaxed"
                    style={{ marginLeft: `${item.level * 20}px` }}
                  >
                    <span className="text-blue-600 font-bold">{item.marker}.</span>
                    <span>{item.content}</span>
                  </li>
                ))}
              </ol>
            );
            
          case 'definition':
            return (
              <div key={index} className="mb-4">
                <h6 className="font-bold text-slate-900 text-base flex items-center mb-2">
                  <span className="text-blue-600 font-bold text-lg mr-3">•</span>
                  <span>{block.label}</span>
                </h6>
                <p className="text-slate-700 ml-6" style={{ lineHeight: "1.6" }}>
                  {block.content}
                </p>
              </div>
            );
            
          case 'paragraph':
            // Handle embedded bullets within paragraphs
            if (block.content.includes('•') && (block.content.match(/•/g) || []).length > 1) {
              const items = block.content.split('•').filter(item => item.trim()).map(item => item.trim());
              return (
                <ul key={index} className="space-y-2 list-none">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 leading-relaxed">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            
            return (
              <p key={index} className="text-slate-700" style={{ lineHeight: "1.6", marginBottom: "12px" }}>
                {block.content}
              </p>
            );
            
          default:
            return null;
        }
      })}
    </div>
  );
}

/* SECTION REGISTRY - Maps content types to specialized renderers */
const SECTION_RENDERERS = {
  'Personas': 'personas',
  'Target Personas': 'personas', 
  'Strategy Pillars': 'strategy_pillars',
  'Differentiation Moves': 'differentiation',
  'Key Differentiators': 'differentiation',
  'Marketing Mix (7 Ps)': 'marketing_mix',
  'Next 90 Days Action Plan': 'action_plan',
  '90-Day Action Plan': 'action_plan',
  'Channel Playbook': 'channels',
  'Budget Allocation': 'budget',
  'Key Performance Indicators': 'kpis',
  'Risks and Safety Nets': 'risks',
  'Risks & Safety Nets': 'risks'
};

/* SPECIALIZED SECTION RENDERERS */
function renderPersonas(ast) {
  // Group consecutive heading+paragraph pairs
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
    <div className="space-y-6">
      {personas.map((persona, index) => (
        <div key={index}>
          <h6 className="font-bold text-slate-900 text-base flex items-center" 
              style={{ marginTop: index > 0 ? "24px" : "0px", marginBottom: "8px" }}>
            <span className="text-blue-600 font-bold text-lg mr-3">•</span>
            <span>{persona.title}</span>
          </h6>
          <div style={{ marginLeft: "20px" }}>
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
  
  // Work directly on AST to preserve structure
  let currentSection = null;
  let currentBlocks = [];
  
  for (const block of ast) {
    // Check if this block is a heading that matches one of the 7 Ps
    const isP = block.type === 'heading' && sevenPs.some(p => 
      block.content.toLowerCase().includes(p.toLowerCase())
    );
    
    // Check if this is a definition block that matches a P (e.g., "Product: ...")
    const isPDefinition = block.type === 'definition' && sevenPs.some(p => 
      block.label.toLowerCase().includes(p.toLowerCase())
    );
    
    if (isP || isPDefinition) {
      // Save previous section if exists
      if (currentSection && currentBlocks.length > 0) {
        sections.push({ title: currentSection, content: currentBlocks });
      }
      
      // Start new section
      if (isP) {
        currentSection = sevenPs.find(p => block.content.toLowerCase().includes(p.toLowerCase()));
        currentBlocks = [];
      } else if (isPDefinition) {
        currentSection = sevenPs.find(p => block.label.toLowerCase().includes(p.toLowerCase()));
        // Include the definition content as first block
        currentBlocks = [{ type: 'paragraph', content: block.content }];
      }
    } else if (currentSection) {
      // Add block to current section
      currentBlocks.push(block);
    }
  }
  
  // Save final section
  if (currentSection && currentBlocks.length > 0) {
    sections.push({ title: currentSection, content: currentBlocks });
  }
  
  // If no 7 Ps structure detected, use fallback
  if (sections.length === 0) {
    return <ContentRenderer ast={ast} />;
  }
  
  return (
    <div className="space-y-6">
      {sections.map((section, index) => (
        <div key={index}>
          <h6 className="font-bold text-slate-900 text-base flex items-center" 
              style={{ marginTop: index > 0 ? "24px" : "0px", marginBottom: "8px" }}>
            <span className="text-blue-600 font-bold text-lg mr-3">•</span>
            <span>{section.title}</span>
          </h6>
          <div style={{ marginLeft: "20px" }}>
            <ContentRenderer ast={section.content} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* MAIN TEXT FORMATTER - Uses section registry and AST rendering */
function FormattedText({ text, sectionType }) {
  if (!text || typeof text !== 'string') return null;
  
  const ast = parseTextToAst(text);
  
  // Use specialized renderer if available
  switch (sectionType) {
    case 'personas':
      return renderPersonas(ast);
    case 'marketing_mix':
      return renderMarketingMix(ast);
    default:
      return <ContentRenderer ast={ast} />;
  }
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
