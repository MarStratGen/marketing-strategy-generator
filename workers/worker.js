/*  ─────────────────────────────────────────────
    Marketing Strategy Generator Worker - Optimized
    ───────────────────────────────────────────── */
const MODEL = "gpt-4o";

// Sanitization function to remove markdown and normalize formatting
function sanitizeContent(obj) {
  if (typeof obj === 'string') {
    return obj
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold**
      .replace(/\*(.*?)\*/g, '$1')      // Remove *italic*
      .replace(/__(.*?)__/g, '$1')      // Remove __underline__
      .replace(/#{1,6}\s/g, '')         // Remove # headings
      .replace(/[-*]\s/g, '• ')         // Normalize bullets to •
      .replace(/\n{3,}/g, '\n\n')       // Collapse multiple newlines
      .trim();
  } else if (Array.isArray(obj)) {
    return obj.map(item => sanitizeContent(item));
  } else if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeContent(value);
    }
    return sanitized;
  }
  return obj;
}

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

    /* 7. SINGLE OPTIMIZED REQUEST FOR 20-SECOND GENERATION */
    try {
      const competitorText = form.competitor?.trim() ? form.competitor.trim() : null;
      const audienceText = form.audiences?.join(", ") || "target customers";
      
      // Create abort controller for 28-second deadline
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 80000);
      
      // Single optimized GPT-4o request with strict structured output
      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.25,
          max_tokens: 2800,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "marketing_strategy",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  market_foundation: {
                    type: "object",
                    properties: {
                      market_overview: { type: "string" },
                      customer_behaviour: { type: "string" },
                      market_opportunities: { type: "string" },
                      competitor_analysis: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          positioning: { type: "string" },
                          strengths: { type: "string" },
                          weaknesses: { type: "string" },
                          differentiation_opportunities: { type: "string" }
                        },
                        required: ["name", "positioning", "strengths", "weaknesses", "differentiation_opportunities"],
                        additionalProperties: false
                      }
                    },
                    required: ["market_overview", "customer_behaviour", "market_opportunities"],
                    additionalProperties: false
                  },
                  strategy_pillars: { type: "string" },
                  personas: { type: "string" },
                  differentiators: { type: "string" },
                  seven_ps: { type: "string" },
                  calendar_next_90_days: { type: "string" },
                  kpis: {
                    type: "object",
                    properties: {
                      measurement_and_tracking: { type: "string" },
                      performance_indicators: { type: "string" },
                      analytics_framework: { type: "string" }
                    },
                    required: ["measurement_and_tracking", "performance_indicators", "analytics_framework"],
                    additionalProperties: false
                  },
                  risks_and_safety_nets: {
                    type: "object",
                    properties: {
                      primary_risks: { type: "string" },
                      mitigation_strategies: { type: "string" },
                      contingency_plans: { type: "string" }
                    },
                    required: ["primary_risks", "mitigation_strategies", "contingency_plans"],
                    additionalProperties: false
                  }
                },
                required: ["market_foundation", "strategy_pillars", "personas", "differentiators", "seven_ps", "calendar_next_90_days", "kpis", "risks_and_safety_nets"],
                additionalProperties: false
              }
            }
          },
          messages: [
            { 
              role: "system", 
              content: "Expert marketing strategist. British English only. PLAIN TEXT ONLY - no markdown, no bold, no asterisks, no headings. Use bullet character '• ' only at start of list items. Never include percentage targets or specific numbers unless provided in form data. Write dense, specific, form-relevant content." 
            },
            { 
              role: "user", 
              content: `Generate marketing strategy for ${form.product_type} in ${form.country} ${form.sector}. Target: ${audienceText}.${competitorText ? ` Main competitor to analyze: ${competitorText}` : ' No specific competitor provided - focus on general market positioning.'}

Generate detailed JSON with structured format:
- market_foundation: object with market_overview, customer_behaviour, market_opportunities${competitorText ? ', and competitor_analysis object with detailed analysis of the provided competitor' : ' (no competitor analysis required)'}
- strategy_pillars: dense content with bullet points for 3 specific strategic pillars
- personas: detailed primary, secondary, tertiary personas with realistic names and specific behaviours for ${form.product_type} customers
- differentiators: core differentiation, value proposition, positioning statement with bullet points
- seven_ps: detailed analysis of Product, Price, Place, Promotion, People, Process, Physical Evidence
- calendar_next_90_days: realistic 90-day implementation timeline with specific actionable tasks
- kpis: structured object with measurement_and_tracking, performance_indicators (no percentage targets), analytics_framework
- risks_and_safety_nets: structured object with primary_risks, mitigation_strategies, contingency_plans specific to ${form.product_type} business in ${form.country}` 
            }
          ]
        }),
        signal: abortController.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!aiResponse.ok) {
        console.error('OpenAI API failed:', aiResponse.status);
        throw new Error('AI service unavailable');
      }
      
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content;
      
      let aiGenerated;
      try {
        aiGenerated = JSON.parse(content);
      } catch (e) {
        console.error('Failed to parse AI response:', content);
        throw new Error('Invalid AI response');
      }
      
      // Validate competitor coverage for single competitor
      if (competitorText && aiGenerated?.market_foundation?.competitor_analysis) {
        const analyzedName = aiGenerated.market_foundation.competitor_analysis.name?.toLowerCase().trim();
        const requiredName = competitorText.toLowerCase().trim();
        
        console.log('Required competitor:', requiredName);
        console.log('Analyzed competitor:', analyzedName);
        
        // Check if names match (allowing some flexibility)
        const matches = analyzedName === requiredName || 
                       analyzedName?.includes(requiredName) || 
                       requiredName.includes(analyzedName);
        
        if (!matches) {
          console.error('Competitor analysis name mismatch:', { required: requiredName, analyzed: analyzedName });
          console.warn('Proceeding with competitor name mismatch');
        }
      } else if (competitorText && !aiGenerated?.market_foundation?.competitor_analysis) {
        console.warn('Competitor was provided but no analysis generated');
      }
      
      // Sanitize content to remove markdown and normalize formatting
      aiGenerated = sanitizeContent(aiGenerated);
      
      // Generate channel playbook with QUALITY content (not templated)
      const channelByMotion = {
        ecom_checkout: [
          { 
            channel: "Search advertising", 
            intent: "High", 
            role: "Capture purchase-ready customers",
            summary: "Target high-intent search queries to capture customers actively looking to purchase. Focus on product-specific keywords and commercial terms.",
            key_actions: ["Launch Google Ads campaigns targeting purchase keywords", "Implement Shopping campaigns for product visibility", "Optimise landing pages for conversion"],
            success_metric: "Cost per acquisition and conversion rate",
            budget_percent: 35,
            why_it_works: "Search advertising captures customers at the moment of purchase intent, delivering the highest conversion rates and ROI for ecommerce businesses."
          },
          { 
            channel: "Paid social media", 
            intent: "Mid", 
            role: "Generate demand and social proof",
            summary: "Use targeted social advertising to create awareness, showcase products, and drive traffic through engaging visual content and social proof.",
            key_actions: ["Launch Facebook and Instagram campaigns", "Create engaging visual content showcasing products", "Implement retargeting campaigns for website visitors"],
            success_metric: "Click-through rate and social engagement",
            budget_percent: 25,
            why_it_works: "Social media allows you to reach customers in discovery mode, build brand awareness, and create social proof through user-generated content."
          },
          { 
            channel: "Email marketing", 
            intent: "Mid", 
            role: "Nurture leads and encourage repeat purchases",
            summary: "Develop automated email sequences to nurture prospects, recover abandoned carts, and encourage repeat purchases from existing customers.",
            key_actions: ["Set up abandoned cart recovery sequences", "Create welcome series for new subscribers", "Develop retention campaigns for existing customers"],
            success_metric: "Email open rates and click-to-purchase conversion",
            budget_percent: 20,
            why_it_works: "Email marketing provides direct access to interested prospects and customers, offering excellent ROI through personalised messaging and automation."
          },
          { 
            channel: "Influencer partnerships", 
            intent: "Mid", 
            role: "Build trust through authentic recommendations",
            summary: "Partner with relevant influencers to showcase products authentically, reaching engaged audiences who trust their recommendations.",
            key_actions: ["Identify micro-influencers in your niche", "Develop product collaboration programmes", "Track referral codes and affiliate links"],
            success_metric: "Influencer referral conversions and brand mention engagement",
            budget_percent: 15,
            why_it_works: "Influencer partnerships leverage trusted voices to reach engaged audiences, providing social proof and authentic product recommendations."
          },
          { 
            channel: "Direct mail campaigns", 
            intent: "Mid", 
            role: "Create tangible brand experiences",
            summary: "Use targeted direct mail to create memorable brand touchpoints, especially effective for premium products and local markets.",
            key_actions: ["Design premium catalogue mailings", "Target high-value postcode areas", "Include exclusive discount codes for tracking"],
            success_metric: "Response rate and mail-to-purchase conversion",
            budget_percent: 5,
            why_it_works: "Direct mail cuts through digital noise, creating tangible brand experiences that drive consideration and purchase, especially for premium products."
          }
        ],
        saas_checkout: [
          {
            channel: "Search advertising",
            intent: "High",
            role: "Capture solution-seeking prospects",
            summary: "Target problem-focused and solution keywords to capture prospects actively seeking software solutions like yours.",
            key_actions: ["Launch campaigns targeting problem-solution keywords", "Create landing pages for specific use cases", "Implement free trial sign-up tracking"],
            success_metric: "Cost per trial signup and trial-to-paid conversion",
            budget_percent: 35,
            why_it_works: "Search advertising captures prospects when they're actively seeking solutions, providing high-quality leads ready to evaluate your software."
          },
          {
            channel: "Content marketing",
            intent: "Mid",
            role: "Educate prospects and build authority",
            summary: "Create valuable content that educates prospects about their challenges whilst positioning your solution as the answer.",
            key_actions: ["Develop comprehensive guides and case studies", "Create video tutorials and demos", "Optimise content for search engines"],
            success_metric: "Content engagement and content-to-trial conversion",
            budget_percent: 25,
            why_it_works: "Content marketing builds trust and authority whilst educating prospects, creating a natural path from awareness to consideration."
          },
          {
            channel: "LinkedIn advertising",
            intent: "Mid",
            role: "Target decision-makers professionally",
            summary: "Use LinkedIn's professional targeting to reach decision-makers and influencers in companies that match your ideal customer profile.",
            key_actions: ["Launch account-based marketing campaigns", "Target by job title and company size", "Create professional thought leadership content"],
            success_metric: "LinkedIn lead quality and professional engagement",
            budget_percent: 20,
            why_it_works: "LinkedIn provides access to professional decision-makers in a business context, ideal for B2B software sales and lead generation."
          },
          {
            channel: "Webinars and demos",
            intent: "High",
            role: "Demonstrate value and convert trials",
            summary: "Host educational webinars and product demonstrations to showcase your software's capabilities and convert interested prospects.",
            key_actions: ["Schedule regular product demonstration sessions", "Create educational webinar content", "Follow up with attendees personally"],
            success_metric: "Webinar attendance and demo-to-signup conversion",
            budget_percent: 15,
            why_it_works: "Webinars and demos allow prospects to see your software in action, addressing objections and demonstrating clear value propositions."
          },
          {
            channel: "Trade publications",
            intent: "Mid",
            role: "Build industry credibility",
            summary: "Advertise in respected industry publications to build credibility and reach decision-makers who trust these authoritative sources.",
            key_actions: ["Place adverts in relevant trade magazines", "Contribute thought leadership articles", "Sponsor industry newsletters"],
            success_metric: "Publication response and industry recognition",
            budget_percent: 5,
            why_it_works: "Trade publications provide credibility and reach decision-makers who rely on industry sources for software recommendations."
          }
        ]
      };
      
      // Get channels for motion or default to ecom
      const motionChannels = channelByMotion[form.motion] || channelByMotion.ecom_checkout;
      
      // Determine goal
      const derivedGoal = form.motion === "custom" && form.action_custom 
        ? `Goal aligned to: ${form.action_custom}`
        : {
            ecom_checkout: "Online orders",
            saas_checkout: "Paid subscriptions", 
            store_visit: "In-store sales",
            lead_capture: "Qualified leads"
          }[form.motion] || "Business growth";
      
      // Assemble final response using structured AI output (no fallbacks)
      if (!aiGenerated || !aiGenerated.market_foundation || !aiGenerated.kpis || !aiGenerated.risks_and_safety_nets) {
        throw new Error('AI response missing required structured sections');
      }

      // Convert structured market foundation to legacy format for frontend compatibility
      const competitorSection = aiGenerated.market_foundation.competitor_analysis ? 
        `\n\n• Competitor Analysis\n${aiGenerated.market_foundation.competitor_analysis.name}: ${aiGenerated.market_foundation.competitor_analysis.positioning} Strengths include ${aiGenerated.market_foundation.competitor_analysis.strengths} However, ${aiGenerated.market_foundation.competitor_analysis.weaknesses} This creates opportunities to ${aiGenerated.market_foundation.competitor_analysis.differentiation_opportunities}` : '';
        
      const market_foundation_legacy = `• Market Overview\n${aiGenerated.market_foundation.market_overview}\n\n• Customer Behaviour\n${aiGenerated.market_foundation.customer_behaviour}\n\n• Market Opportunities\n${aiGenerated.market_foundation.market_opportunities}${competitorSection}`;

      // Convert structured KPIs to legacy format
      const kpis_legacy = `• Measurement & Tracking\n${aiGenerated.kpis.measurement_and_tracking}\n\n• Performance Indicators\n${aiGenerated.kpis.performance_indicators}\n\n• Analytics Framework\n${aiGenerated.kpis.analytics_framework}`;

      // Convert structured risks to legacy format
      const risks_legacy = `• Primary Risks\n${aiGenerated.risks_and_safety_nets.primary_risks}\n\n• Mitigation Strategies\n${aiGenerated.risks_and_safety_nets.mitigation_strategies}\n\n• Contingency Plans\n${aiGenerated.risks_and_safety_nets.contingency_plans}`;

      let json = {
        meta: {
          title: "Marketing Strategy Report",
          country: form.country,
          sector: form.sector || "General",
          goal: derivedGoal
        },
        market_foundation: market_foundation_legacy,
        strategy_pillars: aiGenerated.strategy_pillars,
        personas: aiGenerated.personas,
        competitors_brief: aiGenerated.market_foundation.competitor_analysis ? 
          `• Competitor Analysis\n${aiGenerated.market_foundation.competitor_analysis.name}: ${aiGenerated.market_foundation.competitor_analysis.positioning} Strengths include ${aiGenerated.market_foundation.competitor_analysis.strengths} However, ${aiGenerated.market_foundation.competitor_analysis.weaknesses} This creates opportunities to ${aiGenerated.market_foundation.competitor_analysis.differentiation_opportunities}` : 
          null,
        differentiators: aiGenerated.differentiators,
        seven_ps: aiGenerated.seven_ps,
        channel_playbook: motionChannels,
        budget: {
          band: form.budget_band || "Low",
          allocation: `Primary Channel Investment\n${motionChannels[0]?.channel}: ${motionChannels[0]?.budget_percent}% allocated to ${motionChannels[0]?.role.toLowerCase()} with focus on high-conversion activities.\n\nSecondary Channel Support\n${motionChannels[1]?.channel}: ${motionChannels[1]?.budget_percent}% dedicated to ${motionChannels[1]?.role.toLowerCase()} for comprehensive market coverage.\n\nSupporting Channels\n${motionChannels[2]?.channel}: ${motionChannels[2]?.budget_percent}% investment in ${motionChannels[2]?.role.toLowerCase()} activities.\n${motionChannels[3]?.channel}: ${motionChannels[3]?.budget_percent}% allocation for ${motionChannels[3]?.role.toLowerCase()} initiatives.\n${motionChannels[4]?.channel}: ${motionChannels[4]?.budget_percent}% reserved for ${motionChannels[4]?.role.toLowerCase()} programmes.\n\nStrategic Rationale\nThis allocation prioritises high-impact channels that capture immediate demand whilst building broader market awareness and long-term brand equity through diversified channel investment.`
        },
        calendar_next_90_days: aiGenerated.calendar_next_90_days,
        kpis: kpis_legacy,
        risks_and_safety_nets: risks_legacy
      };
      
      // Apply British English normalization
      json = normalizeBritishEnglish(json);
      
      return new Response(JSON.stringify(json), cors(200, origin));

    } catch (e) {
      console.error('Worker error:', e.message);
      if (e.name === 'TimeoutError' || e.message.includes('timeout') || e.message.includes('aborted')) {
        return new Response(
          JSON.stringify({ error: "AI service is taking longer than expected. Please try again." }),
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