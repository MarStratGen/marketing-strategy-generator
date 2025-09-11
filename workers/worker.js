/*  ─────────────────────────────────────────────
    Marketing Strategy Generator Worker
    ───────────────────────────────────────────── */
const MODEL = "gpt-4o";

const EXAMPLES = [
`Market Foundation

Market Overview
The Australian seed market demonstrates diversity across segments, with offerings catering to gardening enthusiasts and agricultural professionals. Industry analysis reveals established distribution networks through both traditional garden centres and emerging digital platforms.

Customer Behaviour Insights
Research indicates peak demand occurs during spring planting season (September-November). Customer analysis shows buyers typically spend 2-3 weeks researching before purchase, consulting both online resources and local experts. Behavioural data demonstrates quality-focused decision making dominates, with 78% prioritising germination rates over price considerations.

Competitor Analysis
Market analysis reveals SeedCo maintains strong brand recognition through extensive product range and established retail partnerships. The competitive landscape shows vulnerabilities in higher price points and limited digital presence, whilst traditional channels remain strong.
`,

`Budget Allocation

Primary Allocation
Allocate 35% to search advertising to capture high-intent digital traffic. Assign 25% to local print advertising targeting gardening publications and community newspapers for credibility building.

Secondary Allocation  
Direct 20% to radio sponsorships during gardening programmes to reach traditional audiences. Reserve 10% for trade show participation to demonstrate products. Assign remaining 10% to email marketing for customer retention.

Allocation Rationale
Balance digital and traditional channels to reach diverse customer segments. Prioritise search investment for immediate conversion capture whilst maintaining strong traditional media presence for authority building. Local print and radio provide credibility with established gardening community, whilst trade shows enable product demonstration and relationship building.`
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
        { channel: "Search advertising", intent: "High", role: "Capture" },
        { channel: "Paid social media", intent: "Mid", role: "Spark demand" },
        { channel: "Email marketing", intent: "Mid", role: "Nurture" },
        { channel: "Influencer partnerships", intent: "Mid", role: "Social proof" }
      ],
      saas_checkout: [
        { channel: "Search advertising", intent: "High", role: "Capture" },
        { channel: "Content marketing", intent: "Mid", role: "Educate" },
        { channel: "LinkedIn advertising", intent: "Mid", role: "Target professionals" },
        { channel: "Webinars and demos", intent: "High", role: "Convert" }
      ],
      marketplace_checkout: [
        { channel: "Marketplace advertising", intent: "High", role: "Capture" },
        { channel: "Search advertising", intent: "Mid", role: "Assist" },
        { channel: "Product review platforms", intent: "Mid", role: "Build trust" }
      ],
      store_visit: [
        { channel: "Local search advertising", intent: "High", role: "Drive visits" },
        { channel: "Radio advertising", intent: "Mid", role: "Build awareness" },
        { channel: "Local print advertising", intent: "Mid", role: "Community presence" },
        { channel: "Outdoor advertising", intent: "Low", role: "Brand visibility" },
        { channel: "Direct mail campaigns", intent: "Mid", role: "Target locals" }
      ],
      call_now: [
        { channel: "Search with call extensions", intent: "High", role: "Click to call" },
        { channel: "Radio sponsorships", intent: "Mid", role: "Audio presence" },
        { channel: "Local directory listings", intent: "High", role: "Capture searches" },
        { channel: "Yellow Pages advertising", intent: "Mid", role: "Traditional search" }
      ],
      lead_capture: [
        { channel: "Search advertising", intent: "High", role: "Capture" },
        { channel: "LinkedIn advertising", intent: "Mid", role: "B2B targeting" },
        { channel: "Trade publications", intent: "Mid", role: "Industry reach" },
        { channel: "Trade shows and exhibitions", intent: "High", role: "Face-to-face" },
        { channel: "Direct mail campaigns", intent: "Mid", role: "Targeted outreach" },
        { channel: "Telemarketing", intent: "High", role: "Direct contact" }
      ],
      booking: [
        { channel: "Search advertising", intent: "High", role: "Capture" },
        { channel: "Local social media", intent: "Mid", role: "Community presence" },
        { channel: "Local print advertising", intent: "Mid", role: "Traditional reach" },
        { channel: "Radio advertising", intent: "Mid", role: "Drive bookings" },
        { channel: "Referral programmes", intent: "High", role: "Word of mouth" }
      ],
      saas_trial: [
        { channel: "Search advertising", intent: "High", role: "Capture" },
        { channel: "Content marketing", intent: "Mid", role: "Educate" },
        { channel: "Industry publications", intent: "Mid", role: "Authority building" },
        { channel: "Professional networking", intent: "Mid", role: "Personal connections" },
        { channel: "Webinars and events", intent: "Mid", role: "Demonstrate value" }
      ],
      saas_demo: [
        { channel: "Search advertising", intent: "High", role: "Capture" },
        { channel: "LinkedIn advertising", intent: "Mid", role: "Target accounts" },
        { channel: "Trade shows", intent: "High", role: "Demo platform" },
        { channel: "Industry conferences", intent: "Mid", role: "Thought leadership" },
        { channel: "Direct sales outreach", intent: "High", role: "Personal contact" }
      ],
      app_install: [
        { channel: "App store advertising", intent: "High", role: "Convert" },
        { channel: "Social media advertising", intent: "Mid", role: "Scale awareness" },
        { channel: "Influencer marketing", intent: "Mid", role: "Social validation" },
        { channel: "Television advertising", intent: "Low", role: "Mass awareness" },
        { channel: "Podcast sponsorships", intent: "Mid", role: "Audio engagement" }
      ],
      donation: [
        { channel: "Search advertising", intent: "High", role: "Capture intent" },
        { channel: "Direct mail appeals", intent: "Mid", role: "Personal touch" },
        { channel: "Community events", intent: "Mid", role: "Local engagement" },
        { channel: "Radio sponsorships", intent: "Mid", role: "Cause awareness" },
        { channel: "Print advertising", intent: "Mid", role: "Credibility building" },
        { channel: "Telemarketing campaigns", intent: "High", role: "Direct appeal" }
      ],
      wholesale_inquiry: [
        { channel: "Search advertising", intent: "High", role: "Capture B2B" },
        { channel: "LinkedIn advertising", intent: "Mid", role: "Prospect" },
        { channel: "Trade publications", intent: "Mid", role: "Industry authority" },
        { channel: "Trade shows", intent: "High", role: "Relationship building" },
        { channel: "Direct sales outreach", intent: "High", role: "Personal contact" },
        { channel: "Industry directories", intent: "Mid", role: "Visibility" }
      ],
      partner_recruitment: [
        { channel: "Search advertising", intent: "High", role: "Capture partners" },
        { channel: "LinkedIn outreach", intent: "Mid", role: "Recruit" },
        { channel: "Industry publications", intent: "Mid", role: "Authority" },
        { channel: "Trade associations", intent: "Mid", role: "Network access" },
        { channel: "Partner events", intent: "High", role: "Relationship building" },
        { channel: "Direct recruitment campaigns", intent: "High", role: "Targeted outreach" }
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

    // Align budget allocation with channel playbook
    function alignBudgetWithChannels(report) {
      if (!report.channel_playbook || !Array.isArray(report.channel_playbook)) {
        return report;
      }

      // Take first 3 channels from playbook (already have budget_percent values)
      const channels = report.channel_playbook.slice(0, 3);
      
      if (channels.length >= 3) {
        const budgetText = `Primary Allocation\n${channels[0].channel}: ${channels[0].budget_percent}% to ${channels[0].role.toLowerCase()}.\n\nSecondary Allocation\n${channels[1].channel}: ${channels[1].budget_percent}% to ${channels[1].role.toLowerCase()}.\n\nSupporting Allocation\n${channels[2].channel}: ${channels[2].budget_percent}% to ${channels[2].role.toLowerCase()}.\n\nAllocation Rationale\nPrioritise the primary channel to capture high-intent demand whilst supporting with secondary and tertiary channels for comprehensive market coverage through integrated channel approach.`;
        
        if (!report.budget) report.budget = {};
        report.budget.allocation = budgetText;
      }
      
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

    let prompt = `You are Mark Ritson meets Philip Kotler - the world's leading marketing strategist. 

CRITICAL LANGUAGE REQUIREMENT:
- Write EXCLUSIVELY in British English with UK spelling throughout
- Use UK terminology: adverts (not ads), organisations (not organizations), realise (not realize), colour (not color), centre (not center), analyse (not analyze), optimise (not optimize), behaviour (not behavior), favourite (not favorite), honour (not honor), labour (not labor), flavour (not flavor), neighbourhood (not neighborhood), travelled (not traveled), cancelled (not canceled), modelling (not modeling), programme (not program when referring to plans), whilst (not while), amongst (not among)
- Use British business language and terminology consistently
- Apply proper sentence case throughout
- NO American spellings or terminology whatsoever

CRITICAL LANGUAGE STYLE BY SECTION TYPE:
- ANALYTICAL sections (Market Foundation, Personas, Competitors): Use OBJECTIVE, DESCRIPTIVE language - "The market demonstrates...", "Customers typically exhibit...", "Research indicates..."
- STRATEGIC sections (Strategy Pillars, Differentiation, 7Ps): Use BUSINESS-FOCUSED RECOMMENDATIONS - "The business should focus on...", "Position the brand as...", "Prioritise..."
- TACTICAL sections (Channel Playbook, Calendar, Experiments): Use ACTION-ORIENTED DIRECTIVES - "Implement search campaigns...", "Launch social media initiatives...", "Execute testing protocols..."
- PLANNING sections (Budget, KPIs, Risks): Use STRATEGIC RECOMMENDATIONS - "Allocate 45% to search...", "Track conversion rates...", "Monitor competitive response..."

CRITICAL FORMATTING REQUIREMENTS:
- Use section headings without any markdown formatting (no asterisks or special symbols)
- Write in clean, readable paragraphs with proper line breaks
- NO asterisks, NO bullet symbols, NO markdown formatting anywhere
- Well-structured, professional British business report format

INTEGRATED MARKETING APPROACH:
- Recommend BOTH digital AND traditional marketing channels based on business type and target market
- Consider local market context, customer demographics, and sector norms when selecting channels
- Include traditional channels: print advertising, radio, television, direct mail, outdoor advertising, trade shows, telemarketing, community events, referral programmes, trade publications, networking events
- Balance digital efficiency with traditional credibility and local market presence

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
  
  "market_foundation": "Market Overview\\nMarket size, growth trends, and key dynamics affecting the sector. Use ANALYTICAL language: 'The market demonstrates...', 'Research indicates...', 'Industry data shows...'.\\n\\nCustomer Behaviour Insights\\nPurchasing patterns, decision-making factors, pain points and motivations that drive customer behaviour. Use DESCRIPTIVE language: 'Customers typically...', 'Behavioural analysis reveals...', 'Consumer research shows...'.\\n\\nCompetitor Analysis\\nAnalysis of named competitors including strengths, weaknesses, market positioning, and competitive opportunities.\\n\\nMarket Opportunities\\nUnderserved segments, emerging trends, and growth areas to target.",
  
  "strategy_pillars": "Pillar 1: Strategic Focus Name\\nThe business should focus on [strategic area]. Prioritise [key activities] to achieve [success metrics]. Use BUSINESS-FOCUSED language: 'The business should...', 'Focus on...', 'Prioritise...'.\\n\\nPillar 2: Strategic Focus Name\\nPosition the brand to [strategic objective]. The organisation should develop [capabilities] whilst maintaining [advantages].\\n\\nPillar 3: Strategic Focus Name\\nEstablish [strategic priority] by concentrating resources on [activities] to deliver [outcomes].",
  
  "personas": "Primary Persona: Name\\nThe target demographic typically exhibits [characteristics]. Research indicates these customers demonstrate [behaviours] and prioritise [values]. Their decision-making process involves [factors].\\n\\nSecondary Persona: Name\\nThis segment generally shows [traits] and responds to [motivations]. Analysis reveals they prefer [channels] and value [benefits].\\n\\nTertiary Persona: Name\\nCustomers in this category tend to [behaviours] and are influenced by [factors]. They typically engage through [channels].",
  
  "competitors_brief": "[Competitor Name Analysis]\\nThe competitive landscape reveals [competitor] demonstrates [strengths] whilst showing vulnerabilities in [weaknesses]. Market analysis indicates their positioning focuses on [strategy].\\n\\n[Additional Competitors if provided]\\nResearch shows [competitor] maintains [market position] through [approach]. Their strategy emphasises [focus areas].\\n\\nCompetitive Analysis Summary\\nThe market exhibits [dynamics] with competitive gaps emerging in [areas]. Opportunities exist in [positioning spaces].",
  
  "differentiation_moves": "Core Differentiation Strategy\\nThe business should position itself as [unique position] by emphasising [differentiators]. Focus on developing [competitive advantages] whilst leveraging [strengths].\\n\\nPositioning Tactics\\nPosition the brand against [competitors] by highlighting [differences]. The organisation should concentrate on [positioning approach] to establish [market position].\\n\\nMessaging Framework\\nDevelop core messages around [themes]. Prioritise [proof points] and communicate [value proposition] through [strategy].",
  
  "marketing_mix_7ps": "Product\\nThe business should develop [product strategy] by focusing on [features] whilst prioritising [benefits]. Position the offering to deliver [value proposition].\\n\\nPrice\\nEstablish pricing at [strategy] to compete against [competitors]. The organisation should communicate value through [approach] whilst maintaining [positioning].\\n\\nPlace\\nDistribute through [channels] by developing [partnerships]. Focus on [market access] to reach [target segments].\\n\\nPromotion\\nDevelop promotional strategy emphasising [messages]. The business should utilise [channels] whilst coordinating [campaigns].\\n\\nPeople\\nBuild staff capabilities in [areas]. Prioritise training on [skills] and establish [service standards] to deliver [customer experience].\\n\\nProcess\\nOptimise the customer journey by streamlining [touchpoints]. Focus on [operational areas] to improve [outcomes].\\n\\nPhysical Evidence\\nDevelop brand assets that demonstrate [credibility]. Establish [touchpoints] to reinforce [brand positioning].",
  
  "channel_playbook": [
    {
      "channel": "Primary Channel Name",
      "intent": "High|Mid|Low",
      "role": "Channel function (e.g., Capture, Assist, Scale)",
      "summary": "Implement [channel strategy] to capture [audience type]. Launch [specific approach] targeting [segment] whilst optimising for [outcome]. Execute [tactics] to achieve [performance goals].",
      "key_actions": ["Launch specific campaign type", "Implement targeting strategy", "Execute optimisation protocol", "Deploy measurement system"],
      "success_metric": "Track [specific metric] to measure [outcome]",
      "budget_percent": 45,
      "why_it_works": "This channel performs effectively because [market dynamics]. Implement this approach to leverage [competitive advantage] whilst capturing [opportunity]."
    },
    {
      "channel": "Secondary Channel Name", 
      "intent": "High|Mid|Low",
      "role": "Channel function",
      "summary": "Deploy [channel approach] to engage [audience]. Execute [strategy] through [methods] whilst monitoring [performance indicators]. Launch [initiatives] to drive [outcomes].",
      "key_actions": ["Execute specific tactic", "Launch engagement strategy", "Implement measurement system"],
      "success_metric": "Monitor [key metric] for [results]",
      "budget_percent": 30,
      "why_it_works": "Execute this channel strategy to capitalise on [market conditions]. Implement [approach] to achieve [competitive positioning]."
    },
    {
      "channel": "Tertiary Channel Name",
      "intent": "High|Mid|Low", 
      "role": "Channel function",
      "summary": "Launch [supporting strategy] to complement primary channels. Implement [tactics] targeting [specific segment] whilst tracking [performance]. Execute [approach] to enhance [overall strategy].",
      "key_actions": ["Deploy supporting campaign", "Execute measurement protocol"],
      "success_metric": "Track [supporting metric] for [contribution]", 
      "budget_percent": 25,
      "why_it_works": "Deploy this supporting channel to enhance [strategic objective]. Execute [tactics] to maximise [channel synergy]."
    }
  ],
  
  "budget": {
    "band": "${form.budget_band || "Low"}",
    "allocation": "Budget allocation will be generated from channel_playbook data during post-processing."
  },
  
  "calendar_next_90_days": "Month 1: Foundation\\nWeek 1: Launch search campaigns and establish tracking systems. Week 2: Deploy social media advertising and content calendar. Week 3: Implement email sequences and retargeting pixels. Week 4: Execute A/B tests and optimise initial performance.\\n\\nMonth 2: Scaling\\nWeek 5: Scale successful campaigns and expand audience targeting. Week 6: Launch additional creative variations and test new channels. Week 7: Implement conversion optimisation protocols. Week 8: Execute competitive response initiatives.\\n\\nMonth 3: Optimisation\\nWeek 9: Analyse performance data and adjust budget allocation. Week 10: Deploy advanced targeting and personalisation. Week 11: Execute retention campaigns and loyalty programmes. Week 12: Prepare quarterly review and strategy adjustments.\\n\\nCritical Milestones\\nExecute campaign launches by week 1. Complete initial optimisation by week 4. Achieve scaling targets by week 8. Deliver quarterly objectives by week 12.",
  
  "kpis": "Primary KPIs\\nTrack conversion rate at 3.5% to measure campaign effectiveness. Monitor cost per acquisition at £25 to ensure profitability. Measure return on advertising spend at 400% for overall performance.\\n\\nSecondary KPIs\\nMonitor click-through rates across channels to assess engagement quality. Track customer lifetime value to evaluate long-term success. Measure brand awareness lift through surveys and organic search volume.\\n\\nLeading Indicators\\nTrack impression share to predict market capture potential. Monitor quality scores to anticipate cost efficiency changes. Measure engagement rates to forecast conversion performance.\\n\\nMeasurement Framework\\nReport weekly performance against targets. Analyse monthly trends and quarterly strategic reviews. Source data from Google Analytics, advertising platforms, and customer surveys.",
  
  "risks_and_safety_nets": "Generate contextual risks based on the specific business, sector, country, and marketing channels being recommended. Consider business-specific vulnerabilities like operational risks, market conditions, seasonal factors, regulatory concerns, competitive threats, and economic dependencies that actually affect this particular business type and sector. Include relevant mitigation strategies and safety nets that make sense for the recommended marketing channels and business model. DO NOT use generic digital marketing risks that don't apply to traditional marketing channels or specific business contexts.",
  
  "experiments": "Priority Tests\\nExecute landing page testing to compare conversion rates between [variation A] and [variation B]. Launch audience segmentation tests to identify highest-performing demographics. Implement creative testing to optimise advertising performance.\\n\\nTesting Framework\\nDesign experiments with statistical significance thresholds of 95%. Establish test duration of minimum 2 weeks for reliable results. Implement holdout groups for accurate measurement.\\n\\nImplementation Plan\\nLaunch landing page tests in week 1. Execute audience tests in week 3. Deploy creative tests in week 5. Analyse results and implement winning variations by week 8."
}

CONTENT REQUIREMENTS:
- Each section 250-400 words minimum
- Channel playbook must have rich, detailed content for each channel
- Use clear headings and well-structured paragraphs
- Include specific competitor names where provided
- NO asterisks, NO bullet points, NO markdown formatting
- Clean, professional British business report format
- Percentage-only budget allocations (e.g., "Search: 45%")
- Channel summaries must be 2-3 comprehensive sentences with tactical details
- Key actions must be specific, actionable tactical items
- Why it works explanations must be detailed strategic reasoning
- MANDATORY: Use British English spelling and terminology throughout
- Budget allocation MUST reference exactly the same channels from channel_playbook with matching percentages
- CRITICAL: Generate contextual, business-specific risks and safety nets that relate to the actual sector, marketing channels, and business model being recommended

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
Create a comprehensive, well-structured marketing strategy using the exact JSON format above. Focus on clean, readable content with clear headings and actionable insights. Prominently feature any named competitors throughout the analysis. Pay special attention to creating rich, detailed channel playbook content. Generate contextual risks specific to this business type, sector, and marketing approach. MUST use British English spelling and terminology exclusively throughout.

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
              content: "You are Mark Ritson meets Philip Kotler - the world's leading marketing strategist. Write comprehensive, actionable marketing strategies EXCLUSIVELY in British English with UK spelling and terminology. Use clean, professional business report format with NO markdown formatting, NO asterisks, NO bullet symbols. Always prominently feature any named competitors provided. Use percentage allocations only for budgets - no currency symbols. Create rich, detailed channel playbook content with comprehensive tactical details. CRITICAL: Recommend integrated marketing approaches combining BOTH digital AND traditional channels based on business type and target market. Consider print advertising, radio, television, direct mail, outdoor advertising, trade shows, telemarketing, local community engagement, and other traditional tactics alongside digital channels. MANDATORY: Use British spellings - adverts not ads, organisations not organizations, realise not realize, optimise not optimize, analyse not analyze, behaviour not behavior, colour not color, centre not center. Follow section-specific language styles: analytical sections use descriptive language, strategic sections use business recommendations, tactical sections use action directives, planning sections use strategic recommendations. CRITICAL: Generate contextual, business-specific risks and safety nets that relate to the actual sector, marketing channels, business model, and market conditions rather than generic digital marketing risks." },
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
        json = alignBudgetWithChannels(json);
      }

      return new Response(JSON.stringify(json), cors());

    } catch (e) {
      return new Response(
        JSON.stringify({ error:"worker_error", detail: String(e) }),
        cors(500)
      );
    }
  }
};

function cors(status = 200) {
  return {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Dev-Mode",
      "Content-Type": "application/json"
    }
  };
}