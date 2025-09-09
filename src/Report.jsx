export default function Report({ plan, loading }) {
  // Show skeleton loading animation while generating
  if (loading) {
    return <SkeletonTimeline />;
  }
  
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

  /* Success → render beautiful timeline marketing plan */
  const marketingPlan = plan.GoToMarketPlan || plan;
  
  // Define timeline phases with the marketing plan data
  const timelinePhases = [
    {
      id: 1,
      phase: "Foundation",
      icon: "🎯",
      color: "blue",
      title: "Market Analysis & Strategy",
      description: "Understanding your market position and strategic foundation",
      data: marketingPlan.MarketAnalysis || marketingPlan.MarketAnalysisAndPositioning,
      duration: "Week 1-2"
    },
    {
      id: 2, 
      phase: "Framework",
      icon: "🔧",
      color: "purple",
      title: "Marketing Mix Development",
      description: "Building your comprehensive marketing framework",
      data: marketingPlan.MarketingMix,
      duration: "Week 3-4"
    },
    {
      id: 3,
      phase: "Investment",
      icon: "💰", 
      color: "green",
      title: "Budget Planning & Allocation",
      description: "Strategic investment and resource allocation",
      data: marketingPlan.Budget || marketingPlan.BudgetAllocation,
      duration: "Week 4-5"
    },
    {
      id: 4,
      phase: "Execution",
      icon: "📅",
      color: "orange", 
      title: "Campaign Timeline",
      description: "Marketing calendar and campaign scheduling",
      data: marketingPlan.MarketingCalendar || marketingPlan.Timeline,
      duration: "Week 6+"
    },
    {
      id: 5,
      phase: "Measurement",
      icon: "📈",
      color: "indigo",
      title: "KPIs & Success Tracking", 
      description: "Performance measurement and optimization",
      data: marketingPlan.KPIs || marketingPlan.SuccessMetrics,
      duration: "Ongoing"
    }
  ].filter(phase => phase.data);

  return (
    <div className="mt-8 w-full max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">🚀 Your Strategic Marketing Roadmap</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">A step-by-step journey to marketing success, designed specifically for your business</p>
      </div>
      
      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 via-green-500 via-orange-500 to-indigo-500"></div>
        
        {/* Timeline phases */}
        <div className="space-y-12">
          {timelinePhases.map((phase, index) => (
            <TimelineStep 
              key={phase.id}
              phase={phase}
              index={index}
              isLast={index === timelinePhases.length - 1}
            />
          ))}
        </div>
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

/* Skeleton Loading Animation */
function SkeletonTimeline() {
  const skeletonPhases = [
    { color: "blue", duration: "Week 1-2" },
    { color: "purple", duration: "Week 3-4" },
    { color: "green", duration: "Week 4-5" },
    { color: "orange", duration: "Week 6+" },
    { color: "indigo", duration: "Ongoing" }
  ];

  return (
    <div className="mt-8 w-full max-w-6xl mx-auto px-4">
      {/* Header skeleton */}
      <div className="text-center mb-12">
        <div className="h-10 bg-gray-200 rounded-lg w-3/4 mx-auto mb-4 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"></div>
      </div>
      
      {/* Timeline skeleton */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-300 via-gray-300 to-gray-300 animate-pulse"></div>
        
        {/* Skeleton phases */}
        <div className="space-y-12">
          {skeletonPhases.map((phase, index) => (
            <SkeletonStep key={index} phase={phase} />
          ))}
        </div>
      </div>
      
      {/* Action bar skeleton */}
      <div className="mt-8 flex flex-wrap gap-3 justify-center bg-gray-50 p-4 rounded-lg">
        <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
      </div>
    </div>
  );
}

function SkeletonStep({ phase }) {
  const dotColors = {
    blue: "bg-blue-300",
    purple: "bg-purple-300", 
    green: "bg-green-300",
    orange: "bg-orange-300",
    indigo: "bg-indigo-300"
  };

  return (
    <div className="relative">
      {/* Timeline dot */}
      <div className={`absolute left-6 w-4 h-4 ${dotColors[phase.color]} rounded-full border-4 border-white shadow-lg z-10 animate-pulse`}></div>
      
      {/* Content */}
      <div className="ml-20">
        {/* Phase header skeleton */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-80 mt-2 animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded w-96 mt-2 animate-pulse"></div>
          </div>
        </div>
        
        {/* Content card skeleton */}
        <div className="bg-white border-l-4 border-gray-300 rounded-r-lg shadow-sm p-6 mb-4">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Timeline Step component for beautiful roadmap display */
function TimelineStep({ phase, index, isLast }) {
  const colorClasses = {
    blue: "border-blue-500 bg-blue-50",
    purple: "border-purple-500 bg-purple-50", 
    green: "border-green-500 bg-green-50",
    orange: "border-orange-500 bg-orange-50",
    indigo: "border-indigo-500 bg-indigo-50"
  };

  const dotColors = {
    blue: "bg-blue-500",
    purple: "bg-purple-500", 
    green: "bg-green-500",
    orange: "bg-orange-500",
    indigo: "bg-indigo-500"
  };

  return (
    <div className="relative">
      {/* Timeline dot */}
      <div className={`absolute left-6 w-4 h-4 ${dotColors[phase.color]} rounded-full border-4 border-white shadow-lg z-10`}></div>
      
      {/* Content */}
      <div className="ml-20">
        {/* Phase header */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{phase.icon}</span>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Phase {phase.id}: {phase.phase}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{phase.duration}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{phase.title}</h3>
            <p className="text-gray-600 mt-1">{phase.description}</p>
          </div>
        </div>
        
        {/* Content card */}
        <div className={`bg-white border-l-4 ${colorClasses[phase.color]} rounded-r-lg shadow-sm p-6 mb-4`}>
          {renderTimelineData(phase.data)}
        </div>
      </div>
    </div>
  );
}

/* Enhanced data renderer for timeline */
function renderTimelineData(data, depth = 0) {
  if (!data) return <p className="text-gray-500 italic">No data available for this phase.</p>;
  
  if (Array.isArray(data)) {
    return (
      <ul className="space-y-2">
        {data.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="text-blue-500 mt-1 text-sm">▶</span>
            <span className="text-gray-700">{typeof item === 'object' ? renderTimelineData(item, depth + 1) : item}</span>
          </li>
        ))}
      </ul>
    );
  }
  
  if (typeof data === 'object') {
    return (
      <div className="space-y-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className={depth > 0 ? "ml-4" : ""}>
            <h4 className="font-semibold text-gray-800 text-lg mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h4>
            <div className="text-gray-600 ml-4">
              {renderTimelineData(value, depth + 1)}
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return <p className="text-gray-700 leading-relaxed">{String(data)}</p>;
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
