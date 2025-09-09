export default function Report({ plan }) {
  if (!plan) return null; // form visible

  /* Error handling */
  if (plan.error) {
    const errorMessage = typeof plan === 'object' ? JSON.stringify(plan, null, 2) : String(plan);
    
    // Extract user-friendly error message
    let userMessage = "An error occurred while generating your marketing plan.";
    if (plan.detail?.error?.message) {
      userMessage = `API Error: ${plan.detail.error.message}`;
    } else if (plan.error) {
      userMessage = `Error: ${plan.error}`;
    }
    
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

  /* Success → render beautiful marketing plan */
  const marketingPlan = plan.GoToMarketPlan || plan;
  
  return (
    <div className="mt-8 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
        <h2 className="text-2xl font-bold mb-2">🚀 Your Marketing Plan</h2>
        <p className="opacity-90">A comprehensive go-to-market strategy tailored for your business</p>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-b-lg p-6 space-y-8">
        
        {/* Market Analysis */}
        {marketingPlan.MarketAnalysis && (
          <Section title="📊 Market Analysis" data={marketingPlan.MarketAnalysis} />
        )}
        
        {/* Marketing Mix */}
        {marketingPlan.MarketingMix && (
          <Section title="🎯 Marketing Mix (7 Ps)" data={marketingPlan.MarketingMix} />
        )}
        
        {/* Budget */}
        {marketingPlan.Budget && (
          <Section title="💰 Budget Allocation" data={marketingPlan.Budget} />
        )}
        
        {/* Calendar */}
        {marketingPlan.MarketingCalendar && (
          <Section title="📅 Marketing Calendar" data={marketingPlan.MarketingCalendar} />
        )}
        
        {/* KPIs */}
        {marketingPlan.KPIs && (
          <Section title="📈 Key Performance Indicators" data={marketingPlan.KPIs} />
        )}
        
        {/* Success Metrics */}
        {marketingPlan.SuccessMetrics && (
          <Section title="🎯 Success Metrics" data={marketingPlan.SuccessMetrics} />
        )}
        
        {/* Fallback for any other sections */}
        {Object.entries(marketingPlan).map(([key, value]) => {
          const knownSections = ['MarketAnalysis', 'MarketingMix', 'Budget', 'MarketingCalendar', 'KPIs', 'SuccessMetrics'];
          if (!knownSections.includes(key) && typeof value === 'object') {
            return <Section key={key} title={key.replace(/([A-Z])/g, ' $1').trim()} data={value} />;
          }
          return null;
        })}
      </div>
      
      {/* Export Options */}
      <div className="mt-4 text-center">
        <button 
          onClick={() => {
            const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'marketing-plan.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors"
        >
          📄 Download as JSON
        </button>
      </div>
    </div>
  );
}

/* Section component for rendering different parts of the plan */
function Section({ title, data }) {
  return (
    <div className="border-l-4 border-blue-500 pl-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="space-y-3">
        {renderData(data)}
      </div>
    </div>
  );
}

/* Recursive data renderer */
function renderData(data, depth = 0) {
  if (!data) return null;
  
  if (Array.isArray(data)) {
    return (
      <ul className="list-disc list-inside space-y-1 ml-4">
        {data.map((item, index) => (
          <li key={index} className="text-gray-700">
            {typeof item === 'object' ? renderData(item, depth + 1) : item}
          </li>
        ))}
      </ul>
    );
  }
  
  if (typeof data === 'object') {
    return (
      <div className={`space-y-2 ${depth > 0 ? 'ml-4' : ''}`}>
        {Object.entries(data).map(([key, value]) => (
          <div key={key}>
            <h4 className={`font-medium text-gray-800 ${depth === 0 ? 'text-base' : 'text-sm'}`}>
              {key.replace(/([A-Z])/g, ' $1').trim()}:
            </h4>
            <div className="ml-2">
              {renderData(value, depth + 1)}
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return <p className="text-gray-700">{String(data)}</p>;
}
