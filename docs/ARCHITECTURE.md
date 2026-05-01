# LeagueScout — Architecture & Conventions

> Document de référence pour l'équipe de dev. Mise à jour : avril 2026.

---

## Stack Technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Framework | Next.js (App Router) | 15.5.15 |
| UI | React | 19 |
| Langage | TypeScript | 5.x |
| Styling | Tailwind CSS | 4 |
| Components | shadcn/ui | latest |
| ORM | Prisma | 5.22.0 |
| DB (dev) | SQLite | — |
| DB (prod) | libSQL (Turso) | — |
| Auth | NextAuth.js | 4.24.14 |
| Payments | Stripe | 22.0.2 |
| Email | Resend | — |
| Tests | Vitest + @testing-library/react | 4.1.5 |
| E2E | Playwright | — |

---

## Structure des Dossiers

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Landing, pricing, about (no auth)
│   ├── (dashboard)/        # Pages authentifiées (favorites, lists, reports)
│   ├── api/                # API Routes
│   ├── players/            # Liste + détail joueurs
│   ├── compare/            # Comparaison côte-à-côte
│   └── layout.tsx          # Root layout (providers, nav, footer)
├── components/
│   ├── ui/                 # shadcn/ui components (ne pas modifier)
│   ├── *.tsx               # Components métier
│   └── __tests__/          # Tests React
├── lib/
│   ├── __tests__/          # Tests unitaires
│   ├── db.ts               # Prisma client singleton
│   ├── logger.ts           # Logger structuré
│   ├── constants.ts        # Couleurs, rôles, ligues
│   ├── prospect-scoring.ts # Algo scoring prospect
│   └── player-filters.ts   # Filtres/sort/pagination pure
├── hooks/                  # Custom React hooks
├── types/                  # Types globaux (si besoin)
└── test/
    └── setup.ts            # Setup Vitest (jest-dom)
```

---

## Conventions de Code

### Naming
- **Components** : PascalCase (`PlayerCard.tsx`)
- **Hooks** : camelCase préfixé `use` (`useFavorites.ts`)
- **Utilitaires** : camelCase (`computeProspectScore`)
- **Types/Interfaces** : PascalCase (`PlayerFilters`)
- **Fichiers de test** : `*.test.ts` ou `*.test.tsx` à côté du code ou dans `__tests__/`

### Imports
```ts
// Ordre recommandé :
import React from "react";           // 1. React/Next
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";  // 2. UI components
import PlayerCard from "@/components/PlayerCard"; // 3. Components métier

