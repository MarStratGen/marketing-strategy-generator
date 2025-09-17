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
      {/* Simple header */}
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4">
          Your Marketing Strategy
        </h2>
        <p className="text-lg text-white/90 max-w-3xl mx-auto">
          A comprehensive marketing strategy organised into actionable sections for immediate implementation
        </p>
      </div>

      <ContentSections data={data} />

      {/* Simple actions section */}
      <div className="mt-16 bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Download Your Strategy
          </h3>
          <p className="text-gray-600">
            Export your marketing strategy in your preferred format
          </p>
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => downloadWord(data)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-medium transition-colors"
          >
            📄 Word Document
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded font-medium transition-colors"
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
      items: [
        { title: "Budget Framework", data: data.budget },
        { title: "90-Day Roadmap", data: data.calendar_next_90_days },
      ],
    },
    {
      id: "measurement",
      title: "Performance Tracking",
      description: "KPIs and success metrics for your strategy",
      items: [{ title: "Key Performance Indicators", data: data.kpis }],
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map((s, index) => (
        <ContentSection key={s.id} section={s} isFirst={index === 0} />
      ))}
    </div>
  );
}

/* ── Simple UI blocks ─────────────────────────────── */
function ContentSection({ section, isFirst }) {
  const [isOpen, setOpen] = useState(isFirst);

  const hasContent = section.items.some((i) => i.data);
  if (!hasContent) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
      <button
        onClick={() => setOpen(!isOpen)}
        className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {section.title}
            </h3>
            <p className="text-gray-600">
              {section.description}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isFirst && (
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                START HERE
              </span>
            )}
            <div className="p-1 rounded bg-gray-100">
              {isOpen ? (
                <ChevronDownIcon className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              )}
            </div>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-gray-200">
          <div className="p-6 space-y-6 bg-gray-50">
            {section.items
              .filter((i) => i.data)
              .map((item, idx) => (
                <ContentCard
                  key={idx}
                  title={item.title}
                  data={item.data}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContentCard({ title, data }) {
  return (
    <div className="border border-gray-200 bg-white rounded-lg p-6">
      <h4 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
        {title}
      </h4>
      <div className="text-gray-700">
        <OptimizedContent data={data} title={title} />
      </div>
    </div>
  );
}

/* Simple content renderer */
function OptimizedContent({ data, title }) {
  if (!data) return <p className="text-gray-500 italic">No data available</p>;

  // Special handling for budget
  if (typeof data === "object" && data.band && data.allocation) {
    const bandMap = {
      none: "No paid budget",
      low: "Low",
      medium: "Medium",
      high: "High",
    };

    return (
      <div className="space-y-4">
        <div className="bg-gray-100 rounded p-4 border border-gray-200">
          <h6 className="font-bold text-gray-900 mb-2">
            Budget Level
          </h6>
          <p className="text-gray-700">
            <span className="font-medium">{bandMap[data.band] || data.band}</span> - This indicates your overall budget tier for marketing activities.
          </p>
        </div>
        <div className="text-gray-700">
          <FormattedText text={String(data.allocation)} />
        </div>
      </div>
    );
  }

  if (Array.isArray(data)) {
    // Channel Playbook renderer
    if (
      data.length > 0 &&
      data[0] &&
      typeof data[0] === "object" &&
      data[0].channel &&
      data[0].intent &&
      data[0].role
    ) {
      return (
        <div className="space-y-6">
          {data.map((channel, i) => (
            <div key={i} className="bg-white rounded border border-gray-200 p-4">
              <h4 className="text-lg font-bold text-gray-900 mb-3">
                {channel.channel}
              </h4>

              {channel.summary && (
                <p className="text-gray-700 mb-3 bg-gray-50 p-3 rounded border">
                  {channel.summary}
                </p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                <div className="bg-gray-50 p-2 rounded border">
                  <p className="font-medium text-gray-600">Intent Level</p>
                  <p className="text-gray-800">{channel.intent}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded border">
                  <p className="font-medium text-gray-600">Role</p>
                  <p className="text-gray-800">{channel.role}</p>
                </div>
                {channel.success_metric && (
                  <div className="bg-gray-50 p-2 rounded border col-span-2 md:col-span-1">
                    <p className="font-medium text-gray-600">Success Metric</p>
                    <p className="text-gray-800">{channel.success_metric}</p>
                  </div>
                )}
                {channel.budget_percent !== undefined && (
                  <div className="bg-gray-50 p-2 rounded border">
                    <p className="font-medium text-gray-600">Budget Share</p>
                    <p className="text-gray-800 font-bold">{channel.budget_percent}%</p>
                  </div>
                )}
              </div>

              {channel.key_actions && channel.key_actions.length > 0 && (
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <h6 className="font-bold text-gray-900 mb-2">
                    Key Actions
                  </h6>
                  <ul className="text-gray-700 space-y-1">
                    {channel.key_actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{action}</span>
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

    // Simple array renderer 
    return (
      <ul className="space-y-2">
        {data.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            {typeof item === "object" ? (
              <OptimizedContent data={item} title={title} />
            ) : (
              <span>{String(item)}</span>
            )}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof data === "object") {
    // Simple object renderer
    const entries = Object.entries(data);
    return (
      <div className="space-y-4">
        {entries.map(([k, v], index) => (
          <div key={k}>
            <h5 className="font-bold text-gray-900 mb-2 border-b border-gray-200 pb-1">
              {friendlyLabel(k)}
            </h5>
            <div className="text-gray-700 pl-4">
              <OptimizedContent data={v} title={title} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="text-gray-700">
      <FormattedText text={String(data)} />
    </div>
  );
}

/* Simple text parser */
function parseTextToAst(text) {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split('\n').map(line => line.trimRight());
  const blocks = [];
  let currentBlock = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    // Detect bullet points
    const bulletMatch = line.match(/^(\s*)([•\-\*])\s+(.+)$/);
    if (bulletMatch) {
      const [, indent, bullet, content] = bulletMatch;
      const level = Math.floor(indent.length / 2);

      if (!currentBlock || currentBlock.type !== 'list') {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'list', items: [] };
      }
      currentBlock.items.push({ content: content.trim(), level });
      continue;
    }

    // Detect headings (short lines with capital letters)
    const nextLine = lines[i + 1];
    const isHeading = (
      trimmed.length < 80 &&
      trimmed.length > 3 &&
      /^[A-Z]/.test(trimmed) &&
      (!nextLine || !nextLine.trim() || i === lines.length - 1)
    );

    if (isHeading) {
      if (currentBlock) blocks.push(currentBlock);
      blocks.push({ type: 'heading', content: trimmed });
      currentBlock = null;
      continue;
    }

    // Regular text
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

/* Simple content renderer */
function ContentRenderer({ ast }) {
  return (
    <>
      {ast.map((block, index) => {
        switch (block.type) {
          case 'heading':
            return (
              <h4 key={index} className="text-lg font-bold text-gray-900 mt-4 mb-2">
                {block.content}
              </h4>
            );

          case 'list':
            return (
              <ul key={index} className="space-y-1 mb-4">
                {block.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2" style={{ marginLeft: `${item.level * 20}px` }}>
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{item.content}</span>
                  </li>
                ))}
              </ul>
            );

          case 'paragraph':
            return <p key={index} className="mb-3">{block.content}</p>;

          default:
            return null;
        }
      })}
    </>
  );
}

/* Simple text formatter */
function FormattedText({ text }) {
  if (!text || typeof text !== 'string') return null;

  const ast = parseTextToAst(text);
  return <ContentRenderer ast={ast} />;
}

/* Download Functions - keeping existing functionality */
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

/* Simple skeleton loader */
function SkeletonTimeline() {
  return (
    <div className="mt-12 w-full max-w-5xl mx-auto px-4">
      <div className="text-center mb-16">
        <div className="h-10 bg-gray-200 rounded w-80 mx-auto mb-4 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center gap-6 mb-4">
              <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-80 animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Simple streaming display */
function StreamingDisplay({ content }) {
  return (
    <div className="mt-12 w-full max-w-5xl mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4">
          Your Marketing Strategy
        </h2>
        <p className="text-lg text-white/90 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2">
            <div className="animate-pulse rounded-full h-2 w-2 bg-white/80"></div>
            Generating your comprehensive strategy...
          </span>
        </p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="p-8">
          <div className="bg-gray-50 rounded p-6 border border-gray-200 font-mono text-sm text-gray-800 whitespace-pre-wrap break-words">
            {content}
            <span className="animate-pulse text-blue-600 font-bold">|</span>
          </div>
        </div>
      </div>
    </div>
  );
}