import { useState, useRef, useEffect } from "react";
import Report from "./Report.jsx";

/* Modern UI components */
const Pill = ({ text, onRemove }) => (
  <span className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm px-3 py-1 rounded-full mr-2 mb-2 transition-all duration-200">
    {text}
    <button 
      onClick={onRemove} 
      className="ml-2 w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-300 rounded-full text-xs transition-all"
      title="Remove"
    >
      ×
    </button>
  </span>
);

const Field = ({ label, children, tooltip, required }) => (
  <div className="space-y-3">
    <label className="block text-lg font-semibold text-gray-900">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
      {tooltip && (
        <div className="text-sm font-normal text-gray-600 mt-1">{tooltip}</div>
      )}
    </label>
    {children}
  </div>
);

const LoadingSpinner = () => (
  <div className="inline-flex items-center">
    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
    <span>Creating your marketing plan...</span>
  </div>
);

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
export default function App() {
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
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen py-16">
        <div className="max-w-xl mx-auto px-6">
          {/* Header */}
          <header className="mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Marketing Plan Generator
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Tell us about your business, and we'll create a comprehensive go-to-market strategy in minutes.
            </p>
          </header>

          {/* Form Container */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl mb-8">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
          <Field 
            label="Target market country" 
            required 
            tooltip="Which country are you targeting for this marketing plan?"
          >
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-4 text-lg border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
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
                className="w-full px-4 py-4 text-lg border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                placeholder="Type your country"
              />
            )}
          </Field>

          <Field 
            label="Industry sector" 
            tooltip="Choose the industry that best describes your business"
          >
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full px-4 py-4 text-lg border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
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
                className="w-full px-4 py-4 text-lg border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                placeholder="Type your sector"
              />
            )}
          </Field>

          <Field 
            label="Product or service" 
            required 
            tooltip="Describe what you're selling - be specific and clear"
          >
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="w-full mt-1 mb-2 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              placeholder="e.g., Organic vegetable seeds, SaaS project management tool"
              required
            />
          </Field>
          <Field 
            label="Target customer groups" 
            tooltip="Who are your ideal customers? Be specific about demographics, behaviors, or needs"
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
              className="w-full px-4 py-4 text-lg border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
              placeholder="e.g., Home gardeners aged 35-55"
            />
            <p className="text-sm text-white/60 mt-1">
              Press comma or Enter to add. Up to 3 customer groups (optional).
            </p>
          </Field>

          <Field 
            label="Desired customer action" 
            required
            tooltip="What do you want customers to do? This determines your marketing funnel and KPIs"
          >
            <select
              value={motion}
              onChange={(e) => setMotion(e.target.value)}
              className="w-full px-4 py-4 text-lg border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
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
                className="w-full px-4 py-4 text-lg border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                placeholder="Describe the action, e.g., ‘Call to book’, ‘Visit store’, ‘Request sample kit’"
                required
              />
            )}

            <p className="text-sm text-slate-300 mt-2">
              💡 This determines your marketing funnel and KPIs - can be online or offline actions.
            </p>
          </Field>
          <Field 
            label="Marketing budget level" 
            required
            tooltip="Select your overall marketing budget range"
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
            <p className="text-sm text-slate-300 mt-2">
              💰 We'll provide percentage allocations rather than specific dollar amounts.
            </p>
          </Field>

          <Field 
            label="Key competitors (optional)" 
            tooltip="Who else is competing for your customers? List up to 3 main competitors"
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
              className="w-full px-4 py-4 text-lg border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
              placeholder="e.g., Amazon, Local garden center, Seeds4Life"
            />
            <p className="text-sm text-white/60 mt-1">
              Press comma or Enter to add. Up to 3 competitors.
            </p>
          </Field>
              
              <button
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-4 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <LoadingSpinner /> : "🚀 Generate Marketing Plan"}
              </button>
            </form>
          </div>

          {/* Report */}
          <Report plan={result} loading={loading} />
        </div>
      </div>
    </div>
  );
}