import { logger } from "@/lib/logger";           // 4. Lib
import { ROLES } from "@/lib/constants";
```

### API Routes — Pattern Standard
```ts
import { logger } from "@/lib/logger";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
    // ... logic
  } catch (error) {
    logger.error("GET /api/xxx failed", { error });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Logger
Toujours utiliser `logger` au lieu de `console.*` dans :
- API Routes
- Server Actions
- Scripts Node

```ts
import { logger } from "@/lib/logger";

logger.info("Player created", { playerId: "p1", scoutId: "s2" });
logger.error("Database connection failed", { error: err.message });
```

---

## Patterns Récurrents

### Données — Cache avec `unstable_cache`
```ts
import { unstable_cache } from "next/cache";

const getPlayers = unstable_cache(
  async (filters) => { /* ... */ },
  ["players-list"],
  { revalidate: 60 }
);
```

### Loading States
Chaque page avec fetch de données doit avoir un `loading.tsx` :
```tsx
export default function Loading() {
  return <PlayerGridSkeleton />;
}
```

### Formulaires — Validation côté serveur
```ts
const schema = z.object({
  pseudo: z.string().min(1).max(50),
  role: z.enum(["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"]),
});

const data = schema.parse(await req.json());
```

---

## Tests

### Lancer les tests
```bash
npm run test          # Vitest (unit + integration)
npm run test:ui       # Mode UI interactif
npm run test:coverage # Avec couverture
npx playwright test   # E2E (séparé)
```

### Stratégie
| Type | Outil | Cible |
|------|-------|-------|
| Unit | Vitest | `lib/*.ts` (scoring, filtres, constants) |
| Integration | Vitest + RTL | Components métier (`PlayerCard`, `FavoriteButton`) |
| E2E | Playwright | Flows critiques (auth, checkout, compare) |

### Mock Standards
```ts
// Next Image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }) => <img src={src} alt={alt} {...props} />,
}));

// Fetch global
vi.stubGlobal("fetch", vi.fn());
```

---

## Sécurité — Checklist

- [ ] Auth requise sur toutes les routes sensibles (`/api/favorites`, `/api/lists`, etc.)
- [ ] Validation des inputs avec Zod
- [ ] Pas de `console.log` en production (utiliser `logger`)
- [ ] `NEXT_PUBLIC_*` uniquement pour données non-sensibles
- [ ] Headers de sécurité configurés dans `next.config.js`
- [ ] Uploads : validation magic number + taille max

---

## Performance — Checklist

- [ ] `unstable_cache` sur les données fréquemment lues
- [ ] Prisma `select` minimal (ne pas sélectionner `*`)
- [ ] Images optimisées avec `<Image>` (pas de `unoptimized`)
- [ ] `loading.tsx` sur toutes les routes dynamiques
- [ ] Pas de dépendances inutilisées dans `package.json`

---

## Environnements

| Variable | Dev | Prod |
|----------|-----|------|
| `DATABASE_URL` | `file:./dev.db` | `libsql://...` |
| `NEXTAUTH_SECRET` | généré localement | long & aléatoire |
| `STRIPE_SECRET_KEY` | test key | live key |
| `RESEND_API_KEY` | test key | live key |

---

## Pipeline de données Pro — `ProStats` vs `ProMatch`

> ⚠️ **Distinction critique** — Documentée pour éviter toute confusion future.

| Table | Source de vérité | Usage | Scoring |
|-------|-----------------|-------|---------|
| **`ProStats`** | Import CSV (Oracle's Elixir / Gol.gg) | Stats agrégées (KDA, CSPM, DPM, GD@15, vision, etc.) | ✅ **OUI** — `globalScore`, `tierScore`, `rawScore`, `tier` sont calculés depuis ces stats via `prisma/recalculate-scores.ts` |
| **`ProMatch`** | Saisie manuelle ou import match-by-match | Historique détaillé de chaque game (champion, build, runes, résultat) | ❌ **NON** — Les matchs individuels ne sont **jamais** utilisés pour calculer les scores. Ils servent uniquement à l'affichage de l'historique et à l'agrégation du champion pool |

**Règle d'or** : Ajouter des `ProMatch` met à jour l'onglet **Matches** et **Champ Pool**, mais ne modifie **aucunement** les scores du joueur. Pour mettre à jour les scores, il faut soit réimporter un CSV dans `ProStats`, soit modifier manuellement les champs `kda`, `cspm`, `dpm`, etc. dans `ProStats`.

---

## Migration Prisma (SQLite dev)

SQLite ne supporte pas `prisma migrate dev` en non-interactif. Utiliser :
```bash
# 1. Modifier schema.prisma
# 2. Générer le client
npx prisma generate
# 3. Appliquer les changements manuellement via SQL ALTER TABLE
# 4. En prod (Turso), utiliser : prisma migrate deploy
```

---

## Roadmap Technique (Next)

1. **Tests** — Ajouter tests pour `FavoriteButton`, `CompareGrid`, API routes
2. **Storybook** — Isoler les composants UI pour design review
3. **Monitoring** — Intégrer Sentry ou LogRocket
4. **CI/CD** — GitHub Actions (lint + test + build)
5. **Feature** — Système de notes / tags personnalisés par scout
