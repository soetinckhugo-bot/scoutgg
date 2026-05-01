# 🚀 Checklist Mise en Production — LeagueScout

> **Quand l'utiliser ?** Juste avant de mettre le site en ligne sur Vercel.
> **Temps estimé :** 15-20 minutes.

---

## ✅ Pré-requis

- [ ] Avoir un compte Vercel (gratuit)
- [ ] Avoir un compte Turso (gratuit)
- [ ] Avoir un compte Stripe (mode test puis live)
- [ ] Le projet est poussé sur GitHub

---

## 1. Base de données (Turso)

**Pourquoi ?** SQLite ne marche pas en production sur Vercel (serverless = plusieurs processus qui écrivent en même temps = corruption).

### Étapes :
1. **Installer Turso CLI**
   ```bash
   npm install -g @tursodatabase/api
   # ou
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

2. **Créer la base de données**
   ```bash
   turso auth login
   turso db create scoutgg-prod
   ```

3. **Exporter les données SQLite actuelles**
   ```bash
   cd scoutgg-web
   sqlite3 prisma/dev.db ".dump" > dump.sql
   ```

4. **Importer dans Turso**
   ```bash
   turso db shell scoutgg-prod < dump.sql
   ```

5. **Récupérer l'URL et le token**
   ```bash
   turso db show scoutgg-prod --url
   turso db tokens create scoutgg-prod
   ```

6. **Ajouter dans Vercel (Environment Variables)**
   - `TURSO_DATABASE_URL` = l'URL du step 5
   - `TURSO_AUTH_TOKEN` = le token du step 5

---

## 2. Images (Vercel Blob)

**Pourquoi ?** Le dossier `public/uploads/` est local et effacé à chaque déploiement Vercel.

### Étapes :
1. **Activer Vercel Blob** (dans le dashboard Vercel du projet)
   - Aller dans `Storage` → `Create Database` → `Vercel Blob`
   - Ou directement depuis l'onglet `Blob` du projet

2. **Récupérer le token**
   - Vercel génère automatiquement `BLOB_READ_WRITE_TOKEN`
   - Il est ajouté aux variables d'environnement du projet

3. **Vérifier que la variable est bien là**
   - `BLOB_READ_WRITE_TOKEN` doit apparaître dans Settings → Environment Variables

---

## 3. Variables d'environnement Vercel

**Toutes ces variables doivent être ajoutées dans le dashboard Vercel :**

| Variable | Valeur | Où la trouver |
|----------|--------|---------------|
| `DATABASE_URL` | `file:./dev.db` | (garde la valeur dev, Turso est séparé) |
| `TURSO_DATABASE_URL` | `libsql://...` | `turso db show scoutgg-prod --url` |
| `TURSO_AUTH_TOKEN` | `eyJ...` | `turso db tokens create scoutgg-prod` |
| `NEXTAUTH_SECRET` | Générer 32 caractères | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://ton-site.vercel.app` | Ton URL Vercel |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Dashboard Stripe → Clés API |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Dashboard Stripe → Clés API |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | `stripe listen --forward-to localhost:3000/api/webhooks/stripe` |
| `STRIPE_PRICE_ID_PREMIUM` | `price_...` | Dashboard Stripe → Produits |
| `CRON_SECRET` | Générer 32 caractères | `openssl rand -base64 32` |
| `RIOT_API_KEY` | `RGAPI-...` | Dashboard Riot Games |
| `RESEND_API_KEY` | `re_...` | Dashboard Resend |
| `SENTRY_DSN` | `https://...` | Dashboard Sentry (optionnel) |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_...` | Généré auto par Vercel Blob |

---

## 4. Stripe (Passer en LIVE)

**⚠️ IMPORTANT :** Ne pas oublier de passer Stripe en mode LIVE avant le lancement.

### Étapes :
1. **Activer le compte Stripe** (si ce n'est pas déjà fait)
2. **Créer le produit "Scout Pro"** dans Stripe
   - Prix mensuel (ex: 9.99€)
   - Récupérer le `price_...` → mettre dans `STRIPE_PRICE_ID_PREMIUM`
3. **Copier les clés LIVE** (pas les clés TEST)
   - `STRIPE_SECRET_KEY` = `sk_live_...`
   - `STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
4. **Configurer le webhook Stripe**
   - Dans le dashboard Stripe → Webhooks → Ajouter un endpoint
   - URL : `https://ton-site.vercel.app/api/webhooks/stripe`
   - Sélectionner les événements :
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `charge.refunded`
   - Copier le secret du webhook (`whsec_...`) → `STRIPE_WEBHOOK_SECRET`

---

## 5. Vérifications avant le lancement

### Tests rapides :
- [ ] La page d'accueil charge
- [ ] La liste des joueurs s'affiche
- [ ] Un joueur a sa page détail
- [ ] Le paiement Stripe fonctionne (tester avec une carte de test Stripe)
- [ ] Le webhook Stripe met bien à jour le statut premium
- [ ] L'upload d'image fonctionne (si admin)
- [ ] Le cron de sync SoloQ apparaît dans les logs Vercel (le lendemain matin)

### URLs à vérifier :
- [ ] `https://ton-site.vercel.app/`
- [ ] `https://ton-site.vercel.app/players`
- [ ] `https://ton-site.vercel.app/players/[id]`
- [ ] `https://ton-site.vercel.app/pricing`
- [ ] `https://ton-site.vercel.app/api/players` (devrait retourner du JSON)

---

## 6. Après le lancement (Day 1)

- [ ] Vérifier les logs Vercel pour voir si les crons tournent
- [ ] Vérifier que les images uploadées s'affichent bien
- [ ] Vérifier qu'un utilisateur peut s'inscrire, payer, et devenir premium
- [ ] Vérifier que le site est rapide (Lighthouse via Chrome DevTools)

---

## 📞 En cas de problème

| Problème | Solution |
|----------|----------|
| "DB locked" ou erreurs SQLite | Vérifier que `TURSO_DATABASE_URL` et `TURSO_AUTH_TOKEN` sont bien définis |
| Les images disparaissent | Vérifier que `BLOB_READ_WRITE_TOKEN` est défini |
| Les paiements ne marchent pas | Vérifier que les clés Stripe sont en `sk_live_` / `pk_live_` |
| Le webhook Stripe échoue | Vérifier que l'URL du webhook est bien `https://.../api/webhooks/stripe` |
| Le cron ne tourne pas | Vérifier que `CRON_SECRET` est défini et que `vercel.json` est présent |

---

## 🎯 Résumé des étapes (version ultra courte)

1. Créer base Turso + importer les données
2. Activer Vercel Blob
3. Copier-coller les variables d'env dans Vercel
4. Passer Stripe en LIVE + configurer le webhook
5. Déployer
6. Tester un paiement

**Temps total : 15-20 min**
