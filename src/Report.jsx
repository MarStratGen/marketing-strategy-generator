import { useState } from 'react';

export default function Report({ plan, loading }) {
  const [viewMode, setViewMode] = useState('stepper'); // stepper, summary, interactive
  
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
  const marketingPlan = plan.GoToMarketPlan || plan.GTM_Plan || plan;
  
  // Define timeline phases matching the actual API response structure
  const timelinePhases = [
    {
      id: 1,
      phase: "Foundation",
      icon: "🎯",
      color: "blue",
      title: "Market Analysis & Strategy",
      description: "Understanding your market position and strategic foundation",
      data: marketingPlan.Market_Analysis_Positioning || marketingPlan.MarketAnalysis || marketingPlan.MarketAnalysisAndPositioning,
      duration: "Week 1-2"
    },
    {
      id: 2, 
      phase: "Framework",
      icon: "🔧",
      color: "purple",
      title: "Marketing Mix Development",
      description: "Building your comprehensive marketing framework",
      data: marketingPlan.Marketing_Mix || marketingPlan.MarketingMix,
      duration: "Week 3-4"
    },
    {
      id: 3,
      phase: "Investment",
      icon: "💰", 
      color: "green",
      title: "Budget Planning & Allocation",
      description: "Strategic investment and resource allocation",
      data: marketingPlan.Budget_Allocation || marketingPlan.Budget || marketingPlan.BudgetAllocation,
      duration: "Week 4-5"
    },
    {
      id: 4,
      phase: "Execution",
      icon: "📅",
      color: "orange", 
      title: "Campaign Timeline",
      description: "Marketing calendar and campaign scheduling",
      data: marketingPlan.Marketing_Calendar || marketingPlan.MarketingCalendar || marketingPlan.Timeline,
      duration: "Week 6+"
    },
    {
      id: 5,
      phase: "Measurement",
      icon: "📈",
      color: "indigo",
      title: "KPIs & Success Tracking", 
      description: "Performance measurement and optimization",
      data: marketingPlan.KPIs_Success_Metrics || marketingPlan.KPIs || marketingPlan.SuccessMetrics,
      duration: "Ongoing"
    }
  ].filter(phase => phase.data);

  return (
    <div className="mt-8 w-full max-w-6xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">🚀 Your Strategic Marketing Roadmap</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">A step-by-step journey to marketing success, designed specifically for your business</p>
        
        {/* View Mode Selector */}
        <div className="flex justify-center gap-2 mb-8">
          <button 
            onClick={() => setViewMode('stepper')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'stepper' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            📱 Stepper Interface
          </button>
          <button 
            onClick={() => setViewMode('summary')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'summary' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            📋 Summary + Drill-down
          </button>
          <button 
            onClick={() => setViewMode('interactive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'interactive' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            🔄 Interactive Phases
          </button>
        </div>
      </div>
      
      {/* Render based on view mode */}
      {viewMode === 'stepper' && <StepperView phases={timelinePhases} />}
      {viewMode === 'summary' && <SummaryView phases={timelinePhases} />}
      {viewMode === 'interactive' && <InteractiveView phases={timelinePhases} />}
      
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

/* 1. Stepper Interface - Navigate through phases one by one */
function StepperView({ phases }) {
  const [currentStep, setCurrentStep] = useState(0);
  const phase = phases[currentStep];

  if (!phase) return <div className="text-center text-gray-500">No data available</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">{currentStep + 1} of {phases.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / phases.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Current phase content */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${getPhaseColor(phase.color)}`}>
            {phase.icon}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Phase {phase.id}: {phase.phase}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{phase.title}</h3>
            <p className="text-gray-600">{phase.description}</p>
          </div>
        </div>
        
        <div className="prose max-w-none">
          {renderTimelineData(phase.data)}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
        >
          ← Previous
        </button>

        <div className="flex gap-2">
          {phases.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-3 h-3 rounded-full transition-colors ${index === currentStep ? 'bg-blue-600' : 'bg-gray-300'}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentStep(Math.min(phases.length - 1, currentStep + 1))}
          disabled={currentStep === phases.length - 1}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

/* 4. Summary + Drill-down - Overview cards that expand for details */
function SummaryView({ phases }) {
  const [expandedPhase, setExpandedPhase] = useState(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {phases.map((phase) => (
        <div key={phase.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          {/* Summary card */}
          <div className={`p-4 ${getPhaseColor(phase.color)} bg-opacity-10`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{phase.icon}</span>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Phase {phase.id}
                </div>
                <h3 className="font-bold text-gray-900">{phase.title}</h3>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{phase.description}</p>
            <button
              onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
              className="w-full bg-white bg-opacity-50 hover:bg-opacity-75 text-gray-700 px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              {expandedPhase === phase.id ? 'Hide Details' : 'View Details'}
            </button>
          </div>
          
          {/* Expanded content */}
          {expandedPhase === phase.id && (
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="text-sm">
                {renderTimelineData(phase.data)}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* 5. Interactive Phases - Click through with smooth transitions */
function InteractiveView({ phases }) {
  const [selectedPhase, setSelectedPhase] = useState(phases[0]?.id || 1);
  const currentPhase = phases.find(p => p.id === selectedPhase) || phases[0];

  return (
    <div className="flex gap-8">
      {/* Phase navigation sidebar */}
      <div className="w-80 bg-gray-50 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-4">Strategy Phases</h3>
        <div className="space-y-3">
          {phases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setSelectedPhase(phase.id)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                selectedPhase === phase.id 
                  ? `${getPhaseColor(phase.color)} bg-opacity-20 border-l-4 ${getBorderColor(phase.color)}` 
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{phase.icon}</span>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Phase {phase.id}
                  </div>
                  <div className="font-medium text-gray-900">{phase.title}</div>
                  <div className="text-xs text-gray-600">{phase.duration}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${getPhaseColor(currentPhase.color)}`}>
              {currentPhase.icon}
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Phase {currentPhase.id}: {currentPhase.phase}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{currentPhase.title}</h2>
              <p className="text-gray-600">{currentPhase.description}</p>
            </div>
          </div>
          
          <div className="prose max-w-none">
            {renderTimelineData(currentPhase.data)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Helper functions */
function getPhaseColor(color) {
  const colors = {
    blue: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
    green: "bg-green-100 text-green-800",
    orange: "bg-orange-100 text-orange-800",
    indigo: "bg-indigo-100 text-indigo-800"
  };
  return colors[color] || colors.blue;
}

function getBorderColor(color) {
  const colors = {
    blue: "border-blue-500",
    purple: "border-purple-500",
    green: "border-green-500",
    orange: "border-orange-500",
    indigo: "border-indigo-500"
  };
  return colors[color] || colors.blue;
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
