/*  ─────────────────────────────────────────────
    Marketing Strategy Generator Worker - Optimized
    ───────────────────────────────────────────── */
const MODEL = "gpt-4o";

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
      const competitorText = form.competitors?.length ? form.competitors.join(", ") : "market competitors";
      const audienceText = form.audiences?.join(", ") || "target customers";
      
      // Create abort controller for 22-second deadline
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 22000);
      
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
          max_tokens: 1400,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "marketing_strategy",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  market_foundation: { type: "string" },
                  strategy_pillars: { type: "string" },
                  personas: { type: "string" },
                  competitors_brief: { type: "string" },
                  differentiators: { type: "string" },
                  seven_ps: { type: "string" },
                  calendar_next_90_days: { type: "string" },
                  kpis: { type: "string" },
                  risks_and_safety_nets: { type: "string" }
                },
                required: ["market_foundation", "strategy_pillars", "personas", "competitors_brief", "differentiators", "seven_ps", "calendar_next_90_days", "kpis", "risks_and_safety_nets"],
                additionalProperties: false
              }
            }
          },
          messages: [
            { 
              role: "system", 
              content: "Expert marketing strategist. British English only. Write dense, specific content. No fluff. Include named competitors prominently." 
            },
            { 
              role: "user", 
              content: `Generate marketing strategy for ${form.product_type} in ${form.country} ${form.sector}. Target: ${audienceText}. Competitors: ${competitorText}. Use compact bullet points, specific tactics, no repeated ideas. JSON with: market_foundation (market overview, customer behaviour, competitor analysis featuring ${competitorText}, opportunities), strategy_pillars (3 pillars with names and strategies), personas (primary, secondary, tertiary with descriptions), competitors_brief (analysis of ${competitorText}), differentiators (core differentiation, value proposition, positioning), seven_ps (product, price, place, promotion, people, process, physical evidence strategies), calendar_next_90_days (Week 1-2 foundation, Week 3-4 launch, Week 5-8 scaling, Week 9-12 optimisation with specific weekly activities), kpis (channel and business KPIs with measurement framework), risks_and_safety_nets (primary risks, mitigation strategies, contingency plans).` 
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
      
      // Assemble final response with quality fallbacks
      let json = {
        meta: {
          title: "Marketing Strategy Report",
          country: form.country,
          sector: form.sector || "General",
          goal: derivedGoal
        },
        market_foundation: aiGenerated?.market_foundation || "Market analysis shows strong growth potential in this sector with increasing customer demand and clear opportunities for well-positioned businesses to capture market share through strategic positioning and targeted marketing approaches.",
        strategy_pillars: aiGenerated?.strategy_pillars || "Pillar 1: Customer Excellence\nDevelop deep customer understanding and deliver exceptional experiences that exceed expectations whilst building long-term loyalty and advocacy.\n\nPillar 2: Market Leadership\nEstablish thought leadership and competitive advantage through innovation, quality excellence, and strategic positioning in key market segments.\n\nPillar 3: Operational Efficiency\nOptimise operational processes and systems to deliver consistent quality, reduce costs, and enable scalable growth whilst maintaining service excellence.",
        personas: aiGenerated?.personas || "Primary Persona: Core Customer\nRepresents the primary target segment with strong purchasing power and clear need for your solution. These customers value quality and reliability above price.\n\nSecondary Persona: Growth Opportunity\nEmerging customer segment showing increasing interest and purchasing potential. Represents expansion opportunities with specific needs and preferences.\n\nTertiary Persona: Future Market\nForward-looking segment that may become important over time. Early adopters who influence broader market trends and adoption patterns.",
        competitors_brief: aiGenerated?.competitors_brief || `The competitive landscape includes ${competitorText} as key market players alongside other established competitors. Analysis reveals opportunities for differentiation through superior customer experience, innovative solutions, and strategic market positioning that addresses unmet customer needs.`,
        differentiators: aiGenerated?.differentiators || "Core Differentiation\nEstablish clear competitive advantages through superior quality, exceptional customer service, and innovative solutions that address specific market gaps competitors haven't adequately addressed.\n\nValue Proposition\nDeliver exceptional value through proven expertise, personalised service approaches, and results-driven solutions that consistently exceed customer expectations and industry standards.\n\nPositioning Statement\nFor customers who demand excellence and reliability, we deliver superior results through innovative solutions, proven expertise, and unwavering commitment to customer success.",
        seven_ps: aiGenerated?.seven_ps || "Product\nDevelop high-quality offerings that precisely meet customer needs through continuous innovation, quality assurance, and customer feedback integration for market-leading solutions.\n\nPrice\nImplement value-based pricing that reflects quality and innovation whilst remaining competitive and accessible to target customer segments through strategic pricing architecture.\n\nPlace\nEstablish optimised distribution channels that maximise customer convenience, accessibility, and reach through strategic partnerships and multi-channel presence.\n\nPromotion\nExecute integrated marketing communications that build awareness, drive engagement, and establish thought leadership through consistent messaging across all touchpoints.\n\nPeople\nDevelop team capabilities and customer-focused culture that delivers exceptional experiences through continuous training, empowerment, and performance excellence.\n\nProcess\nOptimise operational processes to ensure consistent quality, efficient service delivery, and seamless customer journeys across all interactions and touchpoints.\n\nPhysical Evidence\nCreate tangible brand elements that reinforce quality, professionalism, and credibility through consistent visual identity, professional facilities, and service standards.",
        channel_playbook: motionChannels,
        budget: {
          band: form.budget_band || "Low",
          allocation: `Primary Channel Investment\n${motionChannels[0]?.channel}: ${motionChannels[0]?.budget_percent}% allocated to ${motionChannels[0]?.role} with focus on high-conversion activities.\n\nSecondary Channel Support\n${motionChannels[1]?.channel}: ${motionChannels[1]?.budget_percent}% dedicated to ${motionChannels[1]?.role} for comprehensive market coverage.\n\nSupporting Channels\n${motionChannels[2]?.channel}: ${motionChannels[2]?.budget_percent}% investment in ${motionChannels[2]?.role} activities.\n${motionChannels[3]?.channel}: ${motionChannels[3]?.budget_percent}% allocation for ${motionChannels[3]?.role} initiatives.\n${motionChannels[4]?.channel}: ${motionChannels[4]?.budget_percent}% reserved for ${motionChannels[4]?.role} programmes.\n\nStrategic Rationale\nThis allocation prioritises high-impact channels that capture immediate demand whilst building broader market awareness and long-term brand equity through diversified channel investment.`
        },
        calendar_next_90_days: aiGenerated?.calendar_next_90_days || "Week 1-2: Foundation Phase\nEstablish core marketing infrastructure, set up tracking systems, and launch primary campaign initiatives with baseline measurement frameworks.\n\nWeek 3-4: Launch Phase\nExecute main marketing campaigns across priority channels, implement customer acquisition activities, and begin performance monitoring and optimisation.\n\nWeek 5-8: Scaling Phase\nExpand successful initiatives, optimise underperforming channels, introduce secondary marketing tactics, and scale winning campaigns for broader reach.\n\nWeek 9-12: Optimisation Phase\nRefine strategies based on performance data, implement advanced tactics, prepare next quarter initiatives, and document learnings for future campaigns.",
        kpis: aiGenerated?.kpis || "Channel KPIs\nTrack channel-specific performance metrics including conversion rates, cost per acquisition, customer lifetime value, and return on advertising spend for each marketing channel and campaign.\n\nBusiness KPIs\nMonitor overall business performance through revenue growth, customer acquisition costs, market share expansion, customer satisfaction scores, and competitive positioning metrics.\n\nMeasurement Framework\nImplement comprehensive analytics infrastructure with real-time dashboards, regular reporting cadence, and data-driven decision-making processes for continuous optimisation and strategic adjustment.",
        risks_and_safety_nets: aiGenerated?.risks_and_safety_nets || "Primary Risks\nMarket competition intensification, economic fluctuations affecting customer spending, changing customer preferences, and potential supply chain or operational disruptions that could impact business performance.\n\nMitigation Strategies\nDiversify marketing channels to reduce dependency, maintain financial reserves for market volatility, implement agile response capabilities, and establish strong customer relationships for retention and loyalty.\n\nContingency Plans\nDevelop alternative channel strategies, establish emergency budget reallocation procedures, create crisis communication protocols, and maintain flexible operational capacity for rapid market response."
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