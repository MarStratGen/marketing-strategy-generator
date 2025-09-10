import { useState, useRef, useEffect } from "react";
import Report from "./Report.jsx";

/* Modern UI components */
const Pill = ({ text, onRemove }) => (
  <span className="inline-flex items-center bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full mr-2 mb-2 border border-gray-200">
    {text}
    <button 
      onClick={onRemove} 
      className="ml-2 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full text-xs transition-colors"
      title="Remove"
    >
      ×
    </button>
  </span>
);

const Field = ({ label, children, tooltip, required }) => (
  <div className="space-y-3">
    <div>
      <label className="block text-sm font-semibold text-gray-800">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {tooltip && (
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{tooltip}</p>
      )}
    </div>
    {children}
  </div>
);

const LoadingSpinner = () => (
  <div className="inline-flex items-center">
    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
    <span>Creating your marketing strategy...</span>
  </div>
);

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-white/5 transition-colors"
      >
        <span className="font-semibold text-white">{question}</span>
        <span className={`text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-white/80 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

const FAQItemDark = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900">{question}</span>
        <span className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-gray-700 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

const WORKER_URL =
  "https://glow-api-lingering-queen-74b7.cloudflare-4up2f.workers.dev/generate";

/* constants */
const COUNTRIES = [
  { label: "Australia", code: "Australia" },
  { label: "Canada", code: "Canada" },
  { label: "New Zealand", code: "New Zealand" },
  { label: "United Kingdom", code: "United Kingdom" },
  { label: "United States", code: "United States" },
  { label: "Other (custom)", code: "__custom_country" },
];

const SECTORS = [
  "Agriculture",
  "Automotive",
  "Aviation",
  "Banking",
  "Biotechnology",
  "Construction",
  "Consumer electronics",
  "E-commerce",
  "Education",
  "Energy",
  "Entertainment",
  "Fashion",
  "FMCG",
  "Food & beverage",
  "Gaming",
  "Government & public sector",
  "Healthcare",
  "Hospitality & tourism",
  "Insurance",
  "Logistics & supply chain",
  "Manufacturing",
  "Media & publishing",
  "Non-profit",
  "Pharmaceuticals",
  "Professional services",
  "Real estate",
  "Retail",
  "Sports & fitness",
  "Technology",
  "Telecommunications",
  "Transportation",
  "Utilities",
  "Waste management",
];


/* Alphabetical options, Other last */
const MOTIONS = [
  { label: "Apply or enrol", value: "enrolment" },
  { label: "Become a reseller or partner", value: "partner_recruitment" },
  { label: "Book a demo with sales", value: "saas_demo" },
  { label: "Book a service or appointment", value: "booking" },
  { label: "Buy on a marketplace", value: "marketplace_checkout" },
  { label: "Buy online", value: "ecom_checkout" },
  { label: "Call now to order", value: "call_now" },
  { label: "Donate", value: "donation" },
  { label: "Install the app", value: "app_install" },
  { label: "Request a quote or call back", value: "lead_capture" },
  { label: "Start a free trial", value: "saas_trial" },
  { label: "Visit a store or stockist", value: "store_visit" },
  { label: "Wholesale or bulk order enquiry", value: "wholesale_inquiry" },
  { label: "Other (custom)", value: "__custom_motion" }, // always last
];

const BUDGET_BANDS = [
  { label: "No paid budget", value: "none" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

/* main component */
function App() {
  // state
  const [country, setCountry] = useState("Australia");
  const [customCountry, setCCountry] = useState("");
  const [sector, setSector] = useState("");
  const [customSector, setCSector] = useState("");
  const [product, setProduct] = useState("");
  const [segments, setSeg] = useState([]);
  const [segInp, setSegInp] = useState("");
  const [competitors, setComp] = useState([]);
  const [compInp, setCompInp] = useState("");

  const [motion, setMotion] = useState("ecom_checkout");
  const [customMotion, setCustomMotion] = useState("");
  const [budgetBand, setBudgetBand] = useState("low");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState("");

  // refs for custom-input autofocus
  const ccRef = useRef(null);
  const csRef = useRef(null);

  useEffect(() => {
    if (country === "__custom_country") ccRef.current?.focus();
  }, [country]);
  useEffect(() => {
    if (sector === "__custom_sector") csRef.current?.focus();
  }, [sector]);

  // comma→pill helper
  const onComma = (e, setter, inputSetter, max = 99) => {
    const v = e.target.value.trim();
    if ((e.key === "," || e.key === "Enter") && v) {
      e.preventDefault();
      setter((list) => (list.length < max ? [...list, v] : list));
      inputSetter("");
    }
  };

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setResult(null);
    setLoading(true);

    try {
      const body = {
        country: country === "__custom_country" ? customCountry : country,
        sector: sector === "__custom_sector" ? customSector : sector,
        product_type: product,
        audiences: segments,
        competitors,
        model: "gpt-4o-mini",

        // action wanted (uses “target segment” wording in UI only)
        motion: motion === "__custom_motion" ? "custom" : motion,
        action_custom: motion === "__custom_motion" ? customMotion : undefined,

        // budget band only
        budget_band: budgetBand,
      };

      const r = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await r.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setErr("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section with Gradient Background */}
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-16 px-4">
        {/* Header - Outside Form */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
            Marketing Plan Generator
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Create comprehensive go-to-market strategies with AI-powered insights
          </p>
        </div>

        {/* Form Container with Photo Background */}
        <div 
          className="rounded-3xl shadow-xl p-10 max-w-lg mx-auto border border-white/20 mb-20 relative"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url('/attached_assets/birmingham-museums-trust-YvNiIyGdMfs-unsplash_1757466351093.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-7">
          <Field 
            label="Which country are you targeting?" 
            required 
            tooltip="This helps us tailor regional insights and market trends."
          >
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 placeholder-gray-400"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            {country === "__custom_country" && (
              <input
                ref={ccRef}
                value={customCountry}
                onChange={(e) => setCCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 placeholder-gray-400"
                placeholder="Type your country"
              />
            )}
          </Field>

          <Field 
            label="What industry are you in?" 
            tooltip="Don't worry if yours isn't listed - you can specify something custom."
          >
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 placeholder-gray-400"
            >
              <option value="" disabled>Choose your industry (optional)</option>
              {[
                ...SECTORS.map((s) => ({ code: s, label: s })),
                { code: "__custom_sector", label: "Other (custom)" },
              ].map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
            {sector === "__custom_sector" && (
              <input
                ref={csRef}
                value={customSector}
                onChange={(e) => setCSector(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 placeholder-gray-400"
                placeholder="Type your sector"
              />
            )}
          </Field>

          <Field 
            label="What are you selling?" 
            required 
            tooltip="The more specific you are, the better our recommendations will be."
          >
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 placeholder-gray-400"
              placeholder="e.g., Organic heirloom tomato seeds, AI-powered project management software"
              required
            />
          </Field>
          <Field 
            label="Who are your ideal customers?" 
            tooltip="Think demographics, behaviors, or specific needs. Like 'busy parents' or 'small business owners'."
          >
            <div className="mb-1">
              {segments.map((s, i) => (
                <Pill
                  key={i}
                  text={s}
                  onRemove={() => setSeg(segments.filter((_, j) => j !== i))}
                />
              ))}
            </div>
            <input
              value={segInp}
              onChange={(e) => setSegInp(e.target.value)}
              onKeyDown={(e) => onComma(e, setSeg, setSegInp)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 placeholder-gray-400"
              placeholder="e.g., Home gardeners aged 35-55"
            />
            <p className="text-xs text-gray-400 mt-2">
              Press comma or Enter to add. Up to 3 groups.
            </p>
          </Field>

          <Field 
            label="What should customers do next?" 
            required
            tooltip="Pick the main action you want people to take. This shapes your entire marketing strategy."
          >
            <select
              value={motion}
              onChange={(e) => setMotion(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 placeholder-gray-400"
              required
            >
              {MOTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            {motion === "__custom_motion" && (
              <input
                value={customMotion}
                onChange={(e) => setCustomMotion(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 placeholder-gray-400"
                placeholder="Describe the action, e.g., ‘Call to book’, ‘Visit store’, ‘Request sample kit’"
                required
              />
            )}

            <p className="text-xs text-gray-400 mt-2">
              This shapes your marketing strategy and KPIs.
            </p>
          </Field>
          <Field 
            label="What's your marketing budget like?" 
            required
            tooltip="We'll suggest strategies that fit your budget, focusing on percentages rather than dollar amounts."
          >
            <select
              value={budgetBand}
              onChange={(e) => setBudgetBand(e.target.value)}
              className="w-full px-4 py-4 text-lg border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              {BUDGET_BANDS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-2">
              Budget allocations will be shown as percentages.
            </p>
          </Field>

          <Field 
            label="Who are you up against?" 
            tooltip="List your main competitors so we can help you stand out. Optional, but really helpful."
          >
            <div className="mb-1">
              {competitors.map((c, i) => (
                <Pill
                  key={i}
                  text={c}
                  onRemove={() =>
                    setComp(competitors.filter((_, j) => j !== i))
                  }
                />
              ))}
            </div>
            <input
              value={compInp}
              onChange={(e) => setCompInp(e.target.value)}
              onKeyDown={(e) => onComma(e, setComp, setCompInp, 3)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 placeholder-gray-400"
              placeholder="e.g., Amazon, Local garden center, Seeds4Life"
            />
            <p className="text-xs text-gray-400 mt-2">
              Press comma or Enter to add. Up to 3 competitors.
            </p>
          </Field>
              
          <button
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-60 shadow-lg hover:shadow-xl mt-8"
          >
            {loading ? <LoadingSpinner /> : "Generate Marketing Plan"}
          </button>
        </form>
        </div>

        {/* Report */}
        <Report plan={result} loading={loading} />
        </div>
      </div>
      
      {/* FAQ Section - Solid Background */}
      <div className="bg-gray-100 py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <FAQItemDark 
              question="How does the marketing plan generator work?"
              answer="Our AI analyzes your business inputs and creates comprehensive marketing strategies tailored to your specific industry, target market, and budget constraints."
            />
            <FAQItemDark 
              question="How accurate are the marketing recommendations?"
              answer="The recommendations are based on proven marketing frameworks and industry best practices, customized to your specific business context and market conditions."
            />
            <FAQItemDark 
              question="Can I use this for any type of business?"
              answer="Yes, our generator works for businesses across all industries, from startups to established companies, both B2B and B2C markets."
            />
            <FAQItemDark 
              question="What's included in the marketing plan?"
              answer="Each plan includes STP analysis, marketing mix (7 Ps), budget allocation, tactical calendar, KPIs, and strategic recommendations."
            />
            <FAQItemDark 
              question="How long does it take to generate a plan?"
              answer="Most plans are generated within 30-60 seconds, depending on the complexity of your requirements and current system load."
            />
            <FAQItemDark 
              question="Is my business information kept private?"
              answer="Yes, we prioritize your privacy. Your business information is used only to generate your marketing plan and is not stored or shared."
            />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-800 py-8">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            [Disclaimer text will be added here - please provide the copy you'd like to include]
          </p>
          <p className="text-xs text-gray-500 mt-4">
            © 2024 Marketing Plan Generator. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
