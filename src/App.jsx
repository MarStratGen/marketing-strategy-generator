import { useState, useRef, useEffect } from "react";
import Report from "./Report.jsx";

/* Modern UI components */
const Pill = ({ text, onRemove }) => (
  <span className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full mr-2 mb-2">
    {text}
    <button 
      onClick={onRemove} 
      className="ml-1 text-blue-600 hover:text-blue-800"
      title="Remove"
    >
      ×
    </button>
  </span>
);

const Field = ({ label, children, tooltip, required }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
      {tooltip && (
        <span className="ml-1 text-gray-400 cursor-help text-xs" title={tooltip}>ℹ️</span>
      )}
    </label>
    {children}
  </div>
);

const LoadingSpinner = () => (
  <div className="inline-flex items-center">
    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
    <span>Creating your marketing strategy...</span>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
      <div className="min-h-screen py-12 px-4">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Marketing Plan Generator
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Create comprehensive go-to-market strategies with AI-powered insights
          </p>
        </header>

        {/* Form Container */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 max-w-xl mx-auto">

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
          <Field 
            label="Which country are you targeting?" 
            required 
            tooltip="This helps us tailor regional insights and market trends."
          >
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Home gardeners aged 35-55"
            />
            <p className="text-sm text-gray-500 mt-1">
              Press comma or Enter to add. Up to 3 customer groups (optional).
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
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the action, e.g., ‘Call to book’, ‘Visit store’, ‘Request sample kit’"
                required
              />
            )}

            <p className="text-sm text-gray-500 mt-1">
              💡 This determines your marketing funnel and KPIs.
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
            <p className="text-sm text-gray-500 mt-1">
              💰 We'll provide percentage allocations.
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
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Amazon, Local garden center, Seeds4Life"
            />
            <p className="text-sm text-gray-500 mt-1">
              Press comma or Enter to add. Up to 3 competitors.
            </p>
          </Field>
              
          <button
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <LoadingSpinner /> : "Generate Marketing Plan"}
          </button>
        </form>
        </div>

        {/* Report */}
        <Report plan={result} loading={loading} />
      </div>
    </div>
  );
}

export default App;
