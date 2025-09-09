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

  /* Success → render beautiful card-based marketing plan */
  const marketingPlan = plan.GoToMarketPlan || plan;
  
  return (
    <div className="mt-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">🚀 Your Marketing Plan</h2>
        <p className="text-gray-600">A comprehensive go-to-market strategy tailored for your business</p>
      </div>
      
      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Market Analysis Card */}
        {marketingPlan.MarketAnalysis && (
          <Card 
            icon="📊" 
            title="Market Analysis" 
            color="blue"
            data={marketingPlan.MarketAnalysis}
            description="Strategic positioning and market insights"
          />
        )}
        
        {/* Marketing Mix Card */}
        {marketingPlan.MarketingMix && (
          <Card 
            icon="🎯" 
            title="Marketing Mix" 
            color="purple"
            data={marketingPlan.MarketingMix}
            description="The 7 Ps framework for success"
          />
        )}
        
        {/* Budget Card */}
        {marketingPlan.Budget && (
          <Card 
            icon="💰" 
            title="Budget Allocation" 
            color="green"
            data={marketingPlan.Budget}
            description="Investment breakdown and ROI planning"
          />
        )}
        
        {/* Calendar Card */}
        {marketingPlan.MarketingCalendar && (
          <Card 
            icon="📅" 
            title="Marketing Calendar" 
            color="orange"
            data={marketingPlan.MarketingCalendar}
            description="Timeline and campaign scheduling"
          />
        )}
        
        {/* KPIs Card */}
        {marketingPlan.KPIs && (
          <Card 
            icon="📈" 
            title="Key Performance Indicators" 
            color="indigo"
            data={marketingPlan.KPIs}
            description="Metrics that matter for success"
          />
        )}
        
        {/* Success Metrics Card */}
        {marketingPlan.SuccessMetrics && (
          <Card 
            icon="🎯" 
            title="Success Metrics" 
            color="pink"
            data={marketingPlan.SuccessMetrics}
            description="How to measure your wins"
          />
        )}
        
        {/* Dynamic cards for any other sections */}
        {Object.entries(marketingPlan).map(([key, value]) => {
          const knownSections = ['MarketAnalysis', 'MarketingMix', 'Budget', 'MarketingCalendar', 'KPIs', 'SuccessMetrics'];
          if (!knownSections.includes(key) && typeof value === 'object') {
            return (
              <Card 
                key={key}
                icon="📋" 
                title={key.replace(/([A-Z])/g, ' $1').trim()} 
                color="gray"
                data={value}
                description="Additional insights"
              />
            );
          }
          return null;
        })}
      </div>
      
      {/* Action Bar */}
      <div className="flex flex-wrap gap-3 justify-center bg-gray-50 p-4 rounded-lg">
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          📄 Download JSON
        </button>
        <button 
          onClick={() => window.print()}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          🖨️ Print Plan
        </button>
      </div>
    </div>
  );
}

/* Card component for beautiful section display */
function Card({ icon, title, color, data, description }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 border-blue-200",
    purple: "from-purple-500 to-purple-600 border-purple-200", 
    green: "from-green-500 to-green-600 border-green-200",
    orange: "from-orange-500 to-orange-600 border-orange-200",
    indigo: "from-indigo-500 to-indigo-600 border-indigo-200",
    pink: "from-pink-500 to-pink-600 border-pink-200",
    gray: "from-gray-500 to-gray-600 border-gray-200"
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Card Header */}
      <div className={`bg-gradient-to-r ${colorClasses[color]} text-white p-4`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm opacity-90">{description}</p>
          </div>
        </div>
      </div>
      
      {/* Card Content */}
      <div className="p-4">
        {renderCardData(data)}
      </div>
    </div>
  );
}

/* Enhanced data renderer for cards */
function renderCardData(data, depth = 0) {
  if (!data) return null;
  
  if (Array.isArray(data)) {
    return (
      <ul className="space-y-2">
        {data.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-gray-700">
            <span className="text-blue-500 mt-1">•</span>
            <span>{typeof item === 'object' ? renderCardData(item, depth + 1) : item}</span>
          </li>
        ))}
      </ul>
    );
  }
  
  if (typeof data === 'object') {
    return (
      <div className="space-y-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className={depth > 0 ? "ml-3" : ""}>
            <h4 className="font-medium text-gray-800 text-sm mb-1">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h4>
            <div className="text-gray-600 text-sm">
              {renderCardData(value, depth + 1)}
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <p className="text-gray-700 text-sm leading-relaxed">{String(data)}</p>
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
