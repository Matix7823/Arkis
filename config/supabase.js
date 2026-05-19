'use strict';

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase URL or Secret Key is missing in .env file.');
}

// Initialise le client Supabase avec la clé service_role (permet de contourner RLS côté serveur de manière sécurisée)
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: {
    persistSession: false, // Pas besoin de persister la session sur un serveur Node.js/Express
  },
});

module.exports = supabase;
