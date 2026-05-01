# 🎯 Roadmap Semaine - LeagueScout

## Règle : Pas de nouvelles features, optimiser et stabiliser ce qui existe.

---

## JOUR 1 : Performance (N+1 Queries)
**Priorité : 🔥🔥🔥 Critique**

### Objectif
Résoudre les 7 problèmes N+1 identifiés dans PRISMA_OPTIMIZATIONS.md

### Todo
- [ ] Fix import CSV (`/admin/import`) - paralleliser les queries Prisma
- [ ] Fix roster sync (`/admin/roster-sync`) - batcher les updates
- [ ] Fix alerts/notifications (`/api/alerts`) - inclure relations dans query unique
- [ ] Fix watchlist fetch - ajouter `include` pour charger les stats en une requête
- [ ] Fix player detail - charger `soloqStats` + `proStats` + `proMatches` en parallèle
- [ ] Fix prospects list - utiliser `select` ciblé au lieu de `include`
- [ ] Fix reports list - inclure `player` dans la query principale

### Livrable
Build passant + test de charge avec SQLite (temps de chargement < 2s par page)

---

## JOUR 2 : Code Quality - Nettoyage Dark Mode
**Priorité : 🔥🔥 Haute**

### Objectif
Supprimer toutes les traces du double design system (light/dark)

### Todo
- [ ] Scan global : trouver tous les `dark:` restants dans le projet
- [ ] Remplacer tous les `text-[#1A1A2E] dark:text-white` (devraient déjà être faits)
- [ ] Remplacer les `bg-white dark:bg-[#0f172a]` restants
- [ ] Remplacer les `border-gray-200 dark:border-gray-700` restants
- [ ] Uniformiser les couleurs hardcodées qui traînent (ex: `#1e293b`, `#0f172a`)
- [ ] Vérifier les composants shadcn/ui qui override le CSS variables
- [ ] S'assurer que `globals.css` et `tailwind.config` sont cohérents avec le design system

### Livrable
`grep -r "dark:" src/` doit retourner 0 résultats dans les fichiers `.tsx`

---

## JOUR 3 : Responsive Design
**Priorité : 🔥🔥 Haute**

### Objectif
Toutes les pages doivent être parfaites sur mobile

### Todo
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

---

## JOUR 4 : SEO & Meta
**Priorité : 🔥🔥 Haute**

### Objectif
Toutes les pages optimisées pour Google

### Todo
- [ ] Vérifier que chaque page a un `<title>` unique et descriptif
- [ ] Vérifier que chaque page a une `<meta name="description">`
- [ ] Ajouter Open Graph tags sur toutes les pages (pas juste homepage)
- [ ] S'assurer que les images ont des `alt` descriptifs
- [ ] Vérifier les URLs canoniques
- [ ] Sitemap.xml à jour avec toutes les routes
- [ ] Vérifier les balises H1/H2 (une seule H1 par page, hiérarchie logique)
- [ ] Ajouter Schema.org JSON-LD sur les pages clés

### Livrable
Lighthouse SEO score > 90 sur toutes les pages publiques

---

## JOUR 5 : Accessibility (A11y)
**Priorité : 🔥 Moyenne**

### Objectif
Rendre le site utilisable au clavier et aux lecteurs d'écran

### Todo
- [ ] Vérifier le contraste des textes (ratio WCAG AA = 4.5:1 minimum)
- [ ] Tester la navigation au clavier (Tab, Enter, Escape)
- [ ] Ajouter `aria-label` sur les boutons icônes (favoris, notifications)
- [ ] Ajouter `aria-expanded` sur les accordéons/filtres
- [ ] Ajouter `aria-current="page"` sur les liens actifs
- [ ] S'assurer que les focus rings sont visibles
- [ ] Vérifier les formulaires (labels associés, erreurs annoncées)
- [ ] Tester avec un lecteur d'écran (NVDA ou VoiceOver)

### Livrable
Lighthouse Accessibility score > 90

---

## JOUR 6 : Polissage & Bug Fixes
**Priorité : 🔥 Moyenne**

### Objectif
Corriger les petits bugs visuels et fonctionnels

### Todo
- [ ] Corriger les warnings du build (global-error.tsx, etc.)
- [ ] Corriger les erreurs de console dans le navigateur
- [ ] Uniformiser les loaders/skeletons sur toutes les pages
- [ ] Vérifier les états vides (EmptyState) - sont-ils tous cohérents ?
- [ ] Tester les états d'erreur (404, 500, offline)
- [ ] Vérifier les transitions entre les pages (loading.tsx)
- [ ] Uniformiser les tailles de boutons et d'espacements
- [ ] Vérifier que les liens morts n'existent pas

### Livrable
0 warning build, 0 erreur console, 0 lien mort

---

## JOUR 7 : Testing & Validation Finale
**Priorité : 🔥 Moyenne**

### Objectif
Valider que tout fonctionne ensemble

### Todo
- [ ] Tester le flow utilisateur complet : inscription → login → browse → favoris → compare
- [ ] Tester le flow premium : subscribe → accès reports → export CSV
- [ ] Tester sur Chrome, Firefox, Safari (ou Edge)
- [ ] Tester sur mobile réel (si possible)
- [ ] Vérifier la vitesse de chargement (Lighthouse Performance > 80)
- [ ] Vérifier que le cache fonctionne bien (revalidation)
- [ ] Faire une passe de relecture du texte (fautes d'orthographe)
- [ ] Préparer un CHANGELOG.md des modifications de la semaine

### Livrable
Checklist complète signée, site prêt pour "soft launch"

---

## 📊 Métriques de succès en fin de semaine

| Métrique | Objectif | Comment vérifier |
|----------|----------|------------------|
| Build | 0 erreur | `npm run build` |
| Lighthouse Performance | > 80 | Chrome DevTools |
| Lighthouse Accessibility | > 90 | Chrome DevTools |
| Lighthouse SEO | > 90 | Chrome DevTools |
| Temps chargement page | < 2s | DevTools Network |
| N+1 queries | 0 | Logs + observation |
| Mobile responsive | Tout ok | DevTools Responsive |
| Liens morts | 0 | Test manuel |
| Console errors | 0 | DevTools Console |

---

## 🚫 Ce qu'on ne fait PAS cette semaine

- ❌ Nouvelles features (chat, draft amélioré, etc.)
- ❌ Refonte majeure UI
- ❌ Migration de stack technique
- ❌ Ajout de nouvelles dépendances
- ❌ Modification du schéma de base de données
- ❌ Webhooks Stripe
- ❌ Upload CDN

## ✅ Ce qu'on fait

- ✅ Stabiliser
- ✅ Optimiser
- ✅ Uniformiser
- ✅ Documenter
- ✅ Tester
