# LeagueScout — Testing Guide

> Comment écrire, organiser et maintenir les tests du projet.

---

## Couverture Actuelle

| Fichier | Tests | Type |
|---------|-------|------|
| `constants.test.ts` | 4 | Unit |
| `prospect-scoring.test.ts` | 4 | Unit |
| `player-filters.test.ts` | 19 | Unit |
| `schemas.test.ts` | 24 | Unit |
| `logger.test.ts` | 4 | Unit |
| `api-auth.test.ts` | 11 | Unit |
| `rate-limit.test.ts` | 7 | Unit |
| `utils.test.ts` | 7 | Unit |
| `Avatar.test.tsx` | 4 | Component |
| `PlayerCard.test.tsx` | 13 | Component |
| `FavoriteButton.test.tsx` | 9 | Component |
| `CompareBar.test.tsx` | 9 | Component |
| `ReportCard.test.tsx` | 12 | Component |
| **Total** | **127** | — |

---

## Organisation

```
src/
├── lib/__tests__/          # Tests unitaires pour lib/
│   ├── constants.test.ts
│   ├── prospect-scoring.test.ts
│   ├── player-filters.test.ts
│   ├── schemas.test.ts
│   ├── logger.test.ts
│   ├── api-auth.test.ts
│   ├── rate-limit.test.ts
│   └── utils.test.ts
└── components/__tests__/   # Tests React pour components/
    ├── Avatar.test.tsx
    ├── PlayerCard.test.tsx
    ├── FavoriteButton.test.tsx
    ├── CompareBar.test.tsx
    └── ReportCard.test.tsx
```

---

## Patterns par Type de Test

### 1. Tests Unitaires (lib/)

**Fonctions pures** — pas de mocks nécessaires :
```ts
import { filterPlayers } from "../player-filters";

it("filters by role", () => {
  const result = filterPlayers(players, { role: "TOP" });
  expect(result).toHaveLength(1);
});
```

**Fonctions avec état global** — reset entre les tests :
```ts
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01"));
});

afterEach(() => {
  vi.useRealTimers();
});
```

**Modules avec `process.env`** — utiliser `vi.resetModules()` :
```ts
it("behaves differently in dev", async () => {
  vi.resetModules();
  process.env.NODE_ENV = "development";
  const { logger } = await import("../logger");
  // ... test
});
```

### 2. Tests de Composants (components/)

**Mock Next.js Image** (toujours) :
```ts
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }) => <img src={src} alt={alt} {...props} />,
}));
```

**Mock fetch global** :
```ts
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) })));
});
```

**Mock sonner toast** :
```ts
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
```

**Mock Next.js router** :
```ts
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
```

**Attendre les effets asynchrones** :
```ts
import { waitFor } from "@testing-library/react";

await waitFor(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument();
});
```

### 3. Tests de Schemas Zod

Tester les cas valides, invalides, et limites :
```ts
it("rejects age below 13", () => {
  const result = PlayerCreateSchema.safeParse({ ...valid, age: 12 });
  expect(result.success).toBe(false);
});

it("accepts null for optional fields", () => {
  const result = PlayerCreateSchema.safeParse({ ...valid, realName: null });
  expect(result.success).toBe(true);
});
```

---

## Commandes

```bash
# Unit tests (Vitest)
npm run test              # Mode watch
npm run test -- --run     # Run once (CI)
npm run test:ui           # UI interactif
npm run test:coverage     # Avec couverture

# E2E tests (Playwright)
npm run test:e2e          # Run all E2E
npm run test:e2e:ui       # Mode UI avec debugger

# Un fichier spécifique
npm run test -- --run src/lib/__tests__/player-filters.test.ts
npx playwright test e2e/players.spec.ts
```

---

## Ce qu'on ne teste PAS (encore)

| Cible | Raison | Quand ? |
|-------|--------|---------|
| API Routes avec Prisma | Nécessite DB mockée ou test container | Si on ajoute un test d'intégration DB |
| Server Components Next.js | Pas supporté par RTL, testé via E2E | Playwright |
| Auth flows complets | Dépend de NextAuth + DB | E2E |
| Uploads | Dépend du filesystem | Test manuel |

---

## CI/CD (GitHub Actions)

Deux workflows sont configurés :

### `ci.yml` — Push sur main/develop
```
Lint → Unit Tests → Build → E2E Tests
```

### `pr-checks.yml` — Pull Request
```
Lint → Unit Tests → Build
```

**Status checks** : Les PR ne peuvent pas être mergées si un job échoue.

### Variables d'environnement CI
Le build et les tests E2E utilisent des valeurs par défaut pour les secrets :
- `NEXTAUTH_SECRET` : généré automatiquement (min 32 chars)
- `DATABASE_URL` : `file:./dev.db` (SQLite)
- `STRIPE_*` : clés de test

En production, configure ces secrets dans **Settings → Secrets and variables → Actions**.

---

## Checklist avant de commit

- [ ] `npm run test -- --run` passe
- [ ] `npm run build` passe (0 erreurs, 0 warnings)
- [ ] `npm run lint` passe
- [ ] `npm run test:e2e` passe (si tu as modifié des pages)
- [ ] Nouveaux tests couvrent les cas normaux ET les edge cases
- [ ] Pas de `console.log` dans le code de prod
