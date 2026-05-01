# 🚀 Déployer ScoutGG en ligne pour accéder au mode Admin partout

> Objectif : déployer `scoutgg-web` sur Vercel + Turso pour pouvoir remplir la base de données depuis n'importe quel ordinateur via le navigateur.

---

## ✅ Résumé rapide

1. Push le code sur **GitHub**
2. Créer une base **Turso** à partir de ta `dev.db` locale
3. Lier le repo à **Vercel** et configurer les variables d'environnement
4. Déployer → accéder à `https://ton-site.vercel.app/admin`

Ton compte admin existant (`admin@leaguescout.gg` / `admin123`) sera conservé car on importe la base SQLite telle quelle.

---

## 📦 Étape 1 — Push sur GitHub

Si ce n'est pas déjà fait :

```bash
cd scoutgg-web
git init
git add .
git commit -m "ready for deploy"
# Crée un repo vide sur https://github.com/new
git remote add origin https://github.com/TON_USER/TON_REPO.git
git push -u origin main
```

---

## 🗄 Étape 2 — Créer la base de données Turso (Cloud)

Turso est la base de données en production (libSQL). Tu vas importer ta `prisma/dev.db` locale directement.

### 2.1 Installer Turso CLI

```bash
# macOS / Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (PowerShell)
irm https://get.tur.so/install.ps1 | iex
```

Puis authentifie-toi :
```bash
turso auth login
```

### 2.2 Créer la base à partir de ton fichier local

```bash
cd scoutgg-web
turso db create scoutgg-prod --from-file prisma/dev.db
```

> ⚠️ Si tu as des erreurs de compatibilité SQLite/libSQL, utilise plutôt la méthode alternative ci-dessous.

### 2.3 Récupérer l'URL et le token

```bash
# URL de la base
turso db show scoutgg-prod
# → copie l'URL (ex: libsql://scoutgg-prod-username.turso.io)

# Token d'accès
turso db tokens create scoutgg-prod
# → copie le token affiché
```

**Alternative si `--from-file` échoue :**
```bash
# Créer une DB vide
turso db create scoutgg-prod

# Exporter le schema + data depuis SQLite
# (utilise le script Node.js fourni :)
node scripts/export-db-to-turso.js

# Importer dans Turso
turso db shell scoutgg-prod < prisma/dump-for-turso.sql
```

---

## 🌐 Étape 3 — Déployer sur Vercel

### 3.1 Via le dashboard (recommandé)

1. Va sur [vercel.com/new](https://vercel.com/new)
2. Importe ton repo GitHub `scoutgg-web`
3. Laisse le **Framework Preset** sur `Next.js`
4. Définis le **Root Directory** sur `scoutgg-web` (si le repo racine est `SCOUTGG/`)

### 3.2 Variables d'environnement à ajouter

Dans l'onglet **Settings → Environment Variables** de ton projet Vercel :

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `NEXTAUTH_SECRET` | `ton-secret-tres-long-aleatoire-min-32-caracteres` | Production |
| `NEXTAUTH_URL` | `https://ton-site.vercel.app` | Production |
| `TURSO_DATABASE_URL` | `libsql://scoutgg-prod-xxx.turso.io` | Production |
| `TURSO_AUTH_TOKEN` | `ton-token-turso` | Production |
| `RIOT_API_KEY` | `RGAPI-...` | Production *(optionnel pour l'admin)* |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Production *(optionnel)* |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Production *(optionnel)* |

> 💡 Génère un `NEXTAUTH_SECRET` avec : `openssl rand -base64 32` (ou un générateur en ligne)

### 3.3 Déployer

Clique sur **Deploy**. Le build devrait passer (~2-3 min).

---

## 🔑 Étape 4 — Accéder au mode Admin

1. Ouvre ton URL de production : `https://ton-site.vercel.app`
2. Va sur **Login** : `https://ton-site.vercel.app/login`
3. Connecte-toi avec :
   - **Email** : `admin@leaguescout.gg`
   - **Mot de passe** : `admin123`
4. Va sur **`/admin`** pour accéder au dashboard admin

Ce que tu peux faire depuis l'admin déployé :
- ➕ Ajouter des joueurs manuellement
- 🔗 Renseigner les liens OP.GG, Twitter, Twitch
- ⭐ Noter les joueurs (eye test rating 1-5)
- 📥 Importer des données (CSV, Riot sync)
- 📝 Créer des rapports scouting

---

## 🔄 Étape 5 — Synchroniser les données si tu continues en local

Si tu modifies la base en local ET en ligne, voici comment synchroniser :

**Exporter Turso → SQLite locale :**
```bash
turso db shell scoutgg-prod ".dump" > dump.sql
sqlite3 prisma/dev.db < dump.sql
```

**Exporter SQLite locale → Turso :**
```bash
node scripts/export-db-to-turso.js
turso db shell scoutgg-prod < prisma/dump-for-turso.sql
```

---

## 📎 Liens utiles

- Turso Dashboard : https://app.turso.tech
- Vercel Dashboard : https://vercel.com/dashboard
- GitHub New Repo : https://github.com/new
