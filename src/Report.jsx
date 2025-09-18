// Recursive content parser with proper nested structure support
function parseContent(content) {
  if (!content) return [];
  
  // Handle arrays
  if (Array.isArray(content)) {
    return renderArray(content);
  }
  
  // Handle objects  
  if (typeof content === 'object' && content !== null) {
    return renderObject(content);
  }
  
  // Handle strings with full parsing
  return parseString(String(content));
}

function renderArray(arr) {
  const bulletItems = [];
  
  for (const item of arr) {
    if (typeof item === 'string') {
      bulletItems.push({ text: item });
    } else if (Array.isArray(item)) {
      // Nested array - create recursive structure
      const childElements = renderArray(item);
      bulletItems.push({ 
        text: `Array (${item.length} items)`,
        children: childElements 
      });
    } else if (typeof item === 'object' && item !== null) {
      // Object in array - create recursive structure
      const childElements = renderObject(item);
      const title = item.name || item.title || Object.keys(item)[0] || 'Object';
      bulletItems.push({ 
        text: title,
        children: childElements 
      });
    } else {
      bulletItems.push({ text: String(item) });
    }
  }
  
  return [{ type: 'bulletList', items: bulletItems }];
}

function renderObject(obj) {
  const elements = [];
  
  Object.entries(obj).forEach(([key, value]) => {
    const heading = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    elements.push({ type: 'subheading', content: heading });
    
    // Recursively handle the value
    if (typeof value === 'string') {
      elements.push(...parseString(value));
    } else if (Array.isArray(value)) {
      elements.push(...renderArray(value));
    } else if (typeof value === 'object' && value !== null) {
      // Nested object - create recursive definition structure
      const bulletItems = Object.entries(value).map(([k, v]) => {
        const label = k.replace(/_/g, ' ');
        
        if (typeof v === 'string') {
          return { text: `${label}: ${v}` };
        } else if (Array.isArray(v)) {
          const childElements = renderArray(v);
          return { 
            text: label,
            children: childElements 
          };
        } else if (typeof v === 'object' && v !== null) {
          const childElements = renderObject(v);
          return { 
            text: label,
            children: childElements 
          };
        } else {
          return { text: `${label}: ${String(v)}` };
        }
      });
      elements.push({ type: 'bulletList', items: bulletItems });
    } else {
      elements.push({ type: 'paragraph', content: String(value) });
    }
  });
  
  return elements;
}

function parseString(text) {
  if (!text) return [];
  
  // Split by lines but preserve paragraph breaks
  const lines = text.split('\n');
  const elements = [];
  let currentBullets = [];
  let currentParagraph = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Empty line - flush current content and add paragraph break
    if (!trimmed) {
      flushContent();
      continue;
    }
    
    // Check for subheadings first
    if (trimmed.endsWith(':') || /^#{2,4}\s+/.test(trimmed) || trimmed.startsWith('—')) {
      flushContent();
      const content = trimmed.replace(/^#{2,4}\s+/, '').replace(/:$/, '').replace(/^—\s*/, '');
      elements.push({ type: 'subheading', content });
    }
    // Check for bullets
    else if (/^(?:•|\-|\*|\d+[.)])\s+/.test(trimmed)) {
      // Flush any current paragraph
      if (currentParagraph.length > 0) {
        elements.push({ type: 'paragraph', content: currentParagraph.join(' ') });
        currentParagraph = [];
      }
      const content = trimmed.replace(/^(?:•|\-|\*|\d+[.)])\s+/, '');
      currentBullets.push(content);
    }
    // Regular text
    else {
      // Flush any current bullets
      if (currentBullets.length > 0) {
        const bulletItems = currentBullets.map(bullet => ({ text: bullet }));
        elements.push({ type: 'bulletList', items: bulletItems });
        currentBullets = [];
      }
      currentParagraph.push(trimmed);
    }
  }
  
  // Flush any remaining content
  flushContent();
  
  function flushContent() {
    if (currentBullets.length > 0) {
      const bulletItems = currentBullets.map(bullet => ({ text: bullet }));
      elements.push({ type: 'bulletList', items: bulletItems });
      currentBullets = [];
    }
    if (currentParagraph.length > 0) {
      elements.push({ type: 'paragraph', content: currentParagraph.join(' ') });
      currentParagraph = [];
    }
  }
  
  return elements;
}

function ContentRenderer({ content }) {
  const elements = parseContent(content);
  
  const renderElement = (element, index) => {
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
            <li key={itemIndex} className="leading-relaxed">
              {item.text}
              {item.children && item.children.length > 0 && (
                <div className="ml-4 mt-2">
                  {item.children.map((child, childIndex) => 
                    renderElement(child, `${itemIndex}-${childIndex}`)
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      );
    }
    
    return (
      <p key={index} className="text-gray-700 leading-relaxed">
        {element.content}
      </p>
    );
  };
  
  return (
    <div className="space-y-4">
      {elements.map((element, index) => renderElement(element, index))}
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