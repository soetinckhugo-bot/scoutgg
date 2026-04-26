# LeagueScout — Component Catalog

> Référence rapide des composants métier et de leurs props.

---

## PlayerCard

Carte d'affichage d'un joueur (liste ou grille).

```tsx
import PlayerCard from "@/components/PlayerCard";

<PlayerCard
  player={player}
  showStats={true}      // default: true — affiche le grid SoloQ
  showFavorite={true}   // default: true — affiche le ♥
  variant="default"     // "default" | "compact"
  compareMode={false}   // active la checkbox de comparaison
  isSelected={false}    // état checkbox
  onToggleCompare={() => {}} // handler checkbox
/>
```

**Player shape:**
```ts
{
  id: string;
  pseudo: string;
  realName: string | null;
  role: string;
  league: string;
  status: string;
  currentTeam: string | null;
  photoUrl: string | null;
  soloqStats?: { currentRank, peakLp, winrate, totalGames } | null;
  proStats?: { kda, csdAt15, gdAt15, dpm, kpPercent, visionScore, championPool, gamesPlayed, season } | null;
}
```

---

## FavoriteButton

Bouton favoris avec état persistant (API `/api/favorites`).

```tsx
import FavoriteButton from "@/components/FavoriteButton";

<FavoriteButton playerId="p1" variant="small" />
// variant: "default" (bouton texte) | "small" (icône seule)
```

**Note:** Fait un `fetch` au mount pour récupérer l'état. Mock dans les tests.

---

## PlayerGrid

Grille responsive de `PlayerCard`.

```tsx
import PlayerGrid from "@/app/players/PlayerGrid";

<PlayerGrid players={players} />
```

---

## Skeletons

Tous les loaders utilisent le pattern `animate-pulse` :

```tsx
import { PlayerGridSkeleton } from "@/components/skeletons";
import { PlayerDetailSkeleton } from "@/components/skeletons";
```

---

## Badges & Couleurs

Utiliser les maps de `constants.ts` :

```ts
import { ROLE_COLORS, STATUS_COLORS, TIER_COLORS } from "@/lib/constants";

<Badge className={ROLE_COLORS["TOP"]}>TOP</Badge>
<Badge className={STATUS_COLORS["FREE_AGENT"]}>Free Agent</Badge>
```

---

## Formulaires

Utiliser les composants shadcn/ui + `react-hook-form` + `zod` :

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({ pseudo: z.string().min(1) });
type FormData = z.infer<typeof schema>;

const form = useForm<FormData>({ resolver: zodResolver(schema) });
```
