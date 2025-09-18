// Dead Simple Text Block Renderer - No Complex Parsing
function SimpleTextBlock({ content }) {
  // Handle non-string content
  if (!content || typeof content !== 'string') {
    return (
      <pre className="bg-gray-50 p-4 rounded text-sm text-gray-600 whitespace-pre-wrap">
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  }

  // Split content into blocks separated by double newlines
  const blocks = content.split(/\n\s*\n/).filter(block => block.trim());
  
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        const lines = block.trim().split('\n');
        
        // Check if all lines are bullets
        const allBullets = lines.every(line => 
          line.trim().match(/^(?:•|\-|\*)\s+/) || line.trim() === ''
        );
        
        if (allBullets && lines.some(line => line.trim())) {
          // Render as bullet list
          const bulletItems = lines
            .filter(line => line.trim())
            .map(line => line.replace(/^(?:•|\-|\*)\s+/, '').trim());
            
          return (
            <ul key={index} className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              {bulletItems.map((item, itemIndex) => (
                <li key={itemIndex} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          );
        } else {
          // Render as paragraph
          return (
            <p key={index} className="text-gray-700 leading-relaxed">
              {block.trim()}
            </p>
          );
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

        {/* Personas */}
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

        {/* KPIs */}
        {plan.kpis && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Key Performance Indicators
            </h2>
            <SimpleTextBlock content={plan.kpis} />
          </section>
        )}

        {/* Differentiation */}
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