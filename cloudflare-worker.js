export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ==========================================
    // 1. ROUTE API : TRAITEMENT DU FORMULAIRE DE CONTACT
    // ==========================================
    if (request.method === "POST" && url.pathname === "/api/contact") {
      try {
        const formData = await request.json();

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
    // Récupère la page demandée depuis le bundle d'Assets (dossier dist/)
    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get("Content-Type") || "";

    // OPTIMISATION : Si c'est un fichier HTML, on peut modifier la réponse à la volée 
    // pour injecter le script Cloudflare Web Analytics si nécessaire, ou ajouter des en-têtes de sécurité.
    if (contentType.includes("text/html")) {
      const newHeaders = new Headers(response.headers);
      
      // En-têtes de sécurité HTTP (Security Headers) essentiels pour la Blue Team
      newHeaders.set("X-Frame-Options", "DENY"); // Anti-Clickjacking
      newHeaders.set("X-Content-Type-Options", "nosniff"); // Anti-MIME-Sniffing
      newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    }

    return response;
  }
};
