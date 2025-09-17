/*  ─────────────────────────────────────────────
    Marketing Strategy Generator Worker - Optimized
    ───────────────────────────────────────────── */
const MODEL_FAST = "gpt-4o-mini";

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin');
    
    /* 1. CORS pre-flight */
    if (req.method === "OPTIONS") return new Response(null, cors(200, origin));

    /* 2. Only allow requests from approved origins */
    const allowedOrigins = [
      'http://localhost:5000',
      'https://localhost:5000',
      'http://127.0.0.1:5000', 
      'https://127.0.0.1:5000',
      'https://4ed238b6-44fe-47f0-8f40-754dbed6c70c-00-y3il5bpx45gx.sisko.replit.dev'
    ];
    
    if (origin && !allowedOrigins.includes(origin)) {
      return new Response(
        JSON.stringify({ error: "forbidden_origin" }),
        cors(403, origin)
      );
    }

    /* 3. Handle /generate endpoint */
    const url = new URL(req.url);
    if (req.method !== "POST" || !url.pathname.endsWith("/generate")) {
      return new Response(
        JSON.stringify({ error: "method_not_allowed" }),
        cors(405, origin)
      );
    }

    /* 4. Input validation */
    let form;
    try { 
      const text = await req.text();
      if (text.length > 10000) {
        return new Response(JSON.stringify({ error: "request_too_large" }), cors(413, origin));
      }
      form = JSON.parse(text); 
    }
    catch { return new Response(JSON.stringify({ error: "invalid_request" }), cors(400, origin)); }

    /* 5. Validate required fields */
    if (!form.country || !form.product_type || !form.audiences) {
      return new Response(JSON.stringify({ error: "missing_required_fields" }), cors(400, origin));
    }

    /* 6. Check API key */
    if (!env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "api_key_not_configured" }), 
        cors(503, origin)
      );
    }

    /* 7. Parallel generation for speed */
    try {
      const systemPrompt = "Marketing strategist. Write in British English (en-GB spelling). No markdown. Use headings as plain text. Include named competitors prominently.";
      
      const competitorText = form.competitors?.length ? form.competitors.join(", ") : "general market";
      const audienceText = form.audiences?.join(", ") || "general market";
      
      // Create 4 parallel requests
      const promises = [
        // Request 1: Market + Competitors (18s timeout)
        fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: MODEL_FAST,
            temperature: 0.4,
            max_tokens: 800,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Generate market foundation and competitor analysis for: ${form.product_type} in ${form.country} ${form.sector} sector. Competitors: ${competitorText}. JSON format: {"market_foundation": "Market Overview\\n[analysis]\\n\\nCustomer Behaviour\\n[insights]\\n\\nCompetitor Analysis\\n[specific competitor analysis]\\n\\nMarket Opportunities\\n[opportunities]", "competitors_brief": "[competitor analysis with named competitors]"}` }
            ]
          }),
          signal: AbortSignal.timeout(18000)
        }),
        
        // Request 2: Strategy + Differentiation (18s timeout)
        fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: MODEL_FAST,
            temperature: 0.4,
            max_tokens: 700,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Generate strategy pillars and differentiation for: ${form.product_type} targeting ${audienceText}. JSON format: {"strategy_pillars": "Pillar 1: [name]\\n[strategy]\\n\\nPillar 2: [name]\\n[strategy]\\n\\nPillar 3: [name]\\n[strategy]", "differentiators": "Core Differentiation\\n[strategy]\\n\\nValue Proposition\\n[framework]\\n\\nPositioning Statement\\n[statement]"}` }
            ]
          }),
          signal: AbortSignal.timeout(18000)
        }),
        
        // Request 3: Personas + 7Ps (18s timeout)
        fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: MODEL_FAST,
            temperature: 0.4,
            max_tokens: 900,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Generate personas and 7Ps for: ${form.product_type} in ${form.country}. Target: ${audienceText}. JSON format: {"personas": "Primary: [name]\\n[description]\\n\\nSecondary: [name]\\n[description]\\n\\nTertiary: [name]\\n[description]", "seven_ps": "Product\\n[strategy]\\n\\nPrice\\n[strategy]\\n\\nPlace\\n[strategy]\\n\\nPromotion\\n[strategy]\\n\\nPeople\\n[strategy]\\n\\nProcess\\n[strategy]\\n\\nPhysical Evidence\\n[strategy]"}` }
            ]
          }),
          signal: AbortSignal.timeout(18000)
        }),
        
        // Request 4: Planning sections (18s timeout)
        fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: MODEL_FAST,
            temperature: 0.4,
            max_tokens: 800,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Generate planning sections for ${form.product_type} business in ${form.sector}. JSON format: {"calendar_next_90_days": "Month 1: Foundation\\n[activities]\\n\\nMonth 2: Scaling\\n[activities]\\n\\nMonth 3: Optimisation\\n[activities]", "kpis": "Channel KPIs\\n[metrics]\\n\\nBusiness KPIs\\n[outcomes]\\n\\nMeasurement Framework\\n[tools]", "risks_and_safety_nets": "Business Risks\\n[specific risks]\\n\\nMitigation Strategies\\n[solutions]", "experiments": "Priority Tests\\n[experiments]\\n\\nTesting Framework\\n[methodology]"}` }
            ]
          }),
          signal: AbortSignal.timeout(18000)
        })
      ];
      
      // Wait for all requests (max 18s wall time)
      const responses = await Promise.all(promises);
      
      // Parse responses
      const results = await Promise.all(
        responses.map(async (response, index) => {
          if (!response.ok) {
            console.error(`Request ${index + 1} failed:`, response.status);
            return {};
          }
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          try {
            return JSON.parse(content);
          } catch (e) {
            console.error(`Failed to parse response ${index + 1}:`, content);
            return {};
          }
        })
      );
      
      const [marketData, strategyData, personaData, planningData] = results;
      
      // Generate channel playbook deterministically (instant)
      const channelByMotion = {
        ecom_checkout: [
          { channel: "Search advertising", intent: "High", role: "Capture" },
          { channel: "Paid social media", intent: "Mid", role: "Spark demand" },
          { channel: "Email marketing", intent: "Mid", role: "Nurture" },
          { channel: "Influencer partnerships", intent: "Mid", role: "Social proof" },
          { channel: "Direct mail campaigns", intent: "Mid", role: "Target locals" }
        ],
        saas_checkout: [
          { channel: "Search advertising", intent: "High", role: "Capture" },
          { channel: "Content marketing", intent: "Mid", role: "Educate" },
          { channel: "LinkedIn advertising", intent: "Mid", role: "Target professionals" },
          { channel: "Webinars and demos", intent: "High", role: "Convert" },
          { channel: "Trade publications", intent: "Mid", role: "Industry reach" }
        ],
        store_visit: [
          { channel: "Local search advertising", intent: "High", role: "Drive visits" },
          { channel: "Radio advertising", intent: "Mid", role: "Build awareness" },
          { channel: "Local print advertising", intent: "Mid", role: "Community presence" },
          { channel: "Outdoor advertising", intent: "Low", role: "Brand visibility" },
          { channel: "Direct mail campaigns", intent: "Mid", role: "Target locals" }
        ],
        lead_capture: [
          { channel: "Search advertising", intent: "High", role: "Capture" },
          { channel: "LinkedIn advertising", intent: "Mid", role: "B2B targeting" },
          { channel: "Trade publications", intent: "Mid", role: "Industry reach" },
          { channel: "Trade shows and exhibitions", intent: "High", role: "Face-to-face" },
          { channel: "Direct mail campaigns", intent: "Mid", role: "Targeted outreach" }
        ]
      };
      
      const channels = channelByMotion[form.motion] || channelByMotion.ecom_checkout;
      const percentages = [35, 25, 20, 15, 5];
      
      const channelPlaybook = channels.slice(0, 5).map((channel, index) => ({
        ...channel,
        summary: `Deploy ${channel.channel.toLowerCase()} to ${channel.role.toLowerCase()}. Execute targeted campaigns through proven methods whilst tracking performance metrics. Launch initiatives to achieve strategic objectives.`,
        key_actions: [`Launch ${channel.channel.toLowerCase()} campaign`, "Execute targeting strategy", "Implement measurement framework"],
        success_metric: `Track ${channel.intent.toLowerCase()}-intent conversions`,
        budget_percent: percentages[index] || 5,
        why_it_works: `This channel works effectively for ${form.motion} because it captures ${channel.intent.toLowerCase()}-intent customers at the right moment.`
      }));
      
      // Assemble final response
      const derivedGoal = form.motion === "custom" && form.action_custom 
        ? `Goal aligned to: ${form.action_custom}`
        : {
            ecom_checkout: "Online orders",
            saas_checkout: "Paid subscriptions", 
            store_visit: "In-store sales",
            lead_capture: "Qualified leads"
          }[form.motion] || "Business growth";
      
      let json = {
        meta: {
          title: "Marketing Strategy Report",
          country: form.country,
          sector: form.sector || "General",
          goal: derivedGoal
        },
        market_foundation: marketData?.market_foundation || "Market analysis shows strong growth potential in this sector with increasing customer demand.",
        strategy_pillars: strategyData?.strategy_pillars || "Pillar 1: Customer Focus\nPrioritise customer satisfaction and retention through exceptional service delivery.\n\nPillar 2: Market Differentiation\nEstablish clear competitive advantages through unique value propositions.\n\nPillar 3: Operational Excellence\nOptimise processes and systems to deliver consistent, high-quality results.",
        personas: personaData?.personas || "Primary: Target Customer\nPrimary segment demonstrates strong purchasing intent and values quality solutions.\n\nSecondary: Secondary Market\nThis segment shows growing interest and represents expansion opportunities.\n\nTertiary: Emerging Segment\nEmerging customer group with future growth potential.",
        competitors_brief: marketData?.competitors_brief || `The competitive landscape includes ${competitorText} among other market players. Analysis shows opportunities for differentiation through superior customer experience and targeted positioning.`,
        differentiators: strategyData?.differentiators || "Core Differentiation\nPosition the brand through superior quality and customer service excellence.\n\nValue Proposition\nDeliver exceptional value through innovative solutions and customer-centric approach.\n\nPositioning Statement\nFor customers who value quality, this brand delivers superior results through proven expertise.",
        seven_ps: personaData?.seven_ps || "Product\nDevelop high-quality offerings that meet customer needs and exceed expectations.\n\nPrice\nImplement value-based pricing that reflects quality whilst remaining competitive.\n\nPlace\nEstablish distribution channels that maximise customer convenience and accessibility.\n\nPromotion\nExecute integrated marketing communications to build awareness and drive engagement.\n\nPeople\nDevelop team capabilities to deliver exceptional customer experiences.\n\nProcess\nOptimise operations to ensure consistent quality and efficient service delivery.\n\nPhysical Evidence\nCreate tangible elements that reinforce brand quality and professionalism.",
        channel_playbook: channelPlaybook,
        budget: {
          band: form.budget_band || "Low",
          allocation: `Primary Allocation\n${channelPlaybook[0]?.channel}: ${channelPlaybook[0]?.budget_percent}% to ${channelPlaybook[0]?.role.toLowerCase()}.\n\nSecondary Allocation\n${channelPlaybook[1]?.channel}: ${channelPlaybook[1]?.budget_percent}% to ${channelPlaybook[1]?.role.toLowerCase()}.\n\nSupporting Channels\n${channelPlaybook[2]?.channel}: ${channelPlaybook[2]?.budget_percent}% to ${channelPlaybook[2]?.role.toLowerCase()}.\n\nAllocation Rationale\nPrioritise the primary channel to capture high-intent demand whilst supporting with secondary channels for comprehensive market coverage.`
        },
        calendar_next_90_days: planningData?.calendar_next_90_days || "Month 1: Foundation\nEstablish core marketing infrastructure and launch primary campaigns.\n\nMonth 2: Scaling\nExpand successful initiatives and optimise performance across channels.\n\nMonth 3: Optimisation\nRefine strategies based on performance data and prepare for next quarter.",
        kpis: planningData?.kpis || "Channel KPIs\nTrack channel-specific metrics including conversion rates, cost per acquisition, and engagement levels.\n\nBusiness KPIs\nMonitor revenue growth, customer acquisition, and market share expansion.\n\nMeasurement Framework\nImplement analytics tools and regular reporting to track performance and inform decisions.",
        risks_and_safety_nets: planningData?.risks_and_safety_nets || "Business Risks\nMarket competition, economic fluctuations, and changing customer preferences.\n\nMitigation Strategies\nDiversify marketing channels, maintain financial reserves, and implement agile response capabilities.",
        experiments: planningData?.experiments || "Priority Tests\nExecute A/B tests on messaging, targeting, and channel performance.\n\nTesting Framework\nImplement systematic testing with statistical significance and clear success metrics."
      };
      
      // Apply British English normalization
      json = normalizeBritishEnglish(json);
      
      return new Response(JSON.stringify(json), cors(200, origin));

    } catch (e) {
      console.error('Worker error:', e.message);
      if (e.name === 'TimeoutError' || e.message.includes('timeout') || e.message.includes('aborted')) {
        return new Response(
          JSON.stringify({ error: "AI service is taking longer than expected. Please try again with a simpler request or check your connection." }),
          cors(408, origin)
        );
      }
      return new Response(
        JSON.stringify({ error: "internal_server_error" }),
        cors(500, origin)
      );
    }
  }
};

