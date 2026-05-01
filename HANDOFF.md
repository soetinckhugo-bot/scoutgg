# 📋 Handoff - Reprise du projet

## Contexte

Le projet **LeagueScout** (ScoutGG) est une plateforme de scouting esport pour League of Legends. C'est un projet Next.js 15 avec App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Prisma 5, SQLite (dev).

## ✅ Ce qui a été fait

### Semaine précédente - Jours 1 & 2

#### Jour 1 : Performance (N+1 Queries)
Toutes les 7 N+1 queries identifiées ont été corrigées :

| Fichier | Optimisation |
|---------|-------------|
| `src/app/api/admin/import-csv/route.ts` | Batch `findMany` + `Promise.all` par lot de 5 |
| `src/app/api/cron/check-alerts/route.ts` | Pré-charger notifications + batch create |
| `src/app/api/cron/sync-stats/route.ts` | `Promise.all` par lot de 5 |
| `src/lib/leaguepedia.ts` | `findMany` + `$transaction` batch |
| `src/app/api/import/oracle/route.ts` | `findMany` + batch upsert |
| `src/app/api/cron/weekly-digest/route.ts` | Charger tout en 2 requêtes + batch emails |
| `src/app/api/prospects/recalculate/route.ts` | Batch `$transaction` par 20 |

#### Jour 2 : Code Quality - Nettoyage Dark Mode
- **583 problèmes** de double design system (light/dark) ont été corrigés
- **122 fichiers** modifiés
- Tous les `dark:` modifiers ont été supprimés (sauf 1 légitime dans `design-tokens.ts`)
- Toutes les pages sont maintenant en **dark mode 100%**

### Design System appliqué partout

| Token | Valeur | Usage |
|-------|--------|-------|
| `bg-[#0F0F1A]` | `#0F0F1A` | Fond de page |
| `bg-[#141621]` | `#141621` | Cartes, surfaces |
| `bg-[#1A1D29]` | `#1A1D29` | En-têtes, hover |
| `bg-[#232838]` | `#232838` | Placeholders, skeletons |
| `border-[#2A2D3A]` | `#2A2D3A` | Bordures |
| `border-[#3A3D4A]` | `#3A3D4A` | Hover bordures |
| `text-white` | `#FFFFFF` | Titres |
| `text-[#E9ECEF]` | `#E9ECEF` | Texte principal |
| `text-[#A0AEC0]` | `#A0AEC0` | Texte secondaire |
| `text-[#6C757D]` | `#6C757D` | Texte muted |
| `text-[#ADB5BD]` | `#ADB5BD` | Labels subtiles |
| `bg-[#E94560]` | `#E94560` | Accent, CTA |
| `hover:bg-[#d13b54]` | `#d13b54` | Hover accent |

### Fichiers Design System créés
- `src/styles/design-system.ts` - Tokens complets
- `src/components/layout/PageSection.tsx` - Wrapper de section
- `src/components/layout/SectionHeader.tsx` - Titre + sous-titre
- `src/components/ui/DarkCard.tsx` - Carte sombre réutilisable

### Composant Flag créé
- `src/components/Flag.tsx` - Drapeaux avec `react-flagkit`
- 19 pays mappés avec drapeaux réalistes
- Support drapeaux multiples (ex: `["be", "nl", "lu"]` pour Benelux)

### PlayerCard amélioré
- Bordure rouge au hover (`hover:border-[#E94560]/50`)
- Pseudo en rouge au hover
- Stats visibles (LP, Winrate, KDA) avec icônes

## 🎯 Prochaine étape : Jour 3 - Responsive Design

### Objectif
Toutes les pages doivent être parfaites sur mobile

### Todo à faire
- [ ] `/players` - tester grille 2/3/4 colonnes sur mobile
- [ ] `/players/[id]` - onglets scrollables, sidebar en dessous
- [ ] `/dashboard` - empilement des 3 colonnes sur mobile
- [ ] `/compare` - scroll horizontal ou empilement
- [ ] `/pricing` - grille 1 colonne sur mobile
- [ ] `/watchlist` - cards pleine largeur
- [ ] Tables admin (`/admin`) - scroll horizontal sur petits écrans
- [ ] Vérifier que le texte ne dépasse pas (overflow)
- [ ] Tester les boutons/touch targets (min 44px)

### Livrable
Test manuel avec DevTools iPhone SE, iPhone 14, iPad - 0 débordement

## 🚀 Comment reprendre

1. Lire ce fichier HANDOFF.md
2. Vérifier que le build passe : `npm run build`
3. Commencer par scanner les problèmes responsive avec DevTools
4. Corriger page par page en priorisant les pages publiques

## 📁 Structure clés

```
src/app/           # Routes et pages (24 pages)
src/components/    # Composants React
src/styles/        # Design system tokens
src/lib/           # Utilitaires, logique métier
prisma/schema.prisma  # Schéma DB avec indexes
```

## ⚠️ Points d'attention

- SQLite en dev = pas d'enums (string literals)
- Build doit passer à chaque modification
- Pas de `git commit` sans confirmation
- Windows PowerShell = problèmes d'encodage Unicode (éviter les emojis dans les commandes)
