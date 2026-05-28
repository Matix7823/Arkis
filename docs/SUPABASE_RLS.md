# Supabase Row-Level Security (RLS) — Configuration requise

## Contexte

L'application Arkis utilise la **clé anon** (publique) de Supabase pour toutes les opérations
depuis le serveur Express et le Worker Cloudflare. Cela signifie que les **politiques RLS**
doivent être correctement configurées dans Supabase pour contrôler les accès.

## Tables et politiques requises

### Table `contacts`

Cette table reçoit les soumissions du formulaire de contact.

```sql
-- 1. Activer RLS sur la table contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 2. Politique INSERT-ONLY pour le rôle anon
-- Permet uniquement l'insertion (pas de SELECT/UPDATE/DELETE)
CREATE POLICY "anon_insert_contacts"
  ON contacts
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 3. Interdire toute lecture par le rôle anon
-- (pas de politique SELECT = pas d'accès en lecture par défaut quand RLS est activé)
```

### Table `security_alerts`

Cette table reçoit les alertes du honeypot du Worker Cloudflare.

```sql
-- 1. Activer RLS
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- 2. Politique INSERT-ONLY pour le rôle anon
CREATE POLICY "anon_insert_security_alerts"
  ON security_alerts
  FOR INSERT
  TO anon
  WITH CHECK (true);
```

## Vérification

Après configuration, vérifiez que :
1. Une insertion via la clé anon fonctionne : `POST /rest/v1/contacts`
2. Une lecture via la clé anon échoue : `GET /rest/v1/contacts` → 0 rows
3. Un DELETE via la clé anon échoue

## Notes de sécurité

- La clé `service_role` ne doit **jamais** être utilisée dans du code déployé.
- Les lectures/suppressions admin se font uniquement via le Dashboard Supabase
  ou un backend authentifié séparément.
- Pensez à ajouter une contrainte de rate limiting côté Supabase si nécessaire
  (via pg_net ou des triggers).
