'use strict';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY  = process.env.BREVO_API_KEY;
const FROM_NAME      = process.env.CONTACT_EMAIL_FROM_NAME || 'Arkis Agency';
const FROM_ADDR      = process.env.CONTACT_EMAIL_FROM_ADDR || 'contact@arkis.agency';

/**
 * Envoie un email transactionnel via Brevo
 */
async function sendEmail({ to, toName, replyTo, subject, html }) {
  if (!BREVO_API_KEY || BREVO_API_KEY === 'COLLE_TA_CLE_API_BREVO_ICI') {
    // Si la clé Brevo n'est pas encore configurée, on log l'email en console au lieu de faire planter le site.
    // Cela permet de tester le formulaire et Supabase sans attendre d'avoir configuré Brevo !
    console.warn(`\n⚠️  [BREVO] Clé API non configurée. Envoi d'email simulé.\nSujet: ${subject}\nDestinataire: ${to}\n`);
    return { skipped: true };
  }

  const body = {
    sender:      { name: FROM_NAME, email: FROM_ADDR },
    to:          [{ email: to, name: toName || to }],
    replyTo:     { email: replyTo },
    subject,
    htmlContent: html,
  };

  const res = await fetch(BREVO_ENDPOINT, {
    method:  'POST',
    headers: {
      'api-key':      BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept:         'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo ${res.status}: ${err}`);
  }

  return res.json();
}

module.exports = {
  sendEmail,
};
