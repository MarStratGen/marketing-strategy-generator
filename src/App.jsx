/* ──────────────────────────────────────────────────────────
   App.jsx – full file
   Tiny Marketing-Plan Generator (UK English)
   ────────────────────────────────────────────────────────── */
import { useState, useRef, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Report from "./Report.jsx";

/* ----- tiny UI helpers ----- */
const Pill = ({ text, onRemove }) => (
  <span className="inline-flex items-center bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full mr-2 mb-2 border border-gray-200">
    {text}
    <button
      type="button"
      onClick={onRemove}
      className="ml-2 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full text-xs transition-colors"
      title="Remove"
      aria-label={`Remove ${text}`}
    >
      ×
    </button>
  </span>
);

const Field = ({ label, children, tooltip, required, id }) => (
  <div className="space-y-0">
    <label
      htmlFor={id}
      id={id ? `${id}-label` : undefined}
      className="block text-base font-medium text-gray-900 mb-2"
    >
      {label}
      {required && (
        <span className="text-red-500 ml-1" aria-hidden="true">
          *
        </span>
      )}
    </label>
    <div className="space-y-2">
      {tooltip && (
        <p
          id={id ? `${id}-help` : undefined}
          className="text-sm text-gray-600 leading-relaxed"
        >
          {tooltip}
        </p>
      )}
      {children}
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div className="inline-flex items-center">
    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
    <span>Generating Marketing Strategy</span>
  </div>
);

/* ----- constants ----- */
// Build-time environment configuration for reliable development workflow
const API_BASE_URL = (() => {
  const viteApiUrl = import.meta.env.VITE_API_BASE_URL;
  
  // Development guard: fail fast if in development mode without proper API URL
  if (import.meta.env.DEV && !viteApiUrl) {
    throw new Error(
      "DEVELOPMENT ERROR: VITE_API_BASE_URL must be set in Replit Secrets for development testing. " +
      "Add: VITE_API_BASE_URL=https://glow-api-dev-lingering-queen-74b7.cloudflare-4up2f.workers.dev"
    );
  }
  
  return viteApiUrl || "https://api.marketingstratgenerator.com";
})();

// Ensure no double slashes in URL construction
const cleanApiUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
const WORKER_URL = `${cleanApiUrl}/generate`;
const STREAM_URL = `${cleanApiUrl}/stream`;

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
  { label: "Visit a business", value: "store_visit" },
  { label: "Wholesale or bulk enquiry", value: "wholesale_inquiry" },
  { label: "Other (custom)", value: "__custom_motion" },
];

