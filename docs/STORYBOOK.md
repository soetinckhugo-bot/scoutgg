# LeagueScout — Storybook Guide

> Isolation visuelle des composants pour design review et documentation.

---

## Commandes

```bash
# Lancer Storybook en dev
npm run storybook
# → http://localhost:6006

# Build statique (pour déploiement)
npm run build-storybook
# → Output dans storybook-static/

# Tests des stories (via Vitest browser)
npm run test:storybook
```

---

## Stories disponibles

| Composant | Fichier | Variants |
|-----------|---------|----------|
| **Avatar** | `Avatar.stories.tsx` | WithImage, Fallback, Sizes (sm/md/lg/xl) |
| **PlayerCard** | `PlayerCard.stories.tsx` | Default, Compact, WithTeam, NoStats, CompareMode, Selected |
| **FavoriteButton** | `FavoriteButton.stories.tsx` | Default, Small |
| **ReportCard** | `ReportCard.stories.tsx` | Free, Premium, Preview, NoPlayer |
| **Badge** | `ui/Badge.stories.tsx` | Default, Roles, Statuses, Tiers |

---

## Ajouter une nouvelle story

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MonComposant from "./MonComposant";

const meta: Meta<typeof MonComposant> = {
  title: "Components/MonComposant",  // Catégorie/Nom dans le sidebar
  component: MonComposant,
  tags: ["autodocs"],  // Génère la doc auto
  argTypes: {
    // Contrôles interactifs
    variant: { control: "select", options: ["a", "b"] },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "a",
    disabled: false,
  },
};

export const Disabled: Story = {
  args: {
    variant: "a",
    disabled: true,
  },
};
```

---

## Conventions

- **Imports** : Toujours utiliser `@storybook/nextjs-vite` (pas `@storybook/react`)
- **Fichiers** : `*.stories.tsx` à côté du composant
- **Naming** : `title: "Category/ComponentName"` — `Components/` pour les métier, `UI/` pour shadcn
- **Tags** : `autodocs` pour générer la documentation automatiquement

---

## Addon a11y

Storybook inclut l'addon accessibility. Chaque story affiche les violations WCAG dans l'onglet "Accessibility".

En CI, le build échoue si des violations critiques sont détectées (configurable dans `.storybook/preview.ts`).

---

## Déploiement

Le build statique peut être déployé sur :
- **Chromatic** (par Vercel/Storybook) — review visuelle par PR
- **Netlify / Vercel** — dossier `storybook-static/`
- **GitHub Pages** — via workflow CI
