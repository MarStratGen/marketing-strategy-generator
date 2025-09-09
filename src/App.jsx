import { useState, useRef, useEffect } from "react";
import Report from "./Report.jsx";

/* tiny UI helpers */
const Pill = ({ text, onRemove }) => (
  <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-1 mb-1">
    {text}
    <button onClick={onRemove} className="ml-1">
      ×
    </button>
  </span>
);
const Field = ({ label, children }) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {children}
  </div>
);

/* constants */
const WORKER_URL =
  "https://glow-api-lingering-queen-74b7.cloudflare-4up2f.workers.dev/generate";

const COUNTRIES = [
  { label: "Australia", code: "Australia", currency: "AUD" },
  { label: "Canada", code: "Canada", currency: "CAD" },
  { label: "New Zealand", code: "New Zealand", currency: "NZD" },
  { label: "United Kingdom", code: "United Kingdom", currency: "GBP" },
  { label: "United States", code: "United States", currency: "USD" },
  { label: "Other (custom)", code: "__custom_country", currency: "USD" },
];
const currencyOf = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c.currency]),
);

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

const GOALS = [
  { label: "Brand awareness", value: "brand_awareness" },
  { label: "Online sales", value: "online_sales" },
  { label: "Lead generation", value: "lead_gen" },
  { label: "In-store sales", value: "in-store_sales" },
  { label: "User retention", value: "user_retention" },
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
  const [budget, setBudget] = useState(100);
  const [segments, setSeg] = useState([]);
  const [segInp, setSegInp] = useState("");
  const [competitors, setComp] = useState([]);
  const [compInp, setCompInp] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState("");

  /* refs for custom-input autofocus */
  const ccRef = useRef(null),
    csRef = useRef(null),
    cgRef = useRef(null);
  useEffect(() => ccRef.current?.focus(), [country]);
  useEffect(() => csRef.current?.focus(), [sector]);
  useEffect(() => cgRef.current?.focus(), [goal]);

  /* comma→pill helper */
  const onComma = (e, setter, inputSetter, max = 99) => {
    if ((e.key === "," || e.key === "Enter") && e.target.value.trim()) {
      e.preventDefault();
      setter((list) =>
        list.length < max ? [...list, e.target.value.trim()] : list,
      );
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
        currency: currencyOf[country] || "USD",
        sector: sector === "__custom_sector" ? customSector : sector,
        product_type: product,
        audiences: segments,
        goal: goal === "__custom_goal" ? customGoal : goal,
        budget,
        competitors,
        model: "gpt-4o-mini",
      };

      const r = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      console.log("Worker returned →", data); // <-- now you see what comes back
      setResult(data);
    } catch (err) {
      console.error(err);
      setErr("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
      w-full max-w-md bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl p-8"
    >
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
        <Field label="Country">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
        <Field label="Sector (optional)">
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
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
        <Field label="Offering (product or service)">
          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
        </Field>

        {/* Segments */}
        <Field label="Target segment(s) – comma to add (optional)">
          <div>
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
            className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Type segment, comma to add"
          />
        </Field>

        {/* Goal */}
        <Field label="Primary goal">
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {[
              ...GOALS,
              { label: "Other (custom)", value: "__custom_goal" },
            ].map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
          {goal === "__custom_goal" && (
            <input
              ref={cgRef}
              value={customGoal}
              onChange={(e) => setCGoal(e.target.value)}
              className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Describe your goal"
            />
          )}
        </Field>

        {/* Budget */}
        <Field label={`Monthly budget (${currencyOf[country] || "USD"})`}>
          <input
            type="number"
            min="10"
            value={budget}
            onChange={(e) => setBudget(+e.target.value)}
            className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </Field>

        {/* Competitors */}
        <Field label="Top competitors – comma to add, max 3 (optional)">
          <div>
            {competitors.map((c, i) => (
              <Pill
                key={i}
                text={c}
                onRemove={() => setComp(competitors.filter((_, j) => j !== i))}
              />
            ))}
          </div>
          <input
            value={compInp}
            onChange={(e) => setCompInp(e.target.value)}
            onKeyDown={(e) => onComma(e, setComp, setCompInp, 3)}
            className="w-full mt-1 mb-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Type name, comma to add"
          />
        </Field>

        <button
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition-colors"
        >
          {loading ? "Thinking…" : "Generate Plan"}
        </button>
      </form>

      <Report plan={result} />
    </div>
  );
}
