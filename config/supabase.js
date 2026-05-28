'use strict';

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase URL or Anon Key is missing in .env file.');
}

// Initialise le client Supabase avec la clé anon (respecte les politiques RLS)
// IMPORTANT : Les politiques RLS doivent être configurées côté Supabase
// pour autoriser les insertions sur la table contacts (voir docs/SUPABASE_RLS.md)
const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: false,
  },
});

module.exports = supabase;
