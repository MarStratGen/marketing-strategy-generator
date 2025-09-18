/*  ─────────────────────────────────────────────
    Marketing Strategy Generator Worker - Optimized
    ───────────────────────────────────────────── */
const MODEL = "gpt-4o";

// Sanitization function to remove markdown and normalize formatting
function sanitizeContent(obj) {
  if (typeof obj === "string") {
    return obj
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove **bold**
      .replace(/\*(.*?)\*/g, "$1") // Remove *italic*
      .replace(/__(.*?)__/g, "$1") // Remove __underline__
      .replace(/#{1,6}\s/g, "") // Remove # headings
      .replace(/[-*]\s/g, "• ") // Normalize bullets to •
      .replace(/\n{3,}/g, "\n\n") // Collapse multiple newlines
      .trim();
  } else if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeContent(item));
  } else if (obj && typeof obj === "object") {
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
    const origin = req.headers.get("Origin");
    const clientIP =
      req.headers.get("CF-Connecting-IP") ||
      req.headers.get("X-Forwarded-For") ||
      "unknown";
    const userAgent = req.headers.get("User-Agent") || "";
    const timestamp = Date.now();

    /* 1. CORS pre-flight */
    if (req.method === "OPTIONS") return new Response(null, cors(200, origin));

    /* 2. Only allow requests from approved origins */
    const allowedOrigins = [
      "http://localhost:5000",
      "https://localhost:5000",
      "http://127.0.0.1:5000",
      "https://127.0.0.1:5000",
      "https://4ed238b6-44fe-47f0-8f40-754dbed6c70c-00-y3il5bpx45gx.sisko.replit.dev",
      "https://marketingstratgenerator.com",
      "https://www.marketingstratgenerator.com",
    ];

    if (origin && !allowedOrigins.includes(origin)) {
      return new Response(
        JSON.stringify({ error: "forbidden_origin" }),
        cors(403, origin),
      );
    }

    /* 3. Handle /generate endpoint */
    const url = new URL(req.url);
    if (req.method !== "POST" || !url.pathname.endsWith("/generate")) {
      return new Response(
        JSON.stringify({ error: "method_not_allowed" }),
        cors(405, origin),
      );
    }

    /* 4. Bot protection and rate limiting */

    // Require Origin header (browsers only) or block
    if (!origin) {
      return new Response(
        JSON.stringify({
          error: "origin_required",
          message:
            "This API requires a valid Origin header from a web browser.",
        }),
        cors(403, origin),
      );
    }

    // Rate limiting temporarily disabled - will be added back with KV namespace

    /* 5. Input validation */
    let form;
    try {
      const text = await req.text();
      if (text.length > 10000) {
        return new Response(
          JSON.stringify({ error: "request_too_large" }),
          cors(413, origin),
        );
      }
      form = JSON.parse(text);
    } catch {
      return new Response(
        JSON.stringify({ error: "invalid_request" }),
        cors(400, origin),
      );
    }

    /* 6. Enhanced input validation and security */
    // Validate required fields (match frontend field names)
    if (!form.country || !form.product_type || !form.audiences) {
      return new Response(
        JSON.stringify({ error: "missing_required_fields" }),
        cors(400, origin),
      );
    }

    // Validate field lengths to prevent extremely long inputs
    const maxLengths = {
      country: 100,
      product_type: 1000,
      sector: 100,
      competitor: 500,
      action_custom: 500,
    };

    for (const [field, maxLength] of Object.entries(maxLengths)) {
      if (
        form[field] &&
        typeof form[field] === "string" &&
        form[field].length > maxLength
      ) {
        return new Response(
          JSON.stringify({
            error: "field_too_long",
            field: field,
            max_length: maxLength,
          }),
          cors(400, origin),
        );
      }
    }

    // Validate business_stage enum
    const validBusinessStages = ["launch", "growth"];
    if (
      form.business_stage &&
      !validBusinessStages.includes(form.business_stage)
    ) {
      return new Response(
        JSON.stringify({
          error: "invalid_business_stage",
          valid_values: validBusinessStages,
        }),
        cors(400, origin),
      );
    }

    // Validate audiences array and enforce limit
    if (!Array.isArray(form.audiences) || form.audiences.length === 0) {
      return new Response(
        JSON.stringify({ error: "audiences_must_be_non_empty_array" }),
        cors(400, origin),
      );
    }

    if (form.audiences.length > 3) {
      return new Response(
        JSON.stringify({
          error: "too_many_audiences",
          max_allowed: 3,
          provided: form.audiences.length,
        }),
        cors(400, origin),
      );
    }

    // Validate each audience length
    for (let i = 0; i < form.audiences.length; i++) {
      if (
        typeof form.audiences[i] !== "string" ||
        form.audiences[i].length > 200
      ) {
        return new Response(
          JSON.stringify({
            error: "audience_invalid",
            index: i,
            max_length: 200,
          }),
          cors(400, origin),
        );
      }
    }

    // Basic input sanitization to prevent injection attempts
    const sanitizeInput = (str) => {
      if (typeof str !== "string") return str;
      return str
        .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove script tags
        .replace(/javascript:/gi, "") // Remove javascript: protocols
        .replace(/on\w+\s*=/gi, "") // Remove event handlers
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
        .trim();
    };

    // Sanitize string inputs
    [
      "country",
      "product_type",
      "sector",
      "competitor",
      "action_custom",
    ].forEach((field) => {
      if (form[field]) {
        form[field] = sanitizeInput(form[field]);
      }
    });

    // Sanitize audience strings
    if (form.audiences) {
      form.audiences = form.audiences.map((audience) =>
        sanitizeInput(audience),
      );
    }

    /* 6. Check API key */
    if (!env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "api_key_not_configured" }),
        cors(503, origin),
      );
    }

    /* 7. SINGLE OPTIMIZED REQUEST FOR 20-SECOND GENERATION */
    try {
      const competitorText = form.competitor?.trim()
        ? form.competitor.trim()
        : null;

      // Additional validation: ensure audiences aren't empty after sanitization
      const validAudiences = form.audiences.filter(
        (a) => a && a.trim().length > 0,
      );
      if (validAudiences.length === 0) {
        return new Response(
          JSON.stringify({ error: "no_valid_audiences_after_sanitization" }),
          cors(400, origin),
        );
      }

      const audienceText = validAudiences.join(", ") || "target customers";
      const isLaunch = form.business_stage === "launch";

      // Create abort controller for 80-second deadline
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 80000);

      // Single optimized GPT-4o request - remove strict structured output for reliability
      const aiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: MODEL,
            temperature: 0.25,
            max_tokens: 2800,
            messages: [
              {
                role: "system",
                content:
                  "Expert marketing strategist. British English only. PLAIN TEXT ONLY - no markdown, no bold, no asterisks, no headings. Use bullet character '• ' only at start of list items. Never include percentage targets or specific numbers unless provided in form data. Write dense, specific, form-relevant content.",
              },
              {
                role: "user",
                content: `Generate marketing strategy for ${isLaunch ? "launching" : "growing an established"} ${form.product_type} business in ${form.country} ${form.sector ? `(${form.sector} sector)` : ""}. Target: ${audienceText}.${competitorText ? ` Main competitor to analyze: ${competitorText}` : " No specific competitor provided - focus on general market positioning."}

Respond with valid JSON only. Return EXACTLY these fields in this order with PLAIN TEXT STRINGS only (no objects, no arrays):

{
  "market_foundation": "Comprehensive market analysis as flowing text with paragraph breaks. Cover market overview, customer behaviour patterns, key opportunities${competitorText ? ", and detailed analysis of " + competitorText : ""}. Use natural paragraphs with occasional bullets for key insights.",
  "personas": "Three detailed customer personas as flowing text with clear paragraph separation. Each persona should include name, age range, background, lifestyle, pain points, motivations, and buying behaviour for ${form.product_type} customers.",
  "strategy_pillars": "Three core strategic pillars as flowing text with natural paragraph breaks. ${isLaunch ? "Focus on launch strategies including market entry, awareness building, and initial customer acquisition" : "Focus on growth strategies including market expansion, customer retention, and competitive positioning"} for ${form.product_type} business without excessive bullet points.",
  "seven_ps": "Complete marketing mix analysis covering Product, Price, Place, Promotion, People, Process, Physical Evidence as flowing business text with paragraph structure.",
  "channel_playbook": "Detailed channel strategy and tactics as flowing text with natural paragraph breaks. Cover digital and traditional channels relevant to ${form.product_type} in ${form.country}.",
  "budget": "Budget allocation and financial planning as flowing text with paragraph structure. Include investment priorities and cost considerations for ${form.product_type} marketing.",
  "calendar_next_90_days": "${isLaunch ? "Launch-focused 90-day timeline covering pre-launch, launch week, and post-launch optimization phases" : "Growth-focused 90-day plan with optimization, scaling, and expansion initiatives"} as flowing text with clear paragraph breaks and occasional bullets for key milestones only.",
  "kpis": "Comprehensive KPI framework as flowing business text covering measurement methods, specific performance indicators with realistic targets, and analytics setup. Use natural paragraphs.",
  "differentiators": "Core differentiation strategy, value proposition, and positioning statement as flowing business text with natural paragraph structure.",
  "risks_and_safety_nets": "Risk analysis covering primary risks, mitigation strategies, and contingency plans as flowing business document with natural paragraph structure."
}

Generate comprehensive, business-specific content for ${form.product_type} in ${form.country}. 

CRITICAL: Ensure the "personas" field contains detailed customer profiles with names, ages, backgrounds, and specific behaviours. Do not leave personas empty. Create 3 distinct personas for ${audienceText} customers in the ${form.country} market.

CRITICAL: Each field must be a PLAIN TEXT STRING with natural paragraph breaks (use \\n\\n between paragraphs). Never return objects, arrays, or undefined values. Write comprehensive flowing content without excessive bullet points or subheadings.

No markdown formatting.`,
              },
            ],
          }),
          signal: abortController.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("OpenAI API failed:", aiResponse.status, errorText);
        throw new Error(`AI service error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content;

      if (!content) {
        console.error("No content in AI response:", aiData);
        throw new Error("Empty AI response");
      }

      let aiGenerated;
      try {
        aiGenerated = JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse AI response as JSON:", content);
        console.error("Parse error:", e.message);
        throw new Error("Invalid JSON response from AI");
      }

      // Validate all required fields are present and are strings
      const requiredFields = [
        "market_foundation",
        "personas",
        "strategy_pillars",
        "seven_ps",
        "channel_playbook",
        "budget",
        "calendar_next_90_days",
        "kpis",
        "differentiators",
        "risks_and_safety_nets",
      ];
      const missingFields = requiredFields.filter(
        (field) =>
          !aiGenerated?.[field] || typeof aiGenerated[field] !== "string",
      );

      if (missingFields.length > 0) {
        console.error(
          "AI response missing or invalid fields:",
          missingFields,
          "Available keys:",
          Object.keys(aiGenerated || {}),
        );
        throw new Error(
          `Invalid AI response structure. Missing/invalid: ${missingFields.join(", ")}`,
        );
      }

      // Validate and repair personas if missing or too short
      if (
        !aiGenerated?.personas ||
        (typeof aiGenerated.personas === "string" &&
          aiGenerated.personas.length < 100)
      ) {
        console.log(
          "🔧 PERSONAS REPAIR: Personas missing or too short, triggering fallback generation",
        );

        try {
          const personasPrompt = `Generate exactly 3 detailed customer personas for ${isLaunch ? "a new" : "an established"} ${form.product_type} business targeting ${audienceText}. 

Format as bullet points with these details for each persona:
• Name (realistic first name)
• Age range
• Background and lifestyle
• Pain points and challenges
• Buying behaviour and motivations
• How they would discover ${form.product_type}

Be specific and realistic. No generic descriptions.`;

          const personasResponse = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                  {
                    role: "user",
                    content: personasPrompt,
                  },
                ],
                temperature: 0.7,
                max_tokens: 800,
              }),
            },
          );

          if (personasResponse.ok) {
            const personasData = await personasResponse.json();
            const generatedPersonas =
              personasData.choices[0]?.message?.content?.trim();
            if (generatedPersonas && generatedPersonas.length > 100) {
              aiGenerated.personas = generatedPersonas;
              console.log(
                "✅ PERSONAS REPAIR: Successfully generated fallback personas",
              );
            } else {
              console.error(
                "❌ PERSONAS REPAIR: Fallback generation returned insufficient content",
              );
              throw new Error("Failed to generate adequate personas content");
            }
          } else {
            console.error("❌ PERSONAS REPAIR: Fallback API call failed");
            throw new Error("Personas generation fallback failed");
          }
        } catch (error) {
          console.error(
            "❌ PERSONAS REPAIR: Exception during fallback:",
            error.message,
          );
          throw new Error("Critical personas generation failure");
        }
      }

      // Validate competitor coverage for single competitor
      if (
        competitorText &&
        aiGenerated?.market_foundation?.competitor_analysis
      ) {
        const analyzedName =
          aiGenerated.market_foundation.competitor_analysis.name
            ?.toLowerCase()
            .trim();
        const requiredName = competitorText.toLowerCase().trim();

        console.log("Required competitor:", requiredName);
        console.log("Analyzed competitor:", analyzedName);

        // Check if names match (allowing some flexibility)
        const matches =
          analyzedName === requiredName ||
          analyzedName?.includes(requiredName) ||
          requiredName.includes(analyzedName);

        if (!matches) {
          console.error("Competitor analysis name mismatch:", {
            required: requiredName,
            analyzed: analyzedName,
          });
          console.warn("Proceeding with competitor name mismatch");
        }
      } else if (
        competitorText &&
        !aiGenerated?.market_foundation?.competitor_analysis
      ) {
        console.warn("Competitor was provided but no analysis generated");
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
            summary:
              "Target high-intent search queries to capture customers actively looking to purchase. Focus on product-specific keywords and commercial terms.",
            key_actions: [
              "Launch Google Ads campaigns targeting purchase keywords",
              "Implement Shopping campaigns for product visibility",
              "Optimise landing pages for conversion",
            ],
            success_metric: "Cost per acquisition and conversion rate",
            budget_percent: 35,
            why_it_works:
              "Search advertising captures customers at the moment of purchase intent, delivering the highest conversion rates and ROI for ecommerce businesses.",
          },
          {
            channel: "Paid social media",
            intent: "Mid",
            role: "Generate demand and social proof",
            summary:
              "Use targeted social advertising to create awareness, showcase products, and drive traffic through engaging visual content and social proof.",
            key_actions: [
              "Launch Facebook and Instagram campaigns",
              "Create engaging visual content showcasing products",
              "Implement retargeting campaigns for website visitors",
            ],
            success_metric: "Click-through rate and social engagement",
            budget_percent: 25,
            why_it_works:
              "Social media allows you to reach customers in discovery mode, build brand awareness, and create social proof through user-generated content.",
          },
          {
            channel: "Email marketing",
            intent: "Mid",
            role: "Nurture leads and encourage repeat purchases",
            summary:
              "Develop automated email sequences to nurture prospects, recover abandoned carts, and encourage repeat purchases from existing customers.",
            key_actions: [
              "Set up abandoned cart recovery sequences",
              "Create welcome series for new subscribers",
              "Develop retention campaigns for existing customers",
            ],
            success_metric: "Email open rates and click-to-purchase conversion",
            budget_percent: 20,
            why_it_works:
              "Email marketing provides direct access to interested prospects and customers, offering excellent ROI through personalised messaging and automation.",
          },
          {
            channel: "Influencer partnerships",
            intent: "Mid",
            role: "Build trust through authentic recommendations",
            summary:
              "Partner with relevant influencers to showcase products authentically, reaching engaged audiences who trust their recommendations.",
            key_actions: [
              "Identify micro-influencers in your niche",
              "Develop product collaboration programmes",
              "Track referral codes and affiliate links",
            ],
            success_metric:
              "Influencer referral conversions and brand mention engagement",
            budget_percent: 15,
            why_it_works:
              "Influencer partnerships leverage trusted voices to reach engaged audiences, providing social proof and authentic product recommendations.",
          },
          {
            channel: "Direct mail campaigns",
            intent: "Mid",
            role: "Create tangible brand experiences",
            summary:
              "Use targeted direct mail to create memorable brand touchpoints, especially effective for premium products and local markets.",
            key_actions: [
              "Design premium catalogue mailings",
              "Target high-value postcode areas",
              "Include exclusive discount codes for tracking",
            ],
            success_metric: "Response rate and mail-to-purchase conversion",
            budget_percent: 5,
            why_it_works:
              "Direct mail cuts through digital noise, creating tangible brand experiences that drive consideration and purchase, especially for premium products.",
          },
        ],
        saas_checkout: [
          {
            channel: "Search advertising",
            intent: "High",
            role: "Capture solution-seeking prospects",
            summary:
              "Target problem-focused and solution keywords to capture prospects actively seeking software solutions like yours.",
            key_actions: [
              "Launch campaigns targeting problem-solution keywords",
              "Create landing pages for specific use cases",
              "Implement free trial sign-up tracking",
            ],
            success_metric:
              "Cost per trial signup and trial-to-paid conversion",
            budget_percent: 35,
            why_it_works:
              "Search advertising captures prospects when they're actively seeking solutions, providing high-quality leads ready to evaluate your software.",
          },
          {
            channel: "Content marketing",
            intent: "Mid",
            role: "Educate prospects and build authority",
            summary:
              "Create valuable content that educates prospects about their challenges whilst positioning your solution as the answer.",
            key_actions: [
              "Develop comprehensive guides and case studies",
              "Create video tutorials and demos",
              "Optimise content for search engines",
            ],
            success_metric:
              "Content engagement and content-to-trial conversion",
            budget_percent: 25,
            why_it_works:
              "Content marketing builds trust and authority whilst educating prospects, creating a natural path from awareness to consideration.",
          },
          {
            channel: "LinkedIn advertising",
            intent: "Mid",
            role: "Target decision-makers professionally",
            summary:
              "Use LinkedIn's professional targeting to reach decision-makers and influencers in companies that match your ideal customer profile.",
            key_actions: [
              "Launch account-based marketing campaigns",
              "Target by job title and company size",
              "Create professional thought leadership content",
            ],
            success_metric: "LinkedIn lead quality and professional engagement",
            budget_percent: 20,
            why_it_works:
              "LinkedIn provides access to professional decision-makers in a business context, ideal for B2B software sales and lead generation.",
          },
          {
            channel: "Webinars and demos",
            intent: "High",
            role: "Demonstrate value and convert trials",
            summary:
              "Host educational webinars and product demonstrations to showcase your software's capabilities and convert interested prospects.",
            key_actions: [
              "Schedule regular product demonstration sessions",
              "Create educational webinar content",
              "Follow up with attendees personally",
            ],
            success_metric: "Webinar attendance and demo-to-signup conversion",
            budget_percent: 15,
            why_it_works:
              "Webinars and demos allow prospects to see your software in action, addressing objections and demonstrating clear value propositions.",
          },
          {
            channel: "Trade publications",
            intent: "Mid",
            role: "Build industry credibility",
            summary:
              "Advertise in respected industry publications to build credibility and reach decision-makers who trust these authoritative sources.",
            key_actions: [
              "Place adverts in relevant trade magazines",
              "Contribute thought leadership articles",
              "Sponsor industry newsletters",
            ],
            success_metric: "Publication response and industry recognition",
            budget_percent: 5,
            why_it_works:
              "Trade publications provide credibility and reach decision-makers who rely on industry sources for software recommendations.",
          },
        ],
      };

      // Get channels for motion or default to ecom
      const motionChannels =
        channelByMotion[form.motion] || channelByMotion.ecom_checkout;

      // Determine goal
      const derivedGoal =
        form.motion === "custom" && form.action_custom
          ? `Goal aligned to: ${form.action_custom}`
          : {
              ecom_checkout: "Online orders",
              saas_checkout: "Paid subscriptions",
              store_visit: "In-store sales",
              lead_capture: "Qualified leads",
            }[form.motion] || "Business growth";

      // Use AI response directly - all fields are now plain text strings
      let json = {
        meta: {
          title: "Marketing Strategy Report",
          country: form.country,
          sector: form.sector || "General",
          goal: derivedGoal,
        },
        market_foundation: aiGenerated.market_foundation,
        personas: aiGenerated.personas,
        strategy_pillars: aiGenerated.strategy_pillars,
        seven_ps: aiGenerated.seven_ps,
        channel_playbook: aiGenerated.channel_playbook,
        budget: aiGenerated.budget,
        calendar_next_90_days: aiGenerated.calendar_next_90_days,
        kpis: aiGenerated.kpis,
        differentiators: aiGenerated.differentiators,
        risks_and_safety_nets: aiGenerated.risks_and_safety_nets,
      };

      // Apply British English normalization
      json = normalizeBritishEnglish(json);

      return new Response(JSON.stringify(json), cors(200, origin));
    } catch (e) {
      console.error("Worker error details:", {
        name: e.name,
        message: e.message,
        stack: e.stack,
      });

      if (
        e.name === "TimeoutError" ||
        e.message.includes("timeout") ||
        e.message.includes("aborted")
      ) {
        return new Response(
          JSON.stringify({
            error:
              "AI service is taking longer than expected. Please try again.",
          }),
          cors(408, origin),
        );
      }

      if (e.message.includes("API key") || e.message.includes("unauthorized")) {
        return new Response(
          JSON.stringify({
            error: "API configuration issue. Please contact support.",
          }),
          cors(500, origin),
        );
      }

      return new Response(
        JSON.stringify({
          error: "internal_server_error",
          message: "An unexpected error occurred. Please try again.",
        }),
        cors(500, origin),
      );
    }
  },
};

// British English normalization function
function normalizeBritishEnglish(obj) {
  const usToUkMap = {
    ads: "adverts",
    organizations: "organisations",
    realize: "realise",
    optimize: "optimise",
    analyze: "analyse",
    behavior: "behaviour",
    color: "colour",
    center: "centre",
    program: "programme",
    while: "whilst",
    among: "amongst",
    favorite: "favourite",
    honor: "honour",
    labor: "labour",
    flavor: "flavour",
    neighborhood: "neighbourhood",
    traveled: "travelled",
    canceled: "cancelled",
    modeling: "modelling",
  };

  function normalizeText(text) {
    if (typeof text !== "string") return text;
    let result = text;
    for (const [us, uk] of Object.entries(usToUkMap)) {
      const regex = new RegExp(`\\b${us}\\b`, "gi");
      result = result.replace(regex, uk);
    }
    return result;
  }

  function walkObject(obj) {
    if (typeof obj === "string") {
      return normalizeText(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(walkObject);
    } else if (obj && typeof obj === "object") {
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
    "http://localhost:5000",
    "https://localhost:5000",
    "http://127.0.0.1:5000",
    "https://127.0.0.1:5000",
    "https://4ed238b6-44fe-47f0-8f40-754dbed6c70c-00-y3il5bpx45gx.sisko.replit.dev",
    "https://marketingstratgenerator.com",
    "https://www.marketingstratgenerator.com",
  ];

  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : null;

  const headers = {
    "Content-Type": "application/json",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'none'; script-src 'none';",
    "X-Robots-Tag": "noindex, nofollow",
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };

  if (corsOrigin) {
    headers["Access-Control-Allow-Origin"] = corsOrigin;
    headers["Access-Control-Allow-Methods"] = "POST,OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Vary"] = "Origin";
  }

  return { status, headers };
}
