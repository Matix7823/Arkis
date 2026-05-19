# ⬡ Arkis Agency — Secure by Design

> **Votre site web, impénétrable par conception.**
> Arkis Agency combine le développement Full-Stack de pointe avec du Pen-testing intégré dès la phase de conception. Résultat : des forteresses numériques ultra-performantes et sécurisées.

---

## 🏗️ Architecture & Stack Technique

Le projet utilise une architecture **MVC moderne** sous Node.js, structurée de manière hautement modulaire pour séparer les responsabilités logiques de l'affichage.

*   **Serveur Principal** : Node.js & Express (Orchestrateur robuste)
*   **Moteur de Rendu** : EJS (Embedded JavaScript) avec composants/partials réutilisables
*   **Base de Données** : Supabase (PostgreSQL) sécurisée
*   **Messagerie Client** : API SMTP Brevo (Notifications et accusés de réception automatiques)
*   **Sécurité Globale** : Helmet HTTP Hardening, Content-Security-Policy (CSP), Express Rate Limiters, Honeypot anti-spam

---

## 🛡️ Fonctionnalités de Sécurité (OWASP Top 10)

1.  **Prévention Anti-SQLi** : Requêtes de base de données entièrement paramétrées via le SDK officiel Supabase. Zéro requête SQL brute.
2.  **Protection Anti-XSS** : Échappement des caractères utilisateur dans EJS via `<%= %>` combiné à une fonction d'assainissement stricte `sanitize()` côté serveur.
3.  **Renforcement d'En-têtes (Helmet)** : Injection d'en-têtes de sécurité anti-clickjacking, désactivation du MIME sniff et politique de sécurité du contenu (CSP) stricte.
4.  **Défense Anti-DDoS & Bruteforce** : Limitation de débit stricte (Rate-Limiting) restreinte à **5 requêtes maximum par tranche de 15 minutes** par adresse IP sur l'API de contact.
5.  **Piège Anti-Bot (Honeypot)** : Champ masqué invisible interceptant les robots spammeurs et rejetant silencieusement leurs requêtes.

---

## ⚙️ Installation & Configuration Locale

### 1. Cloner le Projet & Installer les Dépendances
```bash
git clone https://github.com/Matix7823/Arkis.git
cd Arkis
npm install
```

### 2. Configuration des Variables d'Environnement
Créez un fichier `.env` à la racine et renseignez vos identifiants :
```env
PORT=3000

# Supabase Credentials (Database)
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_cle_anon_publique
SUPABASE_SERVICE_ROLE_KEY=votre_cle_secrete_service_role

# Brevo SMTP Credentials (Email)
BREVO_API_KEY=xkeysib-votre_cle_api_brevo
CONTACT_EMAIL_TO=contact@votre-agence.com
CONTACT_EMAIL_FROM_ADDR=noreply@votre-agence.com
```

### 3. Initialiser Supabase (PostgreSQL)
Exécutez ce script SQL dans l'éditeur de requêtes de votre console Supabase pour initialiser la table de capture sécurisée :
```sql
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    service TEXT NOT NULL,
    budget TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Active le Row Level Security (RLS)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Autorise les écritures anonymes sécurisées
CREATE POLICY "Allow anonymous inserts" ON public.contacts FOR INSERT WITH CHECK (true);
```

### 4. Démarrer le Serveur de Développement
```bash
npm run dev
```
Le site sera accessible localement sur : **http://localhost:3000**

---

## 📂 Structure des Dossiers

*   `config/` : Modules d'initialisation sécurisée des APIs (Supabase, Brevo).
*   `routes/` : Contrôleurs logiques isolés (pages vitrines, API de contact).
*   `views/` : Gabarits EJS organisés et découpés en composants réutilisables (`views/partials/`).
*   `script.js` : Logique client entièrement sécurisée et immune aux crashs d'éléments absents.
*   `server.js` : Point d'entrée sécurisé avec intégration de Helmet et CSP.
