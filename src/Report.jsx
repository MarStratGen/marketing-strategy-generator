// Bulletproof Text Block Renderer - Displays ALL content reliably
function SimpleTextBlock({ content }) {
  // Handle completely empty content
  if (!content) {
    return <div className="text-gray-500 italic">No content available</div>;
  }

  // Handle non-string content - display as readable JSON
  if (typeof content !== 'string') {
    return (
      <div className="bg-gray-50 p-4 rounded border">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>
    );
  }

  // Clean up the content string
  const cleanContent = content.trim();
  if (!cleanContent) {
    return <div className="text-gray-500 italic">No content available</div>;
  }

  // Split content into paragraphs and bullet blocks
  const sections = cleanContent.split(/\n\s*\n+/);
  
  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        const trimmedSection = section.trim();
        if (!trimmedSection) return null;
        
        const lines = trimmedSection.split('\n').map(line => line.trim()).filter(Boolean);
        
        // Check if this section is all bullets
        const isBulletSection = lines.length > 0 && lines.every(line => 
          line.match(/^(?:•|\-|\*|[\d]+\.)\s+/)
        );
        
        if (isBulletSection) {
          // Render as bullet list
          return (
            <ul key={index} className="list-disc list-inside space-y-1 text-gray-700">
              {lines.map((line, lineIndex) => {
                const bulletText = line.replace(/^(?:•|\-|\*|[\d]+\.)\s+/, '');
                return (
                  <li key={lineIndex} className="leading-relaxed ml-4">
                    {bulletText}
                  </li>
                );
              })}
            </ul>
          );
        } else {
          // Render as paragraph(s)
          return lines.map((line, lineIndex) => (
            <p key={`${index}-${lineIndex}`} className="text-gray-700 leading-relaxed mb-2">
              {line}
            </p>
          ));
        }
      })}
    </div>
  );
}

export default function Report({ plan, loading }) {
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-lg animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  if (plan.error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-2">Error</h3>
          <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(plan, null, 2)}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Your Marketing Strategy</h1>
        <p className="text-white/80 text-lg">Comprehensive plan tailored for your business</p>
      </header>

      {/* Main Report Document */}
      <div className="bg-white rounded-2xl shadow-xl p-12 space-y-8">
        
        {/* Market Foundation */}
        {plan.market_foundation && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Market Foundation
            </h2>
            <SimpleTextBlock content={plan.market_foundation} />
          </section>
        )}

        {/* Customer Personas */}
        {plan.personas && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Customer Personas
            </h2>
            <SimpleTextBlock content={plan.personas} />
          </section>
        )}

        {/* Strategy Pillars */}
        {plan.strategy_pillars && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Strategy Pillars
            </h2>
            <SimpleTextBlock content={plan.strategy_pillars} />
          </section>
        )}

        {/* Marketing Mix (7 Ps) */}
        {plan.seven_ps && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Marketing Mix (7 Ps)
            </h2>
            <SimpleTextBlock content={plan.seven_ps} />
          </section>
        )}

        {/* Channel Playbook */}
        {plan.channel_playbook && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Channel Playbook
            </h2>
            <SimpleTextBlock content={plan.channel_playbook} />
          </section>
        )}

        {/* Budget Allocation */}
        {plan.budget && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Budget Allocation
            </h2>
            <SimpleTextBlock content={plan.budget} />
          </section>
        )}

        {/* 90-Day Action Plan */}
        {plan.calendar_next_90_days && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              90-Day Action Plan
            </h2>
            <SimpleTextBlock content={plan.calendar_next_90_days} />
          </section>
        )}

        {/* Key Performance Indicators */}
        {plan.kpis && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Key Performance Indicators
            </h2>
            <SimpleTextBlock content={plan.kpis} />
          </section>
        )}

        {/* Differentiation Strategy */}
        {plan.differentiators && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Differentiation Strategy
            </h2>
            <SimpleTextBlock content={plan.differentiators} />
          </section>
        )}

        {/* Risks and Safety Nets */}
        {plan.risks_and_safety_nets && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Risks and Safety Nets
            </h2>
            <SimpleTextBlock content={plan.risks_and_safety_nets} />
          </section>
        )}
        
      </div>
    </div>
  );
}