const BUDGET_BANDS = [
  { label: "No paid budget", value: "none" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const BUSINESS_STAGES = [
  { label: "New/Launch", value: "launch" },
  { label: "Established/Growth", value: "growth" },
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
  const [competitor, setComp] = useState("");
  const [motion, setMotion] = useState("ecom_checkout");
  const [customMotion, setCustomMotion] = useState("");
  const [budgetBand, setBudgetBand] = useState("low");
  const [businessStage, setBusinessStage] = useState("growth");

  // Dropdown open states for caret rotation
  const [countryOpen, setCountryOpen] = useState(false);
  const [sectorOpen, setSectorOpen] = useState(false);
  const [businessStageOpen, setBusinessStageOpen] = useState(false);
  const [motionOpen, setMotionOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);

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

  /* ----- pill input handlers ----- */
  // Centralized tokenization function that prevents data loss
  const processTokenizedInput = (inputValue, currentList, max) => {
    if (!inputValue.trim()) {
      return { tokensAdded: [], remainingInput: "", itemsWereAdded: false };
    }

    // Split on commas and clean up tokens
    const allTokens = inputValue
      .split(",")
      .map((token) => token.trim())
      .filter((token) => token.length > 0);

    const availableSlots = Math.max(0, max - currentList.length);
    const tokensToAdd = allTokens.slice(0, availableSlots);
    const overflowTokens = allTokens.slice(availableSlots);

    const remainingInput =
      overflowTokens.length > 0 ? overflowTokens.join(", ") : "";

    return {
      tokensAdded: tokensToAdd,
      remainingInput,
      itemsWereAdded: tokensToAdd.length > 0,
    };
  };

  // Handle comma detection in input - works on all keyboards
  const handlePillInputChange = (e, setter, inpSetter, max = 99) => {
    const value = e.target.value;

    if (value.includes(",")) {
      setter((currentList) => {
        const result = processTokenizedInput(value, currentList, max);

        // Only update input if tokens were processed
        if (
          result.tokensAdded.length > 0 ||
          result.remainingInput !== value.trim()
        ) {
          inpSetter(result.remainingInput);
        }

        // Add the tokens that fit
        if (result.tokensAdded.length > 0) {
          return [...currentList, ...result.tokensAdded];
        }

        return currentList;
      });
    } else {
      // No comma, just update input normally
      inpSetter(value);
    }
  };

  // Handle Enter key
  const handlePillInputKeyDown = (e, setter, inpSetter, max = 99) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.target.value.trim();

      if (value) {
        setter((currentList) => {
          const result = processTokenizedInput(value, currentList, max);

          // Only clear input if items were actually added
          if (result.itemsWereAdded) {
            inpSetter(result.remainingInput);
          }

          // Add the tokens that fit
          if (result.tokensAdded.length > 0) {
            return [...currentList, ...result.tokensAdded];
          }

          return currentList;
        });
      }
    }
  };

  // Handle blur - keep text in input, don't auto-convert to pills
  const handlePillInputBlur = (e, setter, inpSetter, max = 99) => {
    // Do nothing on blur - let users decide when to add pills
    // Users can press Enter or comma to explicitly add pills
  };

  // Flush pending input to pills (used before form submission)
  const flushPendingInput = (inputValue, setter, inpSetter, max = 99) => {
    const value = inputValue.trim();
    if (value) {
      setter((currentList) => {
        const result = processTokenizedInput(value, currentList, max);

        // Only clear input if items were actually added
        if (result.itemsWereAdded) {
          inpSetter(result.remainingInput);
        }

        // Add the tokens that fit
        if (result.tokensAdded.length > 0) {
          return [...currentList, ...result.tokensAdded];
        }

        return currentList;
      });
    }
  };

  /* ----- submit ----- */
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      // Immediately set loading state to prevent double-clicks
      flushSync(() => {
        setErr("");
        setResult(null);
        setLoading(true);
      });

      // Small delay to ensure any pending blur events complete first
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Flush any pending input to pills before validation (synchronously)
      flushSync(() => {
        flushPendingInput(segInp, setSeg, setSegInp, 3);
      });

      // Basic validation
      const finalCountry =
        country === "__custom_country" ? customCountry : country;
      const finalSector = sector === "__custom_sector" ? customSector : sector;

      if (!finalCountry.trim()) {
        flushSync(() => {
          setErr("Please select a country.");
          setLoading(false);
        });
        return;
      }

      if (!offering.trim()) {
        flushSync(() => {
          setErr("Please describe what you're selling.");
          setLoading(false);
        });
        return;
      }

      // Get the most current segments, including any flushed input
      const currentSegments = [...segments];
      if (segInp.trim()) {
        const result = processTokenizedInput(segInp.trim(), segments, 3);
        currentSegments.push(...result.tokensAdded);
      }

      if (!currentSegments || currentSegments.length === 0) {
        flushSync(() => {
          setErr("Please add at least one target segment.");
          setLoading(false);
        });
        return;
      }

      const body = {
        country: finalCountry,
        sector: finalSector,
        product_type: offering,
        audiences: currentSegments,
        competitor: competitor.trim(),

        motion: motion === "__custom_motion" ? "custom" : motion,
        action_custom: motion === "__custom_motion" ? customMotion : undefined,

        budget_band: budgetBand,
        business_stage: businessStage,
      };

      console.log("🚀 === FORM SUBMISSION STARTED ===");
      console.log("🎯 Competitor being sent:", competitor);
      console.log("📋 Full form data:", body);
      console.log("🌐 Making request to URL:", WORKER_URL);

      // Create fetch with timeout helper
      const fetchWithTimeout = async (url, options, timeout = 90000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          if (error.name === "AbortError") {
            throw new Error("Request timed out after 90 seconds");
          }
          throw error;
        }
      };

      // Make direct API request (no streaming)
      try {
        console.log("Making request to:", WORKER_URL);

        const response = await fetchWithTimeout(WORKER_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        console.log("Response status:", response.status);
        console.log(
          "Response headers:",
          Object.fromEntries(response.headers.entries()),
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API response error:", errorText);
          throw new Error(
            `Request failed: ${response.status} - ${errorText || "No error details"}`,
          );
        }

        // Handle JSON response
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        console.log("✅ === API RESPONSE RECEIVED ===");
        console.log("📦 Full response data:", data);

        if (data.market_foundation) {
          console.log("🏢 Market foundation content:", data.market_foundation);
          // Check if competitor appears anywhere in market foundation
          const foundCompetitor =
            competitor.trim() &&
            data.market_foundation
              .toLowerCase()
              .includes(competitor.toLowerCase().trim());
          console.log(
            "🔍 Competitor found in market foundation:",
            foundCompetitor ? [competitor] : [],
          );
          console.log(
            "❓ Missing competitor:",
            foundCompetitor ? [] : [competitor],
          );
        }

        if (data.competitors_brief) {
          console.log("📊 Competitors brief content:", data.competitors_brief);
          // Check if competitor appears in competitors_brief
          const foundInBrief =
            competitor.trim() &&
            data.competitors_brief
              .toLowerCase()
              .includes(competitor.toLowerCase().trim());
          console.log(
            "🔍 Competitor found in brief:",
            foundInBrief ? [competitor] : [],
          );
          console.log(
            "❓ Missing from brief:",
            foundInBrief ? [] : [competitor],
          );
        }

        setResult(data);
      } catch (err) {
        console.error("Form submission error:", err);
        const errorMessage = err.message || "Something went wrong.";

        // Handle specific error types with better user messages
        if (
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("fetch")
        ) {
          setErr(
            "Unable to connect to our servers. Please check your internet connection and try again. If the problem persists, our service may be temporarily unavailable.",
          );
        } else if (
          errorMessage.includes("timed out") ||
          errorMessage.includes("timeout")
        ) {
          setErr(
            "The request is taking longer than expected. Please try again with a simpler description or check your internet connection.",
          );
        } else if (
          errorMessage.includes("CORS") ||
          errorMessage.includes("cors")
        ) {
          setErr(
            "Connection blocked by browser security. Please try refreshing the page and submitting again.",
          );
        } else if (
          errorMessage.includes("meaningful description") ||
          errorMessage.includes("detailed description")
        ) {
          setErr(
            "Please provide a clear, meaningful description of your business offering.",
          );
        } else if (
          errorMessage.includes("guidelines") ||
          errorMessage.includes("appropriate business information")
        ) {
          setErr(
            "Please ensure your business information follows our content guidelines.",
          );
        } else if (errorMessage.includes("valid business sector")) {
          setErr("Please select or enter a valid business sector.");
        } else if (
          errorMessage.includes("api_key") ||
          errorMessage.includes("OPENAI_API_KEY")
        ) {
          setErr(
            "API configuration issue. Please contact support if this persists.",
          );
        } else if (
          errorMessage.includes("rate_limit") ||
          errorMessage.includes("quota")
        ) {
          setErr(
            "Service temporarily busy. Please wait a moment and try again.",
          );
        } else if (
          errorMessage.includes("500") ||
          errorMessage.includes("502") ||
          errorMessage.includes("503")
        ) {
          setErr(
            "Our servers are experiencing issues. Please try again in a few moments.",
          );
        } else {
          setErr(`Error: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
      }
    },
    [
      country,
      customCountry,
      sector,
      customSector,
      offering,
      segments,
      segInp,
      competitor,
      motion,
      customMotion,
      budgetBand,
      businessStage,
    ],
  );

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
          backgroundPosition: "center",
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
              Create a marketing strategy with AI-powered insights*
            </p>
          </div>

          {/* ---------- form card ---------- */}
          <div className="bg-white rounded-3xl shadow-xl p-10 max-w-lg mx-auto border border-gray-100 mb-20">
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="bg-red-50 border border-red-200 text-red-700 font-medium text-base px-4 py-3 rounded-lg mb-6"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* country */}
              <Field
                label="Which country are you targeting?"
                required
                id="country"
              >
                <div className="relative">
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    onClick={() => setCountryOpen(!countryOpen)}
                    onBlur={() => setCountryOpen(false)}
                    aria-describedby="country-help"
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 min-h-[44px] appearance-none cursor-pointer"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${countryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {country === "__custom_country" && (
                  <input
                    ref={ccRef}
                    value={customCountry}
                    onChange={(e) => setCCountry(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 mt-3 min-h-[44px]"
                    placeholder="Type your country"
                    aria-labelledby="country-label"
                    aria-describedby="country-help"
                    required
                  />
                )}
              </Field>

              {/* sector */}
              <Field
                label="Your sector"
                id="sector"
              >
                <div className="relative">
                  <select
                    id="sector"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    onClick={() => setSectorOpen(!sectorOpen)}
                    onBlur={() => setSectorOpen(false)}
                    aria-describedby="sector-help"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 min-h-[44px] appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      Choose your sector (optional)
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
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${sectorOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {sector === "__custom_sector" && (
                  <input
                    ref={csRef}
                    value={customSector}
                    onChange={(e) => setCSector(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 mt-3 min-h-[44px]"
                    placeholder="Type your sector"
                    aria-labelledby="sector-label"
                    aria-describedby="sector-help"
                  />
                )}
              </Field>

              {/* offering */}
              <Field
                label="Offering (product or service)"
                required
                tooltip="Keep it short for faster results"
                id="offering"
              >
                <input
                  id="offering"
                  value={offering}
                  onChange={(e) => setOffering(e.target.value)}
                  aria-describedby="offering-help"
                  aria-required="true"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 min-h-[44px]"
                  placeholder="e.g. Organic seed kits"
                  required
                />
              </Field>

              {/* business stage */}
              <Field
                label="Business stage"
                required
                id="business-stage"
              >
                <div className="relative">
                  <select
                    id="business-stage"
                    value={businessStage}
                    onChange={(e) => setBusinessStage(e.target.value)}
                    onClick={() => setBusinessStageOpen(!businessStageOpen)}
                    onBlur={() => setBusinessStageOpen(false)}
                    aria-describedby="business-stage-help"
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 min-h-[44px] appearance-none cursor-pointer"
                  >
                    {BUSINESS_STAGES.map((stage) => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${businessStageOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </Field>

              {/* segments */}
              <Field
                label="Target segment(s)"
                tooltip="Max 3; under 10 words each"
                required
                id="segments"
              >
                <div className="mb-1">
                  {segments.map((s, i) => (
                    <Pill
                      key={i}
                      text={s}
                      onRemove={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSeg(segments.filter((_, j) => j !== i));
                      }}
                    />
                  ))}
                </div>
                <input
                  id="segments"
                  value={segInp}
                  onChange={(e) =>
                    handlePillInputChange(e, setSeg, setSegInp, 3)
                  }
                  onKeyDown={(e) =>
                    handlePillInputKeyDown(e, setSeg, setSegInp, 3)
                  }
                  onBlur={(e) => handlePillInputBlur(e, setSeg, setSegInp, 3)}
                  aria-describedby="segments-help"
                  aria-required="true"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 min-h-[44px]"
                  placeholder="e.g. Home gardeners 35-55"
                />
              </Field>

              {/* motion */}
              <Field
                label="Primary action"
                required
                tooltip="Choose the main customer action"
                id="motion"
              >
                <div className="relative">
                  <select
                    id="motion"
                    value={motion}
                    onChange={(e) => setMotion(e.target.value)}
                    onClick={() => setMotionOpen(!motionOpen)}
                    onBlur={() => setMotionOpen(false)}
                    aria-describedby="motion-help"
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 min-h-[44px] appearance-none cursor-pointer"
                  >
                    {MOTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${motionOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {motion === "__custom_motion" && (
                  <input
                    value={customMotion}
                    onChange={(e) => setCustomMotion(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 mt-3 min-h-[44px]"
                    placeholder="e.g. Call to book"
                    aria-labelledby="motion-label"
                    aria-describedby="motion-help"
                    required
                  />
                )}
              </Field>

              {/* budget */}
              <Field
                label="Budget level"
                required
                id="budget"
              >
                <div className="relative">
                  <select
                    id="budget"
                    value={budgetBand}
                    onChange={(e) => setBudgetBand(e.target.value)}
                    onClick={() => setBudgetOpen(!budgetOpen)}
                    onBlur={() => setBudgetOpen(false)}
                    aria-describedby="budget-help"
                    required
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 min-h-[44px] appearance-none cursor-pointer"
                  >
                    {BUDGET_BANDS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${budgetOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </Field>

              {/* competitors */}
              <Field
                label="Top competitor"
                id="competitor"
              >
                <input
                  id="competitor"
                  value={competitor}
                  onChange={(e) => setComp(e.target.value)}
                  aria-describedby="competitor-help"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 focus:bg-white transition-all duration-200 text-gray-700 min-h-[44px]"
                  placeholder="e.g. Amazon"
                />
              </Field>

              {/* submit */}
              <button
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-60 shadow-lg hover:shadow-xl mt-8"
              >
                {loading ? <LoadingSpinner /> : "Generate Marketing Strategy"}
              </button>
              <p className="text-sm text-gray-500 text-center mt-2">
                Usually takes 20-90 seconds • Shorter inputs = faster results
              </p>
            </form>
          </div>

          {/* report */}
          <Report plan={result} loading={loading} />
        </div>
      </div>

      {/* FAQ Section - Solid Background */}
      <div className="bg-gray-100 py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How does the Marketing Strategy Generator work?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                This page turns your inputs into a clear brief and sends it to
                the OpenAI API to draft a comprehensive marketing strategy. The strategy
                includes classic frameworks like the 7 Ps of marketing, detailed customer
                personas, channel recommendations, budget allocation guidance, a 90-day
                action plan, and KPI frameworks. You get the complete strategy on screen.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Who is the Marketing Strategy Generator for?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Founders and small teams, who want a structured plan
                they can act on. It works for product and service businesses,
                online and offline, B2C and B2B. Treat it as guidance, not
                professional advice. AI can draft quickly, but a real marketer
                will still make better calls where context, trade offs, and
                judgement matter.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is this enough on its own?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                No. Use it as version one. Validate the ideas with customers, run
                small tests, measure results, and iterate. When stakes are high,
                ask a real marketer to sanity check the plan and tailor it to
                your budget, brand, and operations.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is my business information kept private?
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Your form inputs are processed to generate your strategy and are not 
                stored by this page after the response is returned. Inputs are sent to the OpenAI
                API solely to create the draft and may be briefly retained by
                that provider for security or operations. This site uses Google Analytics
                to track usage patterns and improve the service. Please do not submit
                sensitive or personal information.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 border-t border-gray-700">
        <div className="max-w-4xl mx-auto px-6">
          {/* Coffee Support Section */}
          <div className="text-center mb-10">
            <p className="text-gray-300 text-base font-medium mb-4 leading-relaxed">
              This generator is free. If it helped, you can shout me a coffee.
            </p>
            <div className="flex justify-center">
              <a href="https://www.buymeacoffee.com/marstrat" target="_blank">
                <img
                  src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
                  alt="Buy Me A Coffee"
                  className="transition-transform duration-200 hover:scale-105"
                  style={{ height: "48px", width: "174px" }}
                />
              </a>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-center border-t border-gray-700/50 pt-8">
            <p className="text-xs text-gray-500 leading-relaxed max-w-3xl mx-auto">
              *The marketing strategies generated by this tool are for guidance
              and educational purposes only. They are based on general marketing
              principles and frameworks, not specific market research or
              real-time data analysis. While the strategies follow proven
              methodologies, we recommend conducting your own market research,
              testing assumptions, and adapting recommendations to your specific
              circumstances before implementation. Always verify claims,
              validate assumptions, and consider seeking professional marketing
              consultation for significant business decisions or large budget
              allocations.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
