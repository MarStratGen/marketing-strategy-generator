import { useState, useRef, useEffect } from "react";
import Report from "./Report.jsx";

/* tiny UI helpers */
const Pill = ({ text, onRemove }) => (
  <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-1 mb-1">
    {text}
    <button onClick={onRemove} className="ml-1">×</button>
  </span>
);
const Field = ({ label, children }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {children}
  </div>
);

/* ---- EDIT ME: set your Worker URL ---- */
const WORKER_URL = "https://glow-api-lingering-queen-74b7.cloudflare-4up2f.workers.dev/generate";

/* constants */
const COUNTRIES = [
  { label: "Australia", code: "Australia" },
  { label: "Canada", code: "Canada" },
  { label: "New Zealand", code: "New Zealand" },
  { label: "United Kingdom", code: "United Kingdom" },
  { label: "United States", code: "United States" },
  { label: "Other (custom)", code: "__custom_country" }
];

const SECTORS = [
  "Agriculture","Automotive","Aviation","Banking","Biotechnology","Construction","Consumer electronics","E-commerce","Education","Energy","Entertainment","Fashion","FMCG","Food & beverage","Gaming","Government & public sector","Healthcare","Hospitality & tourism","Insurance","Logistics & supply chain","Manufacturing","Media & publishing","Non-profit","Pharmaceuticals","Professional services","Real estate","Retail","Sports & fitness","Technology","Telecommunications","Transportation","Utilities","Waste management"
];

const GOALS = [
  { label: "Online sales", value: "online_sales" },
  { label: "Lead generation", value: "lead_gen" },
  { label: "Brand awareness", value: "brand_awareness" },
  { label: "In-store sales", value: "in-store_sales" },
  { label: "User retention", value: "user_retention" }
];

const MOTIONS = [
  { label: "Buy online", value: "ecom_checkout" },
  { label: "Buy on a marketplace", value: "marketplace_checkout" },
  { label: "Visit a store or stockist", value: "store_visit" },
  { label: "Call now to order", value: "call_now" },
  { label: "Request a quote or call back", value: "lead_capture" },
  { label: "Book a service or appointment", value: "booking" },
  { label: "Start a free trial", value: "saas_trial" },
  { label: "Book a demo with sales", value: "saas_demo" },
  { label: "Install the app", value: "app_install" },
  { label: "Donate", value: "donation" },
  { label: "Apply or enrol", value: "enrolment" },
  { label: "Wholesale or bulk order enquiry", value: "wholesale_inquiry" },
  { label: "Become a reseller or partner", value: "partner_recruitment" }
];

const BUDGET_BANDS = [
  { label: "No paid budget", value: "none" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" }
];

/* main component */
export default function App() {
  /* state */
  const [country, setCountry] = useState("Australia");
  const [customCountry, setCCountry] = useState("");
  const [sector, setSector] = useState(SECTORS[0]);
  const [customSector, setCSector] = useState("");
  const [goal, setGoal] = useState("online_sales");
  const [customGoal, setCGoal] = useState("");
  const [product, setProduct] = useState("");
  const [segments, setSeg] = useState([]);
  const [segInp, setSegInp] = useState("");
  const [competitors, setComp] = useState([]);
  const [compInp, setCompInp] = useState("");
  const [motion, setMotion] = useState("ecom_checkout");
  const [budgetBand, setBudgetBand] = useState("low");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState("");

  /* refs for custom-input autofocus */
  const ccRef = useRef(null), csRef = useRef(null), cgRef = useRef(null);
  useEffect(() => ccRef.current?.focus(), [country]);
  useEffect(() => csRef.current?.focus(), [sector]);
  useEffect(() => cgRef.current?.focus(), [goal]);

  /* comma→pill helper */
  const onComma = (e, setter, inputSetter, max = 99) => {
    if ((e.key === "," || e.key === "Enter") && e.target.value.trim()) {
      e.preventDefault();
      setter((list) => (list.length < max ? [...list, e.target.value.trim()] : list));
      inputSetter("");
    }
  };

  /* submit */
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
        goal: goal === "__custom_goal" ? customGoal : goal,
        competitors,
        model: "gpt-4o-mini",
        motion,
        budget_band: budgetBand
        // no currency, no numeric budget
      };

      const r = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
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
          <div className="bg-red-200 text-red-800 px-4 py-2 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Country */}
          <Field label="Country">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
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
          <Field label="Sector (optional)">
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {[...SECTORS.map((s) => ({ code: s, label: s })), { code: "__custom_sector", label: "Other (custom)" }].map((s) => (
                <option key={s.code} value={s.code}>{s.label}</option>
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
          <Field label="Offering (product or service)">
            <input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </Field>

          {/* Target segments */}
          <Field label="Target segment(s) – comma or Enter to add (optional)">
            <div>
              {segments.map((s, i) => (
                <Pill key={i} text={s} onRemove={() => setSeg(segments.filter((_, j) => j !== i))} />
              ))}
              <input
                value={segInp}
                onChange={(e) => setSegInp(e.target.value)}
                onKeyDown={(e) => onComma(e, setSeg, setSegInp, 5)}
                className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="e.g., Working parents"
              />
            </div>
          </Field>

          {/* Competitors */}
          <Field label="Competitor(s) – comma or Enter to add (optional)">
            <div>
              {competitors.map((c, i) => (
                <Pill key={i} text={c} onRemove={() => setComp(competitors.filter((_, j) => j !== i))} />
              ))}
              <input
                value={compInp}
                onChange={(e) => setCompInp(e.target.value)}
                onKeyDown={(e) => onComma(e, setComp, setCompInp, 5)}
                className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="e.g., Amazon"
              />
            </div>
          </Field>

          {/* Goal */}
          <Field label="Goal">
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {[...GOALS, { label: "Other (custom)", value: "__custom_goal" }].map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
            {goal === "__custom_goal" && (
              <input
                ref={cgRef}
                value={customGoal}
                onChange={(e) => setCGoal(e.target.value)}
                className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Type your goal"
              />
            )}
          </Field>

          {/* Motion */}
          <Field label="Action wanted">
            <select
              value={motion}
              onChange={(e) => setMotion(e.target.value)}
              className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {MOTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </Field>

          {/* Budget */}
          <Field label="Budget band">
            <select
              value={budgetBand}
              onChange={(e) => setBudgetBand(e.target.value)}
              className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {BUDGET_BANDS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </Field>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !product.trim()}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-md hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-lg"
          >
            {loading ? "🔄 Generating..." : "🚀 Generate Marketing Plan"}
          </button>
        </form>
      </div>

      {/* Results */}
      {result && <Report data={result} />}
    </div>
  );
}
