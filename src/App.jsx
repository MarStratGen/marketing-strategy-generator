import { useState, useRef, useEffect } from "react";
import Report from "./Report.jsx";

/* tiny UI helpers */
const Pill = ({ text, onRemove }) => (
  <span className="inline-flex items-center bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded mr-1 mb-1 transition-colors">
    {text}
    <button 
      onClick={onRemove} 
      className="ml-1 hover:text-blue-900 hover:bg-blue-300 rounded px-1 transition-colors"
      title="Remove"
    >
      ×
    </button>
  </span>
);

const Field = ({ label, children, tooltip, required }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
      {tooltip && (
        <span className="ml-1 text-gray-400 cursor-help" title={tooltip}>ℹ️</span>
      )}
    </label>
    {children}
  </div>
);

const LoadingSpinner = () => (
  <div className="inline-flex items-center">
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
    Generating your strategic marketing plan...
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
    <div className="w-full min-h-screen">
      {/* Form Container */}
      <div className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 tracking-wide">
          Tiny Marketing-Plan Generator
        </h1>

        {error && (
          <div className="bg-red-200 text-red-800 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Country */}
          <Field 
            label="Target market country" 
            required 
            tooltip="Which country are you targeting for this marketing plan?"
          >
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full mt-1 mb-2 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Type your country"
              />
            )}
          </Field>

          {/* Sector */}
          <Field 
            label="Industry sector" 
            tooltip="Choose the industry that best describes your business"
          >
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full mt-1 mb-2 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Type your sector"
              />
            )}
          </Field>

          {/* Offering */}
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

          {/* Target segment(s) */}
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
              className="w-full mt-1 mb-2 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="e.g., Home gardeners aged 35-55"
            />
            <p className="text-xs text-gray-500 mt-1">
              Press comma or Enter to add. Maximum 3 segments.
            </p>
          </Field>


          {/* Primary action for the target segment */}
          <Field label="What is the primary action you want your target segment to take?">
            <select
              value={motion}
              onChange={(e) => setMotion(e.target.value)}
              className="w-full mt-1 mb-2 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                className="w-full mt-1 mb-2 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Describe the action, e.g., ‘Call to book’, ‘Visit store’, ‘Request sample kit’"
                required
              />
            )}

            <p className="text-xs text-gray-500">
              Pick one. This sets the funnel and KPIs. It can be online or
              offline.
            </p>
          </Field>

          {/* Budget level (bands only) */}
          <Field label="Budget level">
            <select
              value={budgetBand}
              onChange={(e) => setBudgetBand(e.target.value)}
              className="w-full mt-1 mb-1 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {BUDGET_BANDS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              We will allocate percentages only and avoid currency amounts.
            </p>
          </Field>

          {/* Competitors */}
          <Field label="Top competitors – comma to add, max 3 (optional)">
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
              className="w-full mt-1 mb-2 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="e.g., Amazon, Local garden center, Seeds4Life"
            />
          </Field>

          <button
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-md transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
          >
            {loading ? <LoadingSpinner /> : "🚀 Generate Marketing Plan"}
          </button>
        </form>
      </div>

      {/* Report */}
      <Report plan={result} loading={loading} />
    </div>
  );
}
