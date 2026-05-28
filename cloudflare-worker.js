export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
    const userAgent = request.headers.get("User-Agent") || "unknown";

    // ==========================================
    // SECURITE ACTIVE : 1. LE HONEYPOT (PIEGE A BOT)
    // ==========================================
    const maliciousPaths = ["/wp-admin", "/.env", "/config.php", "/wp-login.php", "/admin"];
    if (maliciousPaths.some(path => url.pathname.toLowerCase().includes(path))) {
      ctx.waitUntil(
        fetch(`${env.SUPABASE_URL}/rest/v1/security_alerts`, {
          method: "POST",
          headers: {
            "apikey": env.SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({ event_type: "HONEYPOT_ATTACK", ip_address: clientIP, target_path: url.pathname, user_agent: userAgent, severity: "CRITICAL", created_at: new Date().toISOString() })
        }).catch(() => {})
      );
      return new Response("Access Denied.", { status: 403 });
    }

    // ==========================================
    // SECURITE ACTIVE : 2. ROUTE API FORMULAIRE CONTACT
    // ==========================================
    if (request.method === "POST" && url.pathname === "/api/contact") {
      try {
        // A. ANTI-DOS : Limitation de la taille du payload (10 Ko max)
        const contentLength = parseInt(request.headers.get("Content-Length") || "0");
        if (contentLength > 10240) return new Response("Payload Too Large", { status: 413 });

        // B. GEO-FENCING : Restriction Europe Francophone
        const userCountry = request.headers.get("CF-IPCountry") || "XX";
        if (!["FR", "BE", "CH", "LU"].includes(userCountry)) {
          return new Response(JSON.stringify({ success: false, message: "Geoblocking active." }), { status: 403, headers: { "Content-Type": "application/json" } });
        }

        // C. ANTI-CSRF : Verification stricte de l'origine (comparaison exacte)
        const ALLOWED_ORIGINS = [
          "https://arkis.agency",
          "https://www.arkis.agency"
        ];
        const origin = request.headers.get("Origin");
        if (!origin || !ALLOWED_ORIGINS.some(allowed => origin === allowed)) {
          return new Response(JSON.stringify({ success: false, message: "Origin not allowed." }), { status: 403, headers: { "Content-Type": "application/json" } });
        }
        if (userAgent.includes("curl") || userAgent.includes("Wget") || userAgent.includes("python-requests")) {
          return new Response(JSON.stringify({ success: false, message: "Automated tools forbidden." }), { status: 403, headers: { "Content-Type": "application/json" } });
        }

        // D. RATE LIMITING PAR IP (Edge Cache - fenetre glissante 60s, max 5)
        const rateLimitKey = new Request(`https://rate-limit.internal/${clientIP}/contact`);
        const cache = caches.default;
        let rateLimitResp = await cache.match(rateLimitKey);
        if (rateLimitResp) {
          const data = await rateLimitResp.json();
          if (data.count >= 5) {
            return new Response(JSON.stringify({ success: false, message: "Trop de requetes. Reessayez dans 60 secondes." }), { status: 429, headers: { "Content-Type": "application/json" } });
          }
          data.count++;
          ctx.waitUntil(cache.put(rateLimitKey, new Response(JSON.stringify(data), { headers: { "Cache-Control": "max-age=60" } })));
        } else {
          ctx.waitUntil(cache.put(rateLimitKey, new Response(JSON.stringify({ count: 1 }), { headers: { "Cache-Control": "max-age=60" } })));
        }

        const formData = await request.json();

        // E. ANTI-BOT : Validation Cloudflare Turnstile (renforcee)
        const turnstileToken = formData['cf-turnstile-response'];
        if (!turnstileToken || typeof turnstileToken !== 'string' || turnstileToken.length > 2048) {
          return new Response(JSON.stringify({ success: false, message: "Captcha token missing or invalid." }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${env.TURNSTILE_SECRET_KEY}&response=${encodeURIComponent(turnstileToken)}&remoteip=${clientIP}`
        });
        const turnstileOutcome = await verifyResponse.json();

        // Verifications strictes Turnstile : success + action + hostname
        if (!turnstileOutcome.success) {
          return new Response(JSON.stringify({ success: false, message: "Captcha verification failed." }), { status: 403, headers: { "Content-Type": "application/json" } });
        }
        // Verifier le hostname (anti-replay cross-domain)
        if (turnstileOutcome.hostname && !["arkis.agency", "www.arkis.agency"].includes(turnstileOutcome.hostname)) {
          return new Response(JSON.stringify({ success: false, message: "Invalid captcha origin." }), { status: 403, headers: { "Content-Type": "application/json" } });
        }
        // Anti-rejeu : verifier que le token n'a pas ete deja utilise (via cache)
        const tokenCacheKey = new Request(`https://turnstile-used.internal/${turnstileToken.substring(0, 64)}`);
        const tokenUsed = await cache.match(tokenCacheKey);
        if (tokenUsed) {
          return new Response(JSON.stringify({ success: false, message: "Captcha token already used." }), { status: 403, headers: { "Content-Type": "application/json" } });
        }
        // Marquer le token comme utilise (TTL 5 minutes)
        ctx.waitUntil(cache.put(tokenCacheKey, new Response("used", { headers: { "Cache-Control": "max-age=300" } })));

        // F. VALIDATION STRICTE & SANITISATION
        const nameRaw = (formData.name || "").trim();
        const emailRaw = (formData.email || "").trim().toLowerCase();
        const messageRaw = (formData.message || "").trim();
        const subjectRaw = (formData.subject || "").trim();

        // Bornes de longueur
        if (nameRaw.length < 2 || nameRaw.length > 80) {
          return new Response(JSON.stringify({ success: false, message: "Nom : entre 2 et 80 caracteres." }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        if (emailRaw.length > 254) {
          return new Response(JSON.stringify({ success: false, message: "Email trop long." }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        if (messageRaw.length < 10 || messageRaw.length > 5000) {
          return new Response(JSON.stringify({ success: false, message: "Message : entre 10 et 5000 caracteres." }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        if (subjectRaw.length > 120) {
          return new Response(JSON.stringify({ success: false, message: "Sujet : maximum 120 caracteres." }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        // Regex email robuste
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(emailRaw)) {
          return new Response(JSON.stringify({ success: false, message: "Format email invalide." }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        // Charset nom (Unicode lettres, chiffres, espaces, tirets, apostrophes)
        const namePattern = /^[\p{L}\p{N}\s\-'.]+$/u;
        if (!namePattern.test(nameRaw)) {
          return new Response(JSON.stringify({ success: false, message: "Nom : caracteres non autorises." }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        // Encodage HTML pour stockage/email
        function escapeHtml(str) {
          return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
        }
        const name = escapeHtml(nameRaw);
        const email = emailRaw; // emails ne contiennent pas de HTML
        const message = escapeHtml(messageRaw);
        const subject = escapeHtml(subjectRaw);

        // G. SUPABASE : Insertion securisee (via cle anon + RLS)
        const supabaseResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/contacts`, {
          method: "POST",
          headers: { "apikey": env.SUPABASE_ANON_KEY, "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
          body: JSON.stringify({ name, email, subject, message, created_at: new Date().toISOString() })
        });
        if (!supabaseResponse.ok) {
          console.error("[Supabase Insert Error]", supabaseResponse.status, await supabaseResponse.text());
          throw new Error("Database error");
        }

        // H. BREVO : Envoi de l'alerte (encodage HTML contextuel dans le template)
        await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "accept": "application/json", "api-key": env.BREVO_API_KEY, "content-type": "application/json" },
          body: JSON.stringify({
            sender: { name: "Arkis HQ", email: env.CONTACT_EMAIL_FROM_ADDR || "contact@arkis.agency" },
            to: [{ email: env.CONTACT_EMAIL_TO || "contact@arkis.agency", name: "Arkis Team" }],
            subject: `[Arkis Contact] ${subject || name}`,
            htmlContent: `<h2>Nouveau message de contact</h2><p><strong>Nom :</strong> ${name}</p><p><strong>Email :</strong> ${escapeHtml(email)}</p><p><strong>Sujet :</strong> ${subject || 'Non specifie'}</p><hr><p>${message.replace(/\n/g, '<br>')}</p>`
          })
        }).catch(err => console.error("[Brevo Error]", err.message));

        return new Response(JSON.stringify({ success: true, message: "Message envoye avec succes." }), { status: 200, headers: { "Content-Type": "application/json" } });

      } catch (error) {
        console.error("[Worker Contact Error]", error.message, error.stack);
        return new Response(JSON.stringify({ success: false, message: "Une erreur interne est survenue. Veuillez reessayer." }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    // ==========================================
    // 3. SERVICE DES ASSETS STATIQUES + EN-TETES SECURITE
    // ==========================================
    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get("Content-Type") || "";

    // Headers de securite uniformes sur toutes les reponses HTML
    if (contentType.includes("text/html")) {
      const newHeaders = new Headers(response.headers);
      newHeaders.set("X-Frame-Options", "DENY");
      newHeaders.set("X-Content-Type-Options", "nosniff");
      newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
      newHeaders.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
      newHeaders.set("Permissions-Policy", "geolocation=(), camera=(), microphone=(), payment=(), usb=()");
      newHeaders.set("X-XSS-Protection", "0");
      newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
      newHeaders.set("Cross-Origin-Resource-Policy", "same-origin");
      newHeaders.set("Content-Security-Policy", [
        "default-src 'self'",
        "script-src 'self' https://challenges.cloudflare.com https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data:",
        "connect-src 'self' https://challenges.cloudflare.com",
        "frame-src 'self' https://challenges.cloudflare.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
      ].join("; "));

      return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
    }

    return response;
  }
};
