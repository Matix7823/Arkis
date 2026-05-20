export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ==========================================
    // 1. ROUTE API : TRAITEMENT DU FORMULAIRE DE CONTACT
    // ==========================================
    if (request.method === "POST" && url.pathname === "/api/contact") {
      
      // 0. Protection CSRF (Cross-Site Request Forgery)
      const origin = request.headers.get("Origin");
      if (!origin || !origin.includes("arkis.mathis7823.workers.dev")) {
        return new Response(JSON.stringify({ success: false, message: "Requête non autorisée (CSRF Blocked)" }), { 
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 1. Rate Limiting par IP (Anti-Brute Force / DoS)
      const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
      const cacheKey = new Request(`https://rate-limit.local/${clientIP}`);
      const cache = caches.default;
      let cacheResponse = await cache.match(cacheKey);

      if (cacheResponse) {
        const data = await cacheResponse.json();
        if (data.count >= 5) { // Limite : 5 requêtes par minute
          return new Response(JSON.stringify({ success: false, message: "Trop de requêtes. Veuillez réessayer plus tard (Rate Limit)." }), { 
            status: 429, 
            headers: { "Content-Type": "application/json", "Retry-After": "60" } 
          });
        }
        data.count++;
        ctx.waitUntil(cache.put(cacheKey, new Response(JSON.stringify(data), { headers: { "Cache-Control": "max-age=60" } })));
      } else {
        ctx.waitUntil(cache.put(cacheKey, new Response(JSON.stringify({ count: 1 }), { headers: { "Cache-Control": "max-age=60" } })));
      }

      // 2. Bloquer les requêtes trop lourdes (Payload Too Large)
      const contentLength = parseInt(request.headers.get("Content-Length") || "0");
      if (contentLength > 10240) { // 10 Ko maximum
        return new Response(JSON.stringify({ success: false, message: "Requête trop volumineuse." }), { status: 413 });
      }

      try {
        const formData = await request.json();

        // 3. Validation stricte de l'email via Regex
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(formData.email)) {
          return new Response(JSON.stringify({ success: false, message: "Format d'adresse email invalide." }), { status: 400 });
        }

        // A. SÉCURITÉ : Validation du jeton Cloudflare Turnstile (Anti-Bot)
        const turnstileToken = formData['cf-turnstile-response'];
        if (!turnstileToken) {
          return new Response(JSON.stringify({ success: false, message: "Sécurité Turnstile manquante." }), { 
            status: 400, 
            headers: { "Content-Type": "application/json" } 
          });
        }

        const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${env.TURNSTILE_SECRET_KEY}&response=${turnstileToken}`
        });

        const turnstileOutcome = await verifyResponse.json();
        if (!turnstileOutcome.success) {
          return new Response(JSON.stringify({ success: false, message: "Échec de la validation de sécurité (Bot détecté)." }), { 
            status: 403, 
            headers: { "Content-Type": "application/json" } 
          });
        }

        // B. CYBER-HYGIÈNE : Sanitisation des entrées (Anti-XSS)
        const name = (formData.name || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const email = (formData.email || "").trim();
        const message = (formData.message || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        if (!name || !email || !message) {
          return new Response(JSON.stringify({ success: false, message: "Tous les champs sont requis." }), { 
            status: 400, 
            headers: { "Content-Type": "application/json" } 
          });
        }

        // C. DATA : Écriture dans Supabase via l'API REST PostgREST
        const supabaseResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/contacts`, {
          method: "POST",
          headers: {
            "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({ name, email, message, created_at: new Date().toISOString() })
        });

        if (!supabaseResponse.ok) throw new Error("Erreur lors de la sauvegarde dans Supabase.");

        // D. ROUTAGE EMAIL : Notification instantanée via Brevo
        const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "api-key": env.BREVO_API_KEY,
            "content-type": "application/json"
          },
          body: JSON.stringify({
            sender: { name: "Arkis Security", email: env.CONTACT_EMAIL_FROM_ADDR },
            to: [{ email: env.CONTACT_EMAIL_TO, name: "Arkis Team" }],
            subject: `[Nouveau Client] Enquête de projet de ${name}`,
            htmlContent: `<h3>Nouveau message reçu :</h3><p><strong>Nom :</strong> ${name}</p><p><strong>Email :</strong> ${email}</p><p><strong>Message :</strong> ${message}</p>`
          })
        });

        if (!brevoResponse.ok) throw new Error("Erreur d'envoi via l'API Brevo.");

        return new Response(JSON.stringify({ success: true, message: "Données sécurisées et message envoyé !" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });

      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // ==========================================
    // 2. FALLBACK : SERVICE DES FICHIERS STATIQUES (HTML/CSS/JS)
    // ==========================================
    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get("Content-Type") || "";

    if (contentType.includes("text/html")) {
      const newHeaders = new Headers(response.headers);
      
      // 4. Package de sécurité d'élite (Blue Team Standard + Hardening Militaire)
      newHeaders.set("X-Frame-Options", "DENY");
      newHeaders.set("X-Content-Type-Options", "nosniff");
      newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
      newHeaders.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
      newHeaders.set("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
      newHeaders.set("X-XSS-Protection", "1; mode=block");
      newHeaders.set("Content-Security-Policy", "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com; connect-src 'self' " + env.SUPABASE_URL + "; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
      
      // Durcissement des politiques de cookies & fuites (Isolation globale)
      newHeaders.set("X-Permitted-Cross-Domain-Policies", "none");
      newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
      newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    }

    return response;
  }
};
