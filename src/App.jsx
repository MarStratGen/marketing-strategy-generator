/* ──────────────────────────────────────────────────────────
   App.jsx – full file
   Tiny Marketing-Plan Generator (UK English)
   ────────────────────────────────────────────────────────── */
import { useState, useRef, useEffect } from "react";
import Report from "./Report.jsx";

/* ----- tiny UI helpers ----- */
const Pill = ({ text, onRemove }) => (
  <span className="inline-flex items-center bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full mr-2 mb-2 border border-gray-200">
    {text}
    <button
      onClick={onRemove}
      className="ml-2 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full text-xs transition-colours"
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
  <div className="inline-flex items-centre">
    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
    <span>Creating your marketing strategy…</span>
  </div>
);

/* ----- constants ----- */
const WORKER_URL =
  "https://glow-api-lingering-queen-74b7.cloudflare-4up2f.workers.dev/generate";

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
  { label: "Request a quote or call-back", value: "lead_capture" },
  { label: "Start a free trial", value: "saas_trial" },
  { label: "Visit a shop or stockist", value: "store_visit" },
  { label: "Wholesale or bulk enquiry", value: "wholesale_inquiry" },
  { label: "Other (custom)", value: "__custom_motion" },
];

const BUDGET_BANDS = [
  { label: "No paid budget", value: "none" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

/* ──────────────────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────────────────── */
export default function App() {
  /* ----- form state ----- */
  const [country, setCountry] = useState("Australia");
  const [customCountry, setCCountry] = useState("");
  const [sector, setSector] = useState("");
  const [customSector, setCSector] = useState("");
  const [offering, setOffering] = useState("");
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

  /* ----- autofocus helpers for custom fields ----- */
  const ccRef = useRef(null);
  const csRef = useRef(null);

  useEffect(() => {
    if (country === "__custom_country") ccRef.current?.focus();
  }, [country]);

  useEffect(() => {
    if (sector === "__custom_sector") csRef.current?.focus();
  }, [sector]);

  /* ----- comma / Enter → pill ----- */
  const onComma = (e, setter, inpSetter, max = 99) => {
    const v = e.target.value.trim();
    if ((e.key === "," || e.key === "Enter") && v) {
      e.preventDefault();
      setter((list) => (list.length < max ? [...list, v] : list));
      inpSetter("");
    }
  };

  /* ----- submit ----- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setResult(null);
    setLoading(true);

    // Basic validation
    const finalCountry = country === "__custom_country" ? customCountry : country;
    const finalSector = sector === "__custom_sector" ? customSector : sector;
    
    if (!finalCountry.trim()) {
      setErr("Please select a country.");
      setLoading(false);
      return;
    }
    
    if (!finalSector.trim()) {
      setErr("Please select a sector.");
      setLoading(false);
      return;
    }
    
    if (!offering.trim()) {
      setErr("Please describe what you're selling.");
      setLoading(false);
      return;
    }

    try {
      const body = {
        country: finalCountry,
        sector: finalSector,
        product_type: offering,
        audiences: segments,
        competitors,
        model: "gpt-4o-mini",

        motion: motion === "__custom_motion" ? "custom" : motion,
        action_custom: motion === "__custom_motion" ? customMotion : undefined,

        budget_band: budgetBand,
      };

      console.log("Submitting with body:", body);
      
      const r = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      console.log("Response status:", r.status);
      
      if (!r.ok) {
        const errorText = await r.text();
        console.error("API Error:", errorText);
        throw new Error(`API returned ${r.status}: ${errorText}`);
      }

      const data = await r.json();
      console.log("Response data:", data);
      
      // Check if the response contains actual marketing strategy data
      if (!data || Object.keys(data).length === 0) {
        throw new Error("API returned empty response. The Cloudflare Worker might not be properly configured.");
      }
      
      // Check for expected structure (adjust based on your Worker's response format)
      if (!data.strategy && !data.content && !data.marketing_plan) {
        console.warn("Unexpected response structure:", data);
        throw new Error("API returned unexpected data format. Please check the Cloudflare Worker implementation.");
      }
      
      setResult(data);
    } catch (err) {
      console.error(err);
      setErr(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────────────────────────── render ─── */
  return (
    <div>
      {/* Hero with photo + gradient */}
      <div
        className="min-h-screen relative"
        style={{
          backgroundImage:
            "url('/birmingham-museums-trust-YvNiIyGdMfs-unsplash_1757466351093.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "centre",
          backgroundAttachment: "fixed",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom right, rgba(37,99,235,.85), rgba(147,51,234,.85), rgba(219,39,119,.85))",
          }}
        ></div>

        <div className="relative z-10 py-16 px-4">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
              Marketing Strategy Generator
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Create comprehensive go-to-market strategies with AI-powered
              insights*
            </p>
          </div>

          {/* ---------- form card ---------- */}
          <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg mx-auto border border-gray-100 mb-20">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-7">
              {/* country */}
              <Field
                label="Which country are you targeting?"
                required
                tooltip="This tailors regional insights and seasonality."
              >
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700"
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 mt-3"
                    placeholder="Type your country"
                  />
                )}
              </Field>

              {/* sector */}
              <Field
                label="Sector"
                tooltip="If yours isn’t listed, choose Other."
              >
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700"
                >
                  <option value="" disabled>
                    Choose your industry (optional)
                  </option>
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 mt-3"
                    placeholder="Type your sector"
                  />
                )}
              </Field>

              {/* offering */}
              <Field
                label="Offering (product or service)"
                required
                tooltip="The more specific, the better the recommendations."
              >
                <input
                  value={offering}
                  onChange={(e) => setOffering(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700"
                  placeholder="e.g. Organic seed kits, AI project-management software"
                  required
                />
              </Field>

              {/* segments */}
              <Field
                label="Target segment(s)"
                tooltip="Type a segment and press comma or Enter to add (max 3)."
              >
                <div className="mb-1">
                  {segments.map((s, i) => (
                    <Pill
                      key={i}
                      text={s}
                      onRemove={() =>
                        setSeg(segments.filter((_, j) => j !== i))
                      }
                    />
                  ))}
                </div>
                <input
                  value={segInp}
                  onChange={(e) => setSegInp(e.target.value)}
                  onKeyDown={(e) => onComma(e, setSeg, setSegInp, 3)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700"
                  placeholder="e.g. Home gardeners aged 35-55"
                />
              </Field>

              {/* motion */}
              <Field
                label="Primary action"
                required
                tooltip="Pick the main action you want customers to take."
              >
                <select
                  value={motion}
                  onChange={(e) => setMotion(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700"
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 mt-3"
                    placeholder="Describe the action (e.g. Call to book)"
                    required
                  />
                )}
              </Field>

              {/* budget */}
              <Field
                label="Budget level"
                required
                tooltip="The plan uses percentages so you can scale up or down."
              >
                <select
                  value={budgetBand}
                  onChange={(e) => setBudgetBand(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  {BUDGET_BANDS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </Field>

              {/* competitors */}
              <Field
                label="Top competitors"
                tooltip="Optional – up to three. Type a name, press comma or Enter."
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700"
                  placeholder="e.g. Amazon, Local garden centre"
                />
              </Field>

              {/* submit */}
              <button
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-60 shadow-lg hover:shadow-xl mt-8"
              >
                {loading ? <LoadingSpinner /> : "Generate Marketing Plan"}
              </button>
            </form>
          </div>

          {/* report */}
          <Report plan={result} loading={loading} />
        </div>
      </div>

      {/* FAQ + footer identical to previous version */}
    </div>
  );
}
