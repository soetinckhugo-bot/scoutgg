# LeagueScout — Monitoring & Error Tracking

> Setup Sentry pour le tracking des erreurs et la performance monitoring.

---

## Setup

### 1. Créer un projet Sentry

1. Va sur [sentry.io](https://sentry.io) et crée un compte
2. Crée un projet **Next.js**
3. Copie le **DSN** dans ton `.env` :

```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=ton-org
SENTRY_PROJECT=scoutgg-web
```

### 2. Vérifier l'intégration

Sentry est **désactivé par défaut** en dev/test. Il s'active uniquement si `SENTRY_DSN` est configuré.

Pour tester en local :

```bash
# Lance avec le DSN configuré
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx npm run dev
```

Puis déclenche une erreur : va sur `/api/test-error` (si tu l'ajoutes) ou force une erreur React.

---

## Ce qui est tracké

| Type | Config | Fichier |
|------|--------|---------|
| **Erreurs React** | Error Boundary + Global Error | `ErrorBoundary.tsx`, `global-error.tsx` |
| **Erreurs API** | Auto via Sentry Next.js SDK | `sentry.server.config.ts` |
| **Erreurs Edge** | Auto via Sentry Next.js SDK | `sentry.edge.config.ts` |
| **Erreurs Client** | Auto + Replay | `sentry.client.config.ts` |
| **Logs métier** | `logger.error()` → Sentry | `logger.ts` |

---

## Logger + Sentry

Le logger structuré envoie automatiquement les `error` à Sentry en production :

```ts
import { logger } from "@/lib/logger";

logger.error("Payment failed", { userId: "u1", amount: 29 });
// → Console en dev
// → Console + Sentry en prod
```

---

## Session Replay

Les replays sont capturés :
- **10%** des sessions normales (`replaysSessionSampleRate: 0.1`)
- **100%** des sessions avec erreur (`replaysOnErrorSampleRate: 1.0`)

Les champs de texte sont **masqués** par défaut pour la confidentialité.

---

## Performance Monitoring

Sentry trace automatiquement :
- Les requêtes API (durée, status)
- Les renders React
- Les chargements de pages

Configure le sample rate dans `sentry.client.config.ts` :
```ts
tracesSampleRate: 1.0, // 100% en dev, réduire en prod (ex: 0.1)
```

---

## Alertes

Dans Sentry, configure des alertes pour :
- Nouvelles erreurs (email/Slack/Discord)
- Erreurs récurrentes (> 100/min)
- Performance dégradée (p95 > 2s)

---

## Fichiers

| Fichier | Rôle |
|---------|------|
| `sentry.client.config.ts` | Config client (browser) |
| `sentry.server.config.ts` | Config serveur (Node.js) |
| `sentry.edge.config.ts` | Config Edge (middleware) |
| `next.config.ts` | Wrap avec `withSentryConfig` |
| `src/components/ErrorBoundary.tsx` | Error boundary React |
| `src/app/global-error.tsx` | Error page globale |
| `src/lib/logger.ts` | Logger → Sentry en prod |
