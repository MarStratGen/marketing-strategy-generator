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
          max_tokens: 1500,
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
              content: "Expert marketing strategist. British English only. Write dense, specific content. Use bullet points (•) for subsections. Include named competitors prominently. Be realistic and specific to the business type." 
            },
            { 
              role: "user", 
              content: `Generate marketing strategy for ${form.product_type} in ${form.country} ${form.sector}. Target: ${audienceText}. Competitors: ${competitorText}. Write detailed, realistic content with proper formatting using bullet points for subsections. JSON with: market_foundation (Market Overview, Customer Behaviour, Competitor Analysis featuring ${competitorText}, Market Opportunities), strategy_pillars (• Pillar 1: [specific name] - detailed strategy focused on this business type, • Pillar 2: [specific name] - realistic strategy for market entry/growth, • Pillar 3: [specific name] - practical implementation strategy), personas (• Primary Persona: [realistic name] Age, income, behaviour patterns, specific shopping habits and motivations relevant to ${form.product_type}. • Secondary Persona: [realistic name] Demographics, behaviour, and purchasing patterns. • Tertiary Persona: [realistic name] Target characteristics and engagement preferences), competitors_brief (comprehensive analysis of ${competitorText} including market positioning, strengths, weaknesses, and differentiation opportunities), differentiators (• Core Differentiation: specific advantages over ${competitorText}, • Value Proposition: unique benefits for customers, • Positioning Statement: clear market position), seven_ps (• Product: specific improvements/features, • Price: realistic pricing strategy, • Place: distribution channels, • Promotion: marketing tactics, • People: team requirements, • Process: operational improvements, • Physical Evidence: brand touchpoints), calendar_next_90_days (• Week 1-2: Foundation Phase - realistic setup tasks like market research, brand assets, initial campaigns, • Week 3-4: Launch Phase - specific launch activities, content creation, campaign execution, • Week 5-8: Scaling Phase - expand successful tactics, A/B testing, optimization, • Week 9-12: Optimisation Phase - data analysis, strategy refinement, planning next quarter), kpis (• Measurement & Tracking: specific metrics based on chosen channels and strategies, tracking methods, reporting frequency, • Performance Indicators: realistic targets based on industry benchmarks, • Analytics Framework: tools and dashboards for monitoring progress), risks_and_safety_nets (• Primary Risks: realistic market/business risks for ${form.product_type} in ${form.country}, • Mitigation Strategies: specific actions to reduce identified risks, • Contingency Plans: backup strategies if primary approach fails).` 
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
        market_foundation: aiGenerated?.market_foundation || "• Market Overview\nThe sector demonstrates steady growth driven by evolving customer needs and digital transformation trends, creating opportunities for innovative businesses to establish strong market presence.\n\n• Customer Behaviour\nTarget customers are increasingly research-driven, comparing options online before purchasing, and value businesses that demonstrate expertise and transparency in their communications.\n\n• Market Opportunities\nGrowing demand for quality solutions, increased online purchasing behaviour, and gaps in customer service excellence create clear opportunities for well-positioned businesses to capture market share.",
        strategy_pillars: aiGenerated?.strategy_pillars || "• Customer-Centric Growth\nBuild sustainable growth through deep customer understanding, exceptional service delivery, and data-driven decision making that creates lasting competitive advantages in the marketplace.\n\n• Market Differentiation\nEstablish clear competitive positioning through innovative solutions, superior quality, and unique value propositions that address specific customer pain points competitors haven't solved.\n\n• Operational Excellence\nDevelop efficient systems and processes that enable consistent service delivery, cost optimization, and scalable operations whilst maintaining high quality standards.",
        personas: aiGenerated?.personas || "• Primary Persona: Sarah Mitchell\nAge 38, marketing manager, £45,000 salary, values quality and reliability. Researches thoroughly before purchasing, reads multiple reviews, and prioritises brands with strong reputation. Shops mainly online during evenings, influenced by expert recommendations and case studies.\n\n• Secondary Persona: James Thompson\nAge 32, small business owner, budget-conscious but growth-focused. Compares multiple options carefully, seeks value for money, and makes decisions based on ROI potential. Active in business communities and influenced by peer recommendations.\n\n• Tertiary Persona: Emma Rodriguez\nAge 29, busy professional, values convenience and time-saving solutions. Willing to pay premium for excellent service and fast results. Prefers mobile-first experiences and subscription-based services that simplify her workflow.",
        competitors_brief: aiGenerated?.competitors_brief || `The competitive landscape includes ${competitorText} as key market players alongside other established competitors. Analysis reveals opportunities for differentiation through superior customer experience, innovative solutions, and strategic market positioning that addresses unmet customer needs.`,
        differentiators: aiGenerated?.differentiators || "• Core Differentiation\nSpecialize in solving specific customer problems that competitors address only generally, offer superior customer support with faster response times and more personalized attention, and maintain higher quality standards through rigorous testing and continuous improvement processes.\n\n• Value Proposition\nDeliver measurable results that justify the investment, provide transparent communication throughout the customer journey, and offer flexible solutions that adapt to individual customer needs rather than one-size-fits-all approaches.\n\n• Positioning Statement\nFor customers who value reliability and results over lowest price, we provide the expertise, attention to detail, and commitment to success that ensures their investment delivers the outcomes they need to grow their business.",
        seven_ps: aiGenerated?.seven_ps || "• Product\nFocus on core product features that solve specific customer problems, gather customer feedback for continuous improvement, ensure quality standards exceed customer expectations, and develop unique features that differentiate from competitors.\n\n• Price\nResearch competitor pricing and position strategically within market ranges, consider value-based pricing that reflects product benefits, offer flexible pricing options for different customer segments, and test pricing strategies with small customer groups.\n\n• Place\nOptimize online presence for easy customer access, consider distribution partnerships that expand market reach, ensure mobile-friendly purchasing experience, and evaluate additional sales channels based on customer preferences.\n\n• Promotion\nDevelop clear messaging that communicates unique value, use targeted advertising on platforms where customers spend time, create content that educates and engages prospects, and leverage customer testimonials and case studies.\n\n• People\nTrain team members on customer service excellence, ensure consistent brand representation across all customer interactions, develop expertise that customers can trust, and create processes for handling customer inquiries efficiently.\n\n• Process\nStreamline customer journey from awareness to purchase, eliminate friction points in buying process, establish clear communication protocols, and create systems for tracking and improving customer satisfaction.\n\n• Physical Evidence\nMaintain professional brand presentation across all materials, ensure website design reflects quality and trustworthiness, use consistent visual identity in all communications, and create tangible proof of quality through certifications or awards.",
        channel_playbook: motionChannels,
        budget: {
          band: form.budget_band || "Low",
          allocation: `Primary Channel Investment\n${motionChannels[0]?.channel}: ${motionChannels[0]?.budget_percent}% allocated to ${motionChannels[0]?.role.toLowerCase()} with focus on high-conversion activities.\n\nSecondary Channel Support\n${motionChannels[1]?.channel}: ${motionChannels[1]?.budget_percent}% dedicated to ${motionChannels[1]?.role.toLowerCase()} for comprehensive market coverage.\n\nSupporting Channels\n${motionChannels[2]?.channel}: ${motionChannels[2]?.budget_percent}% investment in ${motionChannels[2]?.role.toLowerCase()} activities.\n${motionChannels[3]?.channel}: ${motionChannels[3]?.budget_percent}% allocation for ${motionChannels[3]?.role.toLowerCase()} initiatives.\n${motionChannels[4]?.channel}: ${motionChannels[4]?.budget_percent}% reserved for ${motionChannels[4]?.role.toLowerCase()} programmes.\n\nStrategic Rationale\nThis allocation prioritises high-impact channels that capture immediate demand whilst building broader market awareness and long-term brand equity through diversified channel investment.`
        },
        calendar_next_90_days: aiGenerated?.calendar_next_90_days || "• Week 1-2: Foundation Phase\nSet up Google Analytics and Facebook Pixel tracking, create initial brand assets and messaging, research target keywords, establish social media presence, and launch basic website optimization with clear value propositions.\n\n• Week 3-4: Launch Phase\nLaunch targeted Google Ads campaigns, begin content marketing with blog posts and social content, start email list building, initiate customer feedback collection, and implement basic conversion tracking across all touchpoints.\n\n• Week 5-8: Scaling Phase\nAnalyse performance data and double down on successful channels, expand content creation based on engagement patterns, introduce referral programmes, optimize landing pages for better conversion, and begin customer retention initiatives.\n\n• Week 9-12: Optimisation Phase\nRefine targeting based on customer data, implement automation for lead nurturing, plan seasonal campaigns, establish partnerships or collaborations, and prepare comprehensive strategy review for next quarter based on actual performance metrics.",
        kpis: aiGenerated?.kpis || "• Measurement & Tracking\nTrack website traffic sources and user behaviour patterns using Google Analytics, monitor conversion rates from each marketing channel, measure customer acquisition costs and lifetime value ratios, analyse content engagement and social media reach patterns.\n\n• Performance Indicators\nMonitor monthly website visitor growth and engagement duration, track email list growth and engagement rates, measure social media follower growth and content performance, analyse customer feedback scores and review ratings across platforms.\n\n• Analytics Framework\nUse Google Analytics for website performance tracking, implement Facebook Pixel for social media attribution, utilize email platform analytics for campaign monitoring, establish monthly reporting dashboard with key metrics, and conduct quarterly strategy reviews based on actual performance data.",
        risks_and_safety_nets: aiGenerated?.risks_and_safety_nets || "• Primary Risks\nIncreased competition from established players or new market entrants, changes in customer behaviour or economic conditions affecting purchasing power, dependency on single marketing channels that could become less effective, potential negative reviews or reputation issues that impact trust.\n\n• Mitigation Strategies\nDiversify marketing channels to avoid over-reliance on any single source, build strong customer relationships through excellent service to encourage word-of-mouth referrals, maintain emergency budget reserves for market challenges, and establish monitoring systems for early warning of reputation issues.\n\n• Contingency Plans\nDevelop backup marketing channels ready for quick activation, create crisis communication templates for reputation management, establish relationships with alternative suppliers or partners, and maintain flexible budget allocation that can be shifted between channels based on performance."
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