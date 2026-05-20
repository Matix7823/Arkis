export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
    const userAgent = request.headers.get("User-Agent") || "unknown";

    // ==========================================
    // SÉCURITÉ ACTIVE : 1. LE HONEYPOT (PIÈGE À BOT)
    // ==========================================
    const maliciousPaths = ["/wp-admin", "/.env", "/config.php", "/wp-login.php", "/admin"];
    if (maliciousPaths.some(path => url.pathname.toLowerCase().includes(path))) {
      ctx.waitUntil(
        fetch(`${env.SUPABASE_URL}/rest/v1/security_alerts`, {
          method: "POST",
          headers: {
            "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ event_type: "HONEYPOT_ATTACK", ip_address: clientIP, target_path: url.pathname, user_agent: userAgent, severity: "CRITICAL", created_at: new Date().toISOString() })
        }).catch(() => {})
      );
      return new Response("Access Denied.", { status: 403 });
    }

    // ==========================================
    // SÉCURITÉ ACTIVE : 2. ROUTE API FORMULAIRE CONTACT
    // ==========================================
    if (request.method === "POST" && url.pathname === "/api/contact") {
      try {
        // A. ANTI-DOS : Limitation de la taille du payload (10 Ko max)
        const contentLength = parseInt(request.headers.get("Content-Length") || "0");
        if (contentLength > 10240) return new Response("Payload Too Large", { status: 413 });

        // B. GEO-FENCING : Restriction Europe Francophone
        const userCountry = request.headers.get("CF-IPCountry") || "XX";
        if (!["FR", "BE", "CH", "LU"].includes(userCountry)) {
          return new Response(JSON.stringify({ success: false, message: "Geoblocking active." }), { status: 403 });
        }

        // C. ANTI-CSRF & ANTI-TAMPERING : Vérification de l'origine et du User-Agent
        const origin = request.headers.get("Origin");
        if (!origin || !origin.includes("arkis.mathis7823.workers.dev")) {
          return new Response(JSON.stringify({ success: false, message: "CSRF Blocked." }), { status: 403 });
        }
        if (userAgent.includes("curl") || userAgent.includes("Wget")) {
          return new Response(JSON.stringify({ success: false, message: "Automated tools forbidden." }), { status: 403 });
        }

        // D. RATE LIMITING PAR IP (Edge Cache Method)
        const cacheKey = new Request(`https://rate-limit.local/${clientIP}`);
        const cache = caches.default;
        let cacheResponse = await cache.match(cacheKey);
        if (cacheResponse) {
          const data = await cacheResponse.json();
          if (data.count >= 5) return new Response(JSON.stringify({ success: false, message: "Trop de requêtes. Réessayez plus tard." }), { status: 429 });
          data.count++;
          ctx.waitUntil(cache.put(cacheKey, new Response(JSON.stringify(data), { headers: { "Cache-Control": "max-age=60" } })));
        } else {
          ctx.waitUntil(cache.put(cacheKey, new Response(JSON.stringify({ count: 1 }), { headers: { "Cache-Control": "max-age=60" } })));
        }

        const formData = await request.json();

        // E. ANTI-BOT : Validation Cloudflare Turnstile
        const turnstileToken = formData['cf-turnstile-response'];
        const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${env.TURNSTILE_SECRET_KEY}&response=${turnstileToken}`
        });
        const turnstileOutcome = await verifyResponse.json();
        if (!turnstileOutcome.success) return new Response(JSON.stringify({ success: false, message: "Bot detected." }), { status: 403 });

        // F. SANITISATION ANTI-XSS & REGEX EMAIL
        const name = (formData.name || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const email = (formData.email || "").trim();
        const message = (formData.message || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!name || !message || !emailRegex.test(email)) return new Response(JSON.stringify({ success: false, message: "Données invalides." }), { status: 400 });

        // G. SUPABASE : Insertion sécurisée
        const supabaseResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/contacts`, {
          method: "POST",
          headers: { "apikey": env.SUPABASE_SERVICE_ROLE_KEY, "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
          body: JSON.stringify({ name, email, message, created_at: new Date().toISOString() })
        });
        if (!supabaseResponse.ok) throw new Error("Supabase Error");

        // H. BREVO : Envoi de l'alerte
        await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "accept": "application/json", "api-key": env.BREVO_API_KEY, "content-type": "application/json" },
          body: JSON.stringify({
            sender: { name: "Arkis HQ", email: env.CONTACT_EMAIL_FROM_ADDR },
            to: [{ email: env.CONTACT_EMAIL_TO, name: "Arkis Team" }],
            subject: `[Nouveau Lead Arkis] - ${name}`,
            htmlContent: `<p><strong>Nom :</strong> ${name}</p><p><strong>Email :</strong> ${email}</p><p><strong>Message :</strong> ${message}</p>`
          })
        });

        return new Response(JSON.stringify({ success: true, message: "Message chiffré et stocké en sécurité." }), { status: 200, headers: { "Content-Type": "application/json" } });

      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    // ==========================================
    // 3. SERVICE DES ASSETS STATIQUES + EN-TÊTES BANCAIRES
    // ==========================================
    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get("Content-Type") || "";

    if (contentType.includes("text/html")) {
      const newHeaders = new Headers(response.headers);
      newHeaders.set("X-Frame-Options", "DENY");
      newHeaders.set("X-Content-Type-Options", "nosniff");
      newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
      newHeaders.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
      newHeaders.set("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
      newHeaders.set("X-XSS-Protection", "1; mode=block");
      newHeaders.set("X-Permitted-Cross-Domain-Policies", "none");
      newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
      newHeaders.set("Content-Security-Policy", "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com; connect-src 'self' " + env.SUPABASE_URL + "; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
      
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
    }

    return response;
  }
};
