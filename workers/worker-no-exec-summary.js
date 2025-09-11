/*  ─────────────────────────────────────────────
    Marketing Strategy Generator Worker
    ───────────────────────────────────────────── */
const MODEL = "gpt-4o";

const EXAMPLES = [
`Market Foundation

Market Overview

The Australian seed market is diverse, with various offerings catering to gardening enthusiasts and agricultural professionals alike.

Customer Behaviour Insights

Peak demand occurs during spring planting season (September-November). Customers typically spend 2-3 weeks researching before purchase. Quality-focused decision making dominates, with 78% prioritising germination rates over price.

Key Market Trends

Organic movement shows 45% increase in demand year-over-year. Small-space gardening drives urban container gardening growth. Educational content consumption influences 60% of purchases through video tutorials.

`,

`Budget Allocation

Primary Channels

Search adverts: 45% - Capture high-intent traffic for immediate conversions
Paid social: 30% - Build awareness and drive consideration across demographics  
Content marketing: 15% - Educational content for nurturing and retention
Email marketing: 10% - Customer lifecycle management and repeat purchases

Allocation Rationale

Search captures bottom-funnel demand when customers are ready to buy. Social media builds the top-funnel awareness needed for market expansion. Content establishes authority and supports organic discovery. Email maximises customer lifetime value through retention campaigns.

Competitor Analysis: SeedCo

Strengths: Strong brand recognition, extensive product range, established retail partnerships
Weaknesses: Higher price points, limited digital presence, slow innovation cycles
Share of voice: 20% of market conversation
Opportunity: Target their price-sensitive customers with value positioning`
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
        { channel: "Marketplace adverts", intent: "High", role: "Capture" },
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
        { channel: "App store adverts", intent: "High", role: "Convert" },
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
      competitorAnalysisInstructions = `CRITICAL: You MUST prominently feature and analyse these specific competitors: ${form.competitors.join(", ")}. Include them by name in the competitors_brief section and reference them throughout other sections. Do not ignore or generalise these competitors.`;
    } else {
      competitorLine = "Competitors: None specified";
      competitorAnalysisInstructions = "No specific competitors provided. Analyse the general competitive landscape.";
    }

    let prompt = `You are Mark Ritson meets Philip Kotler - the world's leading marketing strategist. 

CRITICAL LANGUAGE REQUIREMENT:
- Write EXCLUSIVELY in British English with UK spelling throughout
- Use UK terminology: adverts (not ads), organisations (not organizations), realise (not realize), colour (not color), centre (not center), analyse (not analyze), optimise (not optimize), behaviour (not behavior), favourite (not favorite), honour (not honor), labour (not labor), flavour (not flavor), neighbourhood (not neighborhood), travelled (not traveled), cancelled (not canceled), modelling (not modeling), programme (not program when referring to plans), whilst (not while), amongst (not among)
- Use British business language and terminology consistently
- Apply proper sentence case throughout
- NO American spellings or terminology whatsoever

CRITICAL FORMATTING REQUIREMENTS:
- Use section headings without any markdown formatting (no asterisks or special symbols)
- Put each subheading on its own line with double line breaks before content
- Write in clean, readable paragraphs with proper line breaks
- NO asterisks, NO bullet symbols, NO markdown formatting anywhere
- Well-structured, professional British business report format
- DO NOT include "Executive Summary" as a subheading - start directly with Strategic Overview

COMPETITOR ANALYSIS REQUIREMENT:
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
  
  "market_foundation": "Market Overview\\n\\nMarket size, growth trends, and key dynamics affecting the sector.\\n\\nCustomer Behaviour Insights\\n\\nPurchasing patterns, decision-making factors, pain points and motivations that drive customer behaviour.\\n\\nMarket Opportunities\\n\\nUnderserved segments, emerging trends, and growth areas to target.\\n\\nWhy this matters: Strategic context for market positioning.\\nHow to execute: Action steps for market entry and expansion.",
  
  "strategy_pillars": "Pillar 1: Strategic Focus Name\\n\\nStrategic focus, key activities, and success metrics for the first pillar.\\n\\nPillar 2: Strategic Focus Name\\n\\nStrategic focus, key activities, and success metrics for the second pillar.\\n\\nPillar 3: Strategic Focus Name\\n\\nStrategic focus, key activities, and success metrics for the third pillar.\\n\\nWhy this matters: Strategic importance of these pillars.\\nHow to execute: Implementation roadmap for all three pillars.",
  
  "personas": "Primary Persona: Name\\n\\nDemographics and psychographics, pain points and challenges, goals and motivations, preferred channels.\\n\\nSecondary Persona: Name\\n\\nDemographics and psychographics, pain points and challenges, goals and motivations, preferred channels.\\n\\nTertiary Persona: Name\\n\\nDemographics and psychographics, pain points and challenges, goals and motivations, preferred channels.",
  
  "competitors_brief": "[Competitor Name Analysis]\\n\\nStrengths and advantages, weaknesses and vulnerabilities, market positioning, share of voice, competitive threats.\\n\\n[Additional Competitors if provided]\\n\\nAnalysis for each named competitor with specific focus on market position.\\n\\nCompetitive Landscape Summary\\n\\nMarket dynamics, competitive gaps, and positioning opportunities.\\n\\nWhy this matters: Competitive context and strategic implications.\\nHow to execute: Competitive response strategy and positioning tactics.",
  
  "differentiation_moves": "Core Differentiation Strategy\\n\\nUnique value proposition, key differentiators, and competitive advantages.\\n\\nPositioning Tactics\\n\\nSpecific positioning against named competitors and market positioning approach.\\n\\nMessaging Framework\\n\\nCore messages, proof points, and communication strategy.\\n\\nWhy this matters: Differentiation importance in the competitive landscape.\\nHow to execute: Positioning implementation and messaging deployment.",
  
  "marketing_mix_7ps": "Product\\n\\nProduct strategy, features and benefits, product development priorities.\\n\\nPrice\\n\\nPricing strategy, competitive pricing analysis, value communication.\\n\\nPlace\\n\\nDistribution channels, channel strategy, market access approach.\\n\\nPromotion\\n\\nPromotional strategy, communication channels, campaign approach.\\n\\nPeople\\n\\nTarget audiences, customer service strategy, team requirements.\\n\\nProcess\\n\\nCustomer journey, service delivery, operational excellence.\\n\\nPhysical Evidence\\n\\nBrand assets, customer touchpoints, credibility factors.",
  
  "channel_playbook": [
    {
      "channel": "Primary Channel Name",
      "intent": "High|Mid|Low",
      "role": "Channel function (e.g., Capture, Assist, Scale)",
      "summary": "Detailed strategic explanation of this channel's role and approach. Include specific tactics, target audience, and strategic importance. This should be 2-3 comprehensive sentences that provide actionable insights using British English throughout.",
      "key_actions": ["Specific tactical action 1", "Specific tactical action 2", "Specific tactical action 3", "Specific tactical action 4"],
      "success_metric": "Primary success measurement for this channel with specific details",
      "budget_percent": 45,
      "why_it_works": "Detailed strategic rationale explaining why this channel is effective for this specific business model, market, and target audience. Include competitive advantages and market dynamics using British English."
    },
    {
      "channel": "Secondary Channel Name", 
      "intent": "High|Mid|Low",
      "role": "Channel function",
      "summary": "Detailed strategic explanation for this channel's role and implementation approach. Include specific tactics, timing, and integration with other channels. 2-3 comprehensive sentences using British English.",
      "key_actions": ["Specific tactical action 1", "Specific tactical action 2", "Specific tactical action 3"],
      "success_metric": "Primary success measurement for this channel with specific details",
      "budget_percent": 30,
      "why_it_works": "Detailed strategic rationale for why this channel delivers results in this context, including market positioning and customer behaviour insights using British English."
    },
    {
      "channel": "Tertiary Channel Name",
      "intent": "High|Mid|Low", 
      "role": "Channel function",
      "summary": "Detailed strategic explanation for this supporting channel. Include specific implementation details, audience targeting, and strategic value. 2-3 comprehensive sentences using British English.",
      "key_actions": ["Specific tactical action 1", "Specific tactical action 2"],
      "success_metric": "Primary success measurement for this channel with specific details", 
      "budget_percent": 25,
      "why_it_works": "Detailed strategic rationale explaining the unique value this channel provides and how it complements the overall channel strategy using British English."
    }
  ],
  
  "budget": {
    "band": "${form.budget_band || "Low"}",
    "allocation": "Primary Allocation\\n\\nChannel allocation with percentages and rationale for each major channel.\\n\\nSecondary Allocation\\n\\nSupporting channel allocations with strategic reasoning.\\n\\nAllocation Rationale\\n\\nStrategic reasoning, expected returns, and risk considerations for budget distribution."
  },
  
  "calendar_next_90_days": "Month 1: Foundation\\n\\nWeek-by-week breakdown of setup activities, launch preparations, initial campaigns, and optimisation tasks.\\n\\nMonth 2: Scaling\\n\\nScaling activities and expansion tactics for weeks 5-8.\\n\\nMonth 3: Optimisation\\n\\nPerformance analysis and strategic adjustments for weeks 9-12.\\n\\nCritical Milestones\\n\\nKey deadlines, success checkpoints, and decision points throughout the 90 days.",
  
  "kpis": "Primary KPIs\\n\\nCore metrics with targets and measurement methodology.\\n\\nSecondary KPIs\\n\\nSupporting metrics for performance tracking.\\n\\nLeading Indicators\\n\\nEarly success signals, predictive metrics, and warning indicators.\\n\\nMeasurement Framework\\n\\nReporting frequency, data sources, and analysis approach.",
  
  "risks_and_safety_nets": "High-Risk Scenarios\\n\\nKey risks with impact assessment and probability analysis.\\n\\nMitigation Strategies\\n\\nPreventive measures, contingency plans, and response protocols.\\n\\nSafety Nets\\n\\nBackup plans, alternative approaches, and recovery strategies.\\n\\nWhy this matters: Risk context and strategic importance.\\nHow to execute: Risk management approach and implementation.",
  
  "experiments": "Priority Tests\\n\\nKey experiments with hypothesis, methodology, and success criteria for each test.\\n\\nTesting Framework\\n\\nTest design principles, measurement approach, and learning objectives.\\n\\nImplementation Plan\\n\\nTesting sequence, resource requirements, timeline and milestones.",
  
  "glossary": "Marketing Terms\\n\\nClear definitions of key marketing terms used in the strategy.\\n\\nAcronyms and Abbreviations\\n\\nFull meanings and explanations of acronyms used throughout the report."
}

CONTENT REQUIREMENTS:
- Each section 250-400 words minimum
- Channel playbook must have rich, detailed content for each channel
- Use clear headings with proper line breaks (subheading on own line, then content)
- Include specific competitor names where provided
- NO asterisks, NO bullet points, NO markdown formatting
- Clean, professional British business report format
- Percentage-only budget allocations (e.g., "Search: 45%")
- Channel summaries must be 2-3 comprehensive sentences with tactical details
- Key actions must be specific, actionable tactical items
- Why it works explanations must be detailed strategic reasoning
- MANDATORY: Use British English spelling and terminology throughout
- DO NOT include "Executive Summary" - start with Strategic Overview

BRITISH ENGLISH COMPLIANCE:
- adverts NOT ads
- organisations NOT organizations  
- realise NOT realize
- optimise NOT optimize
- analyse NOT analyze
- behaviour NOT behavior
- colour NOT color
- centre NOT center
- programme NOT program (for plans)
- whilst NOT while
- amongst NOT among

TASK:
Create a comprehensive, well-structured marketing strategy using the exact JSON format above. Focus on clean, readable content with clear headings and actionable insights. Prominently feature any named competitors throughout the analysis. Pay special attention to creating rich, detailed channel playbook content. MUST use British English spelling and terminology exclusively throughout. Do not include Executive Summary subheading.

OUTPUT:
Return valid JSON only with the exact field structure, clean formatting, and British English language specified above.`;

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
              content: "You are Mark Ritson meets Philip Kotler - the world's leading marketing strategist. Write comprehensive, actionable marketing strategies EXCLUSIVELY in British English with UK spelling and terminology. Use clean, professional business report format with NO markdown formatting, NO asterisks, NO bullet symbols. Always prominently feature any named competitors provided. Use percentage allocations only for budgets - no currency symbols. Create rich, detailed channel playbook content with comprehensive tactical details. Put subheadings on their own lines with double line breaks before content. Do not include Executive Summary subheading. MANDATORY: Use British spellings - adverts not ads, organisations not organizations, realise not realize, optimise not optimize, analyse not analyze, behaviour not behavior, colour not color, centre not center." },
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