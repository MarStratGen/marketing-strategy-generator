/*  ─────────────────────────────────────────────
    Marketing Strategy Generator Worker
    ───────────────────────────────────────────── */
const MODEL = "gpt-4o";

const EXAMPLES = [
`**Market Foundation**

**Market Overview**
The Australian seed market is diverse, with various offerings catering to gardening enthusiasts and agricultural professionals alike.

**Customer Behaviour Insights**
• **Seasonal purchasing patterns** - Peak demand during spring planting season (September-November)
• **Research-driven buyers** - Customers spend 2-3 weeks researching before purchase
• **Quality-focused decision making** - 78% prioritise germination rates over price

**Key Market Trends**
• **Organic movement** - 45% increase in organic seed demand year-over-year
• **Small-space gardening** - Urban dwellers driving container gardening growth
• **Educational content consumption** - Video tutorials influence 60% of purchases

Why this matters: Understanding these patterns allows for targeted timing and messaging.
How to execute: Align marketing campaigns with seasonal peaks and create educational content.`,

`**Budget Allocation**

**Primary Channels**
• **Search ads: 45%** - Capture high-intent traffic for immediate conversions
• **Paid social: 30%** - Build awareness and drive consideration across demographics
• **Content marketing: 15%** - Educational content for nurturing and retention
• **Email marketing: 10%** - Customer lifecycle management and repeat purchases

**Allocation Rationale**
• Search captures bottom-funnel demand when customers are ready to buy
• Social media builds the top-funnel awareness needed for market expansion
• Content establishes authority and supports organic discovery
• Email maximises customer lifetime value through retention campaigns

**Competitor Analysis: SeedCo**
• **Strengths:** Strong brand recognition, extensive product range, established retail partnerships
• **Weaknesses:** Higher price points, limited digital presence, slow innovation cycles
• **Share of voice:** 20% of market conversation
• **Opportunity:** Target their price-sensitive customers with value positioning`
];