// British English normalization function
function normalizeBritishEnglish(obj) {
  const usToUkMap = {
    'ads': 'adverts',
    'organizations': 'organisations',
    'realize': 'realise',
    'optimize': 'optimise',
    'analyze': 'analyse',
    'behavior': 'behaviour',
    'color': 'colour',
    'center': 'centre',
    'program': 'programme',
    'while': 'whilst',
    'among': 'amongst',
    'favorite': 'favourite',
    'honor': 'honour',
    'labor': 'labour',
    'flavor': 'flavour',
    'neighborhood': 'neighbourhood',
    'traveled': 'travelled',
    'canceled': 'cancelled',
    'modeling': 'modelling'
  };
  
  function normalizeText(text) {
    if (typeof text !== 'string') return text;
    let result = text;
    for (const [us, uk] of Object.entries(usToUkMap)) {
      const regex = new RegExp(`\\b${us}\\b`, 'gi');
      result = result.replace(regex, uk);
    }
    return result;
  }
  
  function walkObject(obj) {
    if (typeof obj === 'string') {
      return normalizeText(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(walkObject);
    } else if (obj && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = walkObject(value);
      }
      return result;
    }
    return obj;
  }
  
  return walkObject(obj);
}

function cors(status = 200, origin = null) {
  const allowedOrigins = [
    'http://localhost:5000',
    'https://localhost:5000', 
    'http://127.0.0.1:5000',
    'https://127.0.0.1:5000',
    'https://4ed238b6-44fe-47f0-8f40-754dbed6c70c-00-y3il5bpx45gx.sisko.replit.dev'
  ];
  
  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : null;
  
  const headers = {
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY", 
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  };

  if (corsOrigin) {
    headers["Access-Control-Allow-Origin"] = corsOrigin;
    headers["Access-Control-Allow-Methods"] = "POST,OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Vary"] = "Origin";
  }
  
  return { status, headers };
}