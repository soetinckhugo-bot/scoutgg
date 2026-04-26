# Bugs & Notes - LeagueScout

> Fichier de suivi des bugs trouves pendant les tests.  
> **Regle :** On note, on ne fixe pas sauf instruction explicite.

---

## Bugs Actifs

### Bug #1 - Register : Auto-login echoue apres creation de compte
**Date :** 2026-04-25  
**Description :** Apres soumission du formulaire d'inscription, le compte est bien cree en base, mais l'utilisateur reste bloque sur `/register`. Il doit manuellement aller sur `/login` et se reconnecter. Le code d'auto-login (`signIn` apres `fetch`) est present mais ne fonctionne pas - probablement `signIn` qui echoue silencieusement ou la redirection `router.push` qui ne s'execute pas.  
**Fichier concerne :** `src/app/register/page.tsx`  
**Impact :** UX - friction inutile pour nouveaux utilisateurs  
**Priorite :** Haute

### Bug #2 - Recherche header : Dropdown casse (position + overflow + Enter)
**Date :** 2026-04-25  
**Description :** La recherche dans le header a plusieurs problemes : (1) le dropdown des suggestions est positionne incorrectement - il apparait DESSUS le texte "Dashboard" au lieu d'etre sous la barre de recherche, (2) le contenu du dropdown est coupe/invisible (overflow hidden du parent), (3) appuyer sur Enter redirige vers `/dashboard` au lieu de la page de resultats. Voir captures.  
**Fichier concerne :** `src/components/layout/header.tsx` (SearchDropdown position + SearchInputWithAutocomplete handleKeyDown)  
**Impact :** UX - recherche completement inutilisable  
**Priorite :** Haute

### Bug #3 - Export PDF : "Failed to generate"
**Date :** 2026-04-25  
**Description :** Le bouton Export PDF sur la page profile joueur affiche "Failed to generate" au clic. Le bouton est present mais la generation echoue.  
**Fichier concerne :** `src/components/ExportPdfButton.tsx`  
**Impact :** Fonctionnalite premium non operationnelle  
**Priorite :** Moyenne

### Bug #4 - Formatage des valeurs ProStats incorrect
**Date :** 2026-04-25  
**Description :** Les valeurs ProStats sont mal formatees sur la page profile (onglet Stats). Probleme constate aussi bien sur les joueurs importes par CSV que sur Space (manuel). Exemples : winrate affiche probablement 0.65 au lieu de 65%, KP% mal formate, etc. Le bug du double *100 a ete corrige precedemment mais d'autres formats sont encore incorrects.  
**Fichier concerne :** `src/app/players/[id]/PlayerStats.tsx`  
**Impact :** Donnees illisibles pour les scouts  
**Priorite :** Haute

---

## Notes & Idees Futures

### Roles Premium (a implementer plus tard)
**Idee :** Systeme d'abonnement a ~10 euros/mois avec roles dedies  
**Roles envisages :**
| Role | Prix | Acces |
|------|------|-------|
| `free` | Gratuit | Players grid, profiles publics |
| `premium` | ~10 euros/mois | Reports premium, compare avance, favoris illimites, export PDF, notifications |
| `scout_pro` | ~30 euros/mois | API access, bulk import, org management |
| `enterprise` | Sur devis | Multi-sieges, white-label, support dedie |

**Dependances :** Stripe integration, subscription webhooks, feature gating cote API  
**Status :** Pas prioritaire pour l'instant

---

## Ameliorations Homepage (a faire a la fin)

### 1. Hero Section
- [ ] **Description** : changer pour "League of Legends scouting made accessible to everyone! Whether you're an amateur or a professional, LeagueScout is made for you." (traduction de la phrase en francais)

### 2. Player of the Month
- [ ] **Design** : ameliorer le visuel, s'inspirer du design system dark des onglets (bg-[#141621], bordures [#2A2D3A])
- [ ] **Ajouter** : league du joueur, age
- [ ] **Layout** : mettre Player of the Month et Player of SOLOQ cote a cote (gauche/droite), meme hauteur, utiliser toute la largeur

