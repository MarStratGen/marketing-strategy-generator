// Simple Document-Style Report Display
function parseContent(content) {
  if (!content) return [];
  
  // Handle different content types
  if (Array.isArray(content)) {
    const items = content.map(item => typeof item === 'string' ? item : String(item));
    return [{ type: 'bulletList', items }];
  }
  
  if (typeof content === 'object' && content !== null) {
    const elements = [];
    Object.entries(content).forEach(([key, value]) => {
      const heading = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      elements.push({ type: 'subheading', content: heading });
      
      // Handle value by type
      if (Array.isArray(value)) {
        const items = value.map(item => typeof item === 'string' ? item : String(item));
        elements.push({ type: 'bulletList', items });
      } else if (typeof value === 'object' && value !== null) {
        // Nested object - render as definition list
        const nested = Object.entries(value).map(([k, v]) => 
          `${k.replace(/_/g, ' ')}: ${typeof v === 'string' ? v : String(v)}`
        );
        elements.push({ type: 'bulletList', items: nested });
      } else {
        // Parse string content normally
        elements.push(...parseContent(String(value)));
      }
    });
    return elements;
  }
  
  const text = String(content);
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const elements = [];
  let currentBullets = [];
  
  for (const line of lines) {
    // Check for subheadings first (before bullets)
    if (line.endsWith(':') || /^#{2,4}\s+/.test(line) || line.startsWith('—') || line.startsWith('###')) {
      // Flush any pending bullets
      if (currentBullets.length > 0) {
        elements.push({ type: 'bulletList', items: currentBullets });
        currentBullets = [];
      }
      const content = line.replace(/^#{2,4}\s+/, '').replace(/:$/, '').replace(/^—\s*/, '');
      elements.push({ type: 'subheading', content });
    }
    // Detect bullets: •, -, *, 1., 1)
    else if (/^(?:•|\-|\*|\d+[.)])\s+/.test(line)) {
      const content = line.replace(/^(?:•|\-|\*|\d+[.)])\s+/, '');
      currentBullets.push(content);
    }
    // Regular paragraph
    else {
      // Flush any pending bullets
      if (currentBullets.length > 0) {
        elements.push({ type: 'bulletList', items: currentBullets });
        currentBullets = [];
      }
      elements.push({ type: 'paragraph', content: line });
    }
  }
  
  // Flush any remaining bullets
  if (currentBullets.length > 0) {
    elements.push({ type: 'bulletList', items: currentBullets });
  }
  
  return elements;
}

function ContentRenderer({ content }) {
  const elements = parseContent(content);
  
  return (
    <div className="space-y-4">
      {elements.map((element, index) => {
        if (element.type === 'subheading') {
          return (
            <h4 key={index} className="text-lg font-semibold text-gray-900 mt-6 mb-3 border-b border-gray-100 pb-1">
              {element.content}
            </h4>
          );
        }
        
        if (element.type === 'bulletList') {
          return (
            <ul key={index} className="list-disc list-inside space-y-2 ml-4 text-gray-700">
              {element.items.map((item, itemIndex) => (
                <li key={itemIndex} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          );
        }
        
        return (
          <p key={index} className="text-gray-700 leading-relaxed">
            {element.content}
          </p>
        );
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
            <ContentRenderer content={plan.market_foundation} />
          </section>
        )}

        {/* Personas */}
        {plan.personas && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Customer Personas
            </h2>
            <ContentRenderer content={plan.personas} />
          </section>
        )}

        {/* Strategy Pillars */}
        {plan.strategy_pillars && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Strategy Pillars
            </h2>
            <ContentRenderer content={plan.strategy_pillars} />
          </section>
        )}

        {/* Marketing Mix (7 Ps) */}
        {plan.seven_ps && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Marketing Mix (7 Ps)
            </h2>
            <ContentRenderer content={plan.seven_ps} />
          </section>
        )}

        {/* Channel Playbook */}
        {plan.channel_playbook && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Channel Playbook
            </h2>
            <ContentRenderer content={plan.channel_playbook} />
          </section>
        )}

        {/* Budget Allocation */}
        {plan.budget && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Budget Allocation
            </h2>
            <ContentRenderer content={plan.budget} />
          </section>
        )}

        {/* 90-Day Action Plan */}
        {plan.calendar_next_90_days && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              90-Day Action Plan
            </h2>
            <ContentRenderer content={plan.calendar_next_90_days} />
          </section>
        )}

        {/* KPIs */}
        {plan.kpis && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Key Performance Indicators
            </h2>
            <ContentRenderer content={plan.kpis} />
          </section>
        )}

        {/* Differentiation */}
        {plan.differentiators && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Differentiation Strategy
            </h2>
            <ContentRenderer content={plan.differentiators} />
          </section>
        )}

        {/* Risks and Safety Nets */}
        {plan.risks_and_safety_nets && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">
              Risks and Safety Nets
            </h2>
            <ContentRenderer content={plan.risks_and_safety_nets} />
          </section>
        )}
        
      </div>
    </div>
  );
}