export default {
  async fetch(req, env) {
    /* 1. CORS pre-flight */
    if (req.method === "OPTIONS") return new Response(null, cors());

    /* 2. only POST /generate */
    const url = new URL(req.url);
    if (req.method !== "POST" || url.pathname !== "/generate") {
      return new Response(
        JSON.stringify({ ok: true, routes: ["/generate"] }),
        cors()
      );
    }

    /* 3. read JSON body */
    let form;
    try { form = await req.json(); }
    catch { return new Response(JSON.stringify({ error:"bad_json"}), cors(400)); }

    /* ─── lookup helpers ─── */
    const channelByMotion = {
      ecom_checkout: [
        { channel: "Search", intent: "High", role: "Capture" },
        { channel: "Paid social", intent: "Mid", role: "Spark demand" }
      ],
      saas_checkout: [
        { channel: "Search", intent: "High", role: "Capture" },
        { channel: "Paid social", intent: "Mid", role: "Scale" }
      ],
      marketplace_checkout: [
        { channel: "Marketplace ads", intent: "High", role: "Capture" },
        { channel: "Search", intent: "Mid", role: "Assist" }
      ],
      store_visit: [
        { channel: "Local search", intent: "High", role: "Drive visits" },
        { channel: "Maps/GBP", intent: "High", role: "Presence" }
      ],
      call_now: [
        { channel: "Call-extensions search", intent: "High", role: "Click to call" },
        { channel: "Local search", intent: "High", role: "Capture" }
      ],
      lead_capture: [
        { channel: "Search", intent: "High", role: "Capture" },
        { channel: "Retargeting", intent: "Mid", role: "Nudge" }
      ],
      booking: [
        { channel: "Search", intent: "High", role: "Capture" },
        { channel: "Local social", intent: "Mid", role: "Presence" }
      ],
      saas_trial: [
        { channel: "Search", intent: "High", role: "Capture" },
        { channel: "Content/SEO", intent: "Mid", role: "Educate" }
      ],
      saas_demo: [
        { channel: "Search", intent: "High", role: "Capture" },
        { channel: "LinkedIn", intent: "Mid", role: "Target accounts" }
      ],
      app_install: [
        { channel: "App store ads", intent: "High", role: "Convert" },
        { channel: "Paid social", intent: "Mid", role: "Scale" }
      ],
      donation: [
        { channel: "Search", intent: "High", role: "Capture intent" },
        { channel: "Email", intent: "Mid", role: "Appeal" }
      ],
      wholesale_inquiry: [
        { channel: "Search", intent: "High", role: "Capture B2B" },
        { channel: "LinkedIn", intent: "Mid", role: "Prospect" }
      ],
      partner_recruitment: [
        { channel: "Search", intent: "High", role: "Capture partners" },
        { channel: "Partnership outreach", intent: "Mid", role: "Recruit" }
      ]
    };

    const defaultGoalByMotion = {
      ecom_checkout: "Online orders",
      saas_checkout: "Paid subscriptions",
      marketplace_checkout: "Marketplace orders", 
      store_visit: "In-store sales",
      call_now: "Bookings",
      lead_capture: "Qualified leads",
      booking: "Bookings",
      saas_trial: "Qualified leads",
      saas_demo: "Meetings booked",
      app_install: "Installs with activation",
      donation: "Donations",
      wholesale_inquiry: "Wholesale purchase orders",
      partner_recruitment: "Partner sign-ups",
      custom: "Goal aligned to custom action"
    };

    /* Fixed helper functions */
    function applyMotionDefaults(report, form) {
      if (!report || typeof report !== "object") {
        report = {};
      }

      if (typeof report.budget !== "object" || report.budget === null || Array.isArray(report.budget)) {
        report.budget = {};
      }

      const isCustom = form.motion === "custom";
      if (!isCustom && (!Array.isArray(report.channel_playbook) || report.channel_playbook.length === 0)) {
        report.channel_playbook = channelByMotion[form.motion] || [];
      }

      report.budget.band = form.budget_band || report.budget.band || "Low";
      return report;
    }

    function stripCurrencyAndAmounts(report) {
      if (!report || typeof report !== "object") {
        return report;
      }

      const walk = (obj) => {
        if (!obj || typeof obj !== "object") return;
        
        for (const k of Object.keys(obj)) {
          const v = obj[k];
          
          if (v && typeof v === "object" && !Array.isArray(v)) {
            walk(v);
          }
          
          if (["amount", "currency", "cost", "budget_total", "price", "spend", "investment", "fee", "payment"].includes(k)) {
            delete obj[k];
          }
          
          if (typeof v === "string") {
            obj[k] = v.replace(/[£$€₹¥¢₽₨₩₪₡₦₴₵₸₼]/g, "")
                     .replace(/\b\d+\s*(pounds?|dollars?|euros?|cents?|pence|quid)\b/gi, "")
                     .replace(/\b£\d+|\$\d+|€\d+\b/g, "")
                     .replace(/\bcost[s]?\s*[:=]\s*[\d,]+/gi, "")
                     .replace(/\bbudget[s]?\s*[:=]\s*[\d,]+/gi, "")
                     .replace(/\bspend[s]?\s*[:=]\s*[\d,]+/gi, "");
          }
        }
      };
      
      walk(report);
      return report;
    }

    /* ─── build prompt ─── */
    const hintChannels = JSON.stringify(channelByMotion[form.motion] || []);

    const derivedGoal =
      form.motion === "custom" && form.action_custom
        ? `Goal aligned to: ${form.action_custom}`
        : defaultGoalByMotion[form.motion] || "Goal aligned to main action";

    const customLine =
      form.motion === "custom" && form.action_custom
        ? `Custom main action: ${form.action_custom}\n`
        : "";

    let competitorLine = "";
    let competitorAnalysisInstructions = "";
    if (Array.isArray(form.competitors) && form.competitors.length) {
      competitorLine = `Competitors: ${form.competitors.join(", ")}`;
      competitorAnalysisInstructions = `CRITICAL: You MUST prominently feature and analyze these specific competitors: ${form.competitors.join(", ")}. Include them by name in the competitors_brief section and reference them throughout other sections. Do not ignore or generalize these competitors.`;
    } else {
      competitorLine = "Competitors: None specified";
      competitorAnalysisInstructions = "No specific competitors provided. Analyze the general competitive landscape.";
    }

    let prompt = `You are Mark Ritson meets Philip Kotler - the world's leading marketing strategist. Write in British English with proper sentence case. Use structured content with headings, bullet points, and clear formatting - NOT wall-of-text paragraphs.

**CRITICAL FORMATTING REQUIREMENTS:**
- Use **bold headings** for sub-sections
- Use bullet points (•) for lists and key insights
- Include "Why this matters:" and "How to execute:" sections
- NO currency symbols anywhere - percentages only for budgets
- Proper sentence case throughout
- Well-structured, scannable content with clear hierarchy

**COMPETITOR ANALYSIS REQUIREMENT:**
${competitorAnalysisInstructions}

INPUT DATA:
Country: ${form.country}
Sector: ${form.sector}
Offering: ${form.product_type}
Target segments: ${Array.isArray(form.audiences) && form.audiences.length ? form.audiences.join(", ") : "General market"}
Primary goal: ${derivedGoal}
Main action: ${form.motion}
${customLine}Budget level: ${form.budget_band || "Low"}
${competitorLine}

STRATEGIC HINTS:
Channel intent map: ${hintChannels}

REQUIRED JSON STRUCTURE WITH EXACT FIELD NAMES:

{
  "meta": {
    "title": "Marketing Strategy Report",
    "country": "${form.country}",
    "sector": "${form.sector}",
    "goal": "${derivedGoal}"
  },
  "introduction": "**Executive Summary**\\n\\n**Strategic Overview**\\n• Key opportunity areas\\n• Primary recommendations\\n• Expected outcomes\\n\\n**Why this matters:** Context\\n**How to execute:** Implementation approach",
  
  "market_foundation": "**Market Overview**\\n• Market size and growth trends\\n• Key dynamics and forces\\n\\n**Customer Behaviour Insights**\\n• Purchasing patterns\\n• Decision-making factors\\n• Pain points and motivations\\n\\n**Market Opportunities**\\n• Underserved segments\\n• Emerging trends\\n• Growth areas\\n\\n**Why this matters:** Strategic context\\n**How to execute:** Action steps",
  
  "strategy_pillars": "**Pillar 1: [Name]**\\n• Strategic focus\\n• Key activities\\n• Success metrics\\n\\n**Pillar 2: [Name]**\\n• Strategic focus\\n• Key activities\\n• Success metrics\\n\\n**Pillar 3: [Name]**\\n• Strategic focus\\n• Key activities\\n• Success metrics\\n\\n**Why this matters:** Strategic importance\\n**How to execute:** Implementation roadmap",
  
  "personas": "**Primary Persona: [Name]**\\n• Demographics and psychographics\\n• Pain points and challenges\\n• Goals and motivations\\n• Preferred channels\\n\\n**Secondary Persona: [Name]**\\n• Demographics and psychographics\\n• Pain points and challenges\\n• Goals and motivations\\n• Preferred channels\\n\\n**Tertiary Persona: [Name]**\\n• Demographics and psychographics\\n• Pain points and challenges\\n• Goals and motivations\\n• Preferred channels",
  
  "competitors_brief": "**[Competitor Name]**\\n• Strengths and advantages\\n• Weaknesses and vulnerabilities\\n• Market positioning\\n• Share of voice\\n• Competitive threats\\n\\n**[Additional Competitors]**\\n• Analysis for each named competitor\\n\\n**Competitive Landscape Summary**\\n• Market dynamics\\n• Competitive gaps\\n• Positioning opportunities\\n\\n**Why this matters:** Competitive context\\n**How to execute:** Competitive response strategy",
  
  "differentiation_moves": "**Core Differentiation Strategy**\\n• Unique value proposition\\n• Key differentiators\\n• Competitive advantages\\n\\n**Positioning Tactics**\\n• Against [Competitor Name]\\n• Against [Competitor Name]\\n• Market positioning approach\\n\\n**Messaging Framework**\\n• Core messages\\n• Proof points\\n• Communication strategy\\n\\n**Why this matters:** Differentiation importance\\n**How to execute:** Positioning implementation",
  
  "marketing_mix_7ps": "**Product**\\n• Product strategy\\n• Features and benefits\\n• Product development priorities\\n\\n**Price**\\n• Pricing strategy\\n• Competitive pricing analysis\\n• Value communication\\n\\n**Place**\\n• Distribution channels\\n• Channel strategy\\n• Market access approach\\n\\n**Promotion**\\n• Promotional strategy\\n• Communication channels\\n• Campaign approach\\n\\n**People**\\n• Target audiences\\n• Customer service strategy\\n• Team requirements\\n\\n**Process**\\n• Customer journey\\n• Service delivery\\n• Operational excellence\\n\\n**Physical Evidence**\\n• Brand assets\\n• Customer touchpoints\\n• Credibility factors",
  
  "channel_playbook": "**Primary Channels**\\n• [Channel]: Role, audience, tactics\\n• [Channel]: Role, audience, tactics\\n• [Channel]: Role, audience, tactics\\n\\n**Secondary Channels**\\n• [Channel]: Role, audience, tactics\\n• [Channel]: Role, audience, tactics\\n\\n**Channel Integration Strategy**\\n• Cross-channel approach\\n• Customer journey mapping\\n• Attribution strategy\\n\\n**Why this matters:** Channel importance\\n**How to execute:** Channel activation plan",
  
  "budget": {
    "band": "${form.budget_band || "Low"}",
    "allocation": "**Primary Allocation**\\n• [Channel]: [X]% - Rationale\\n• [Channel]: [X]% - Rationale\\n• [Channel]: [X]% - Rationale\\n\\n**Secondary Allocation**\\n• [Channel]: [X]% - Rationale\\n• [Channel]: [X]% - Rationale\\n\\n**Allocation Rationale**\\n• Strategic reasoning\\n• Expected returns\\n• Risk considerations"
  },
  
  "calendar_next_90_days": "**Month 1: Foundation**\\n• Week 1: Setup activities\\n• Week 2: Launch preparations\\n• Week 3: Initial campaigns\\n• Week 4: Optimization\\n\\n**Month 2: Scaling**\\n• Week 5-6: Scale activities\\n• Week 7-8: Expansion tactics\\n\\n**Month 3: Optimization**\\n• Week 9-10: Performance analysis\\n• Week 11-12: Strategic adjustments\\n\\n**Critical Milestones**\\n• Key deadlines\\n• Success checkpoints\\n• Decision points",
  
  "kpis": "**Primary KPIs**\\n• [Metric]: Target and measurement\\n• [Metric]: Target and measurement\\n• [Metric]: Target and measurement\\n\\n**Secondary KPIs**\\n• [Metric]: Target and measurement\\n• [Metric]: Target and measurement\\n\\n**Leading Indicators**\\n• Early success signals\\n• Predictive metrics\\n• Warning indicators\\n\\n**Measurement Framework**\\n• Reporting frequency\\n• Data sources\\n• Analysis approach",
  
  "risks_and_safety_nets": "**High-Risk Scenarios**\\n• [Risk]: Impact and probability\\n• [Risk]: Impact and probability\\n• [Risk]: Impact and probability\\n\\n**Mitigation Strategies**\\n• Preventive measures\\n• Contingency plans\\n• Response protocols\\n\\n**Safety Nets**\\n• Backup plans\\n• Alternative approaches\\n• Recovery strategies\\n\\n**Why this matters:** Risk context\\n**How to execute:** Risk management approach",
  
  "experiments": "**Priority Tests**\\n• [Experiment]: Hypothesis, method, success criteria\\n• [Experiment]: Hypothesis, method, success criteria\\n• [Experiment]: Hypothesis, method, success criteria\\n\\n**Testing Framework**\\n• Test design principles\\n• Measurement approach\\n• Learning objectives\\n\\n**Implementation Plan**\\n• Testing sequence\\n• Resource requirements\\n• Timeline and milestones",
  
  "glossary": "**Marketing Terms**\\n• [Term]: Clear definition\\n• [Term]: Clear definition\\n• [Term]: Clear definition\\n\\n**Industry-Specific Terms**\\n• [Term]: Context-specific definition\\n• [Term]: Context-specific definition\\n\\n**Acronyms and Abbreviations**\\n• [Acronym]: Full meaning and explanation"
}

CONTENT REQUIREMENTS:
- Each section 250-400 words minimum
- Use bullet points and clear structure throughout
- Include specific competitor names where provided
- Bold headings for easy scanning
- Actionable insights with "Why this matters" and "How to execute"
- NO long paragraphs - break up content with structure
- Percentage-only budget allocations (e.g., "Search: 45%")

TASK:
Create a comprehensive, well-structured marketing strategy using the exact JSON format above. Focus on scannable content with clear headings, bullet points, and actionable insights. Prominently feature any named competitors throughout the analysis.

OUTPUT:
Return valid JSON only with the exact field structure and formatting specified above.`;

    /* 4. OpenAI call */
    try {
      const ai = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.4,
          top_p: 0.9,
          max_tokens: 4000,
          response_format: { type: "json_object" },
          messages: [
            { role: "system",
              content: "You are Mark Ritson meets Philip Kotler - the world's leading marketing strategist. Write comprehensive, actionable marketing strategies in British English with proper sentence case. Use structured content with headings and bullet points - NOT wall-of-text paragraphs. Always prominently feature any named competitors provided. Use percentage allocations only for budgets - no currency symbols." },
            ...EXAMPLES.map(t => ({ role: "assistant", content: t })),
            { role: "user", content: prompt }
          ]
        })
      });

      const out = await ai.json();
      if (!ai.ok) {
        return new Response(
          JSON.stringify({ error:"openai_error", detail: out }),
          cors(ai.status)
        );
      }

      let json;
      try {
        const content = out.choices?.[0]?.message?.content;
        json = content ? JSON.parse(content)
                       : { error:"no_content", detail: out };
      } catch (e) {
        json = { error:"bad_model_json", raw:out, parseError:String(e) };
      }

      if (!json.error) {
        json = applyMotionDefaults(json, form);
        json = stripCurrencyAndAmounts(json);
      }

      return new Response(JSON.stringify(json), {
        ...cors(),
        headers: { ...cors().headers, "Content-Type":"application/json" }
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ error:"worker_crash", detail:String(err) }),
        cors(500)
      );
    }
  }
};

/* CORS helper */
function cors(status = 200) {
  return {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Max-Age": "86400"
    }
  };
}