### 3. Player of SOLOQ
- [ ] **Design** : identique a Player of the Month (meme style, meme hauteur)
- [ ] **Layout** : cote a cote avec POTM, pas en dessous

### 4. Stats Bar
- [ ] **Chiffres** : 500+ Player Profiles, 50+ Scouting Reports, ERL/Regional Leagues Covered, Weekly New Reports
- [ ] **Enlever** : les 4 icons au dessus des chiffres (Users, Search, TrendingUp, Star)

### 5. Recently Added
- [ ] **Ajouter** : age du joueur + drapeau de la nationalite (si disponible)

### 6. Free Reports
- [ ] Section invisible actuellement car pas de reports non-premium en base — normal

### 7. CTA Section
- [ ] **Prix** : mettre a jour avec le vrai prix du pricing (pas 7.99)
- [ ] **Couleur bouton** : le bouton "Get Scout Pass" du hero doit aussi etre rouge (#E94560) comme le CTA section pour coherence

---

## Features manquantes / A creer

### Onglet Similar
**Status :** L'onglet existe mais affiche probablement "No similar players found" ou une liste vide.  
**A faire :** Algorithme de similarite base sur le role, la league, les stats (KDA, DPM, etc.) pour suggerer des joueurs comparables.  
**Priorite :** Moyenne

### Onglet Timeline
**Status :** L'onglet existe mais vide pour la plupart des joueurs.  
**A faire :** Systeme d'evenements (transfers, rank up, nouveaux reports, awards) qui s'affichent chronologiquement.  
**Priorite :** Basse

### Onglet Reports
**Status :** L'onglet existe mais vide car pas de reports crees.  
**A faire :** Creer des reports depuis l'admin.  
**Priorite :** A toi de voir si tu veux des reports maintenant

### Onglet VODs
**Status :** L'onglet existe mais vide.  
**A faire :** Ajouter des URLs de VODs (YouTube, Twitch) pour chaque joueur.  
**Priorite :** Basse

---

## Ameliorations Players Grid (a faire a la fin)

### 1. PlayerCard design
- [ ] **Enlever SoloQ stats** (Rank, LP, WR%) de la carte — pas interessant dans la grille, prend de la place
- [ ] **Design** : s'inspirer du design system dark des onglets (bg-[#141621], bordures [#2A2D3A], plus compact)

### 2. Compare mode
- [ ] **Checkbox chevauche** : l'icone "Compare" chevauche d'autres elements (voir screen 3)
- [ ] **Flow compare** : au lieu de selectionner depuis Players, aller directement sur `/compare` et chercher les joueurs la-bas

### 3. Hero texte
- [ ] **"across Europe"** → "across Worlds" (ou enlever la mention regionale)

### 4. Compteur joueurs
- [ ] **"42 players found"** : mettre plus en avant, plus clean visuellement (pas juste petit texte sous le titre)

### 5. Pagination
- [ ] **"Page 1 of 5"** : enlever car deja present avec les boutons pagination

### 6. Filtre Tier
- [ ] **Invisible** : le filtre Tier n'apparait pas dans l'interface

---

## Ameliorations Admin Import CSV (a faire a la fin)

### 1. Leagues disponibles
- [ ] **Ajouter NLC** (Northern League Championship) et d'autres ERL manquants dans le selecteur League

---

## Ameliorations Pagination (a faire a la fin)

### 1. Limite de pages affichees
- [ ] **Bloquer a 10** : quand il y aura 500+ joueurs, la pagination ne doit pas afficher 50+ boutons de pages. Afficher max 10 pages + Prev/Next, ou utiliser un systeme "..." pour sauter des pages (ex: 1 2 3 ... 48 49 50). Voir screen : actuellement 10 pages ca va mais ca va exploser avec plus de joueurs.

---

## Bugs Fixes (historique)

*Aucun bug fixe enregistre dans ce fichier pour l'instant.*
