# LeagueScout — Plan de Test Complet

> Dernière mise à jour : Avril 2026

---

## 1. AUTHENTIFICATION & COMPTES

### 1.1 Inscription
- [ ] Accéder à `/register` depuis le header (bouton "Sign Up")
- [ ] Créer un compte avec nom, email valide, password 8+ caractères
- [ ] Vérifier message d'erreur si password < 8 caractères
- [ ] Vérifier message d'erreur si passwords ne correspondent pas
- [ ] Vérifier message d'erreur si email déjà utilisé
- [ ] Après inscription réussie, redirection automatique vers `/dashboard`
- [ ] Vérifier que le user est bien créé en base (role="user", isPremium=false)

### 1.2 Connexion
- [ ] Accéder à `/login` depuis le header (bouton "Sign In")
- [ ] Se connecter avec email + password valides
- [ ] Vérifier message d'erreur avec credentials invalides
- [ ] Vérifier redirection vers `/dashboard` après login
- [ ] Vérifier que le header affiche le nom/email + bouton "Sign Out"
- [ ] Cliquer "Sign Out" → déconnexion + retour à la home

### 1.3 Admin
- [ ] Se connecter avec `admin@leaguescout.gg` / `admin123`
- [ ] Vérifier accès à `/admin` (dashboard admin complet)
- [ ] Vérifier que `/admin` redirige vers `/login` si non-admin
- [ ] Vérifier que les API admin retournent 401 sans session admin

---

## 2. NAVIGATION & HEADER

### 2.1 Header Desktop
- [ ] Logo "LeagueScout" cliquable → retour home
- [ ] Recherche : taper 2+ caractères affiche suggestions
- [ ] Recherche : suggestions avec photo, pseudo, role, realName
- [ ] Recherche : cliquer une suggestion → page joueur
- [ ] Recherche : appuyer Enter → page de recherche
- [ ] Recherche : dropdown utilise toute la largeur disponible
- [ ] Liens nav : Dashboard, Players, Prospects, Leaderboards, Compare, Watchlist, Lists, Draft, Reports, Tiers, Team, Settings
- [ ] Bouton Sign In / Sign Up quand déconnecté
- [ ] Bouton Sign Out + nom quand connecté
- [ ] NotificationBell affichée
- [ ] ThemeToggle fonctionne (clair/sombre)

### 2.2 Header Mobile
- [ ] Menu hamburger s'ouvre correctement
- [ ] Recherche fonctionne dans le menu mobile
- [ ] Tous les liens nav accessibles
- [ ] Fermeture du menu au clic sur un lien

### 2.3 Footer
- [ ] Liens Platform : Players, Reports, Tier Lists, Pricing
- [ ] Liens Company : About, Contact
- [ ] Liens Legal : Terms of Service, Privacy Policy
- [ ] Icônes sociales : X/Twitter, Discord, YouTube (hover = couleur)
- [ ] Copyright affiché
- [ ] Disclaimer "not endorsed by Riot Games"

---

## 3. PAGE D'ACCUEIL

- [ ] Hero section avec texte et CTA
- [ ] Featured Player (POTM) affiché avec photo, stats
- [ ] Featured Player a le badge status correct
- [ ] Section Prospects avec cartes
- [ ] Section Reports preview
- [ ] Quick Links fonctionnels
- [ ] SEO : title, meta description, OG tags

---

## 4. PAGE PLAYERS (GRILLE)

### 4.1 Affichage
- [ ] Grille de joueurs chargée
- [ ] Cartes avec photo/initial, pseudo, role badge, team, league
- [ ] Tier badge affiché si défini
- [ ] Status badge affiché (couleur correcte)
- [ ] Filtres par role fonctionnent
- [ ] Filtres par league fonctionnent
- [ ] Filtres par status fonctionnent
- [ ] Filtres par tier fonctionnent
- [ ] Recherche textuelle fonctionne
- [ ] Pagination fonctionne

### 4.2 Mode Compare
- [ ] Checkbox "Compare" visible sur chaque carte
- [ ] Sélectionner 1 joueur → barre compare apparaît (1/2)
- [ ] Sélectionner 2 joueurs → bouton "Compare" actif
- [ ] Impossible de sélectionner 3 joueurs (max 2)
- [ ] Désélectionner un joueur → barre se met à jour
- [ ] Bouton "Clear" vide la sélection
- [ ] Bouton "Compare" navigue vers `/compare?players=id1,id2`

### 4.3 Favoris
- [ ] Bouton favoris (étoile) sur chaque carte
- [ ] Cliquer ajoute/enlève des favoris
- [ ] État persistant après refresh

---

## 5. PAGE PROFILE JOUEUR (`/players/[id]`)

### 5.1 Header Profile
- [ ] Photo du joueur ou fallback avec initiale
- [ ] Pseudo + realName
- [ ] Role badge (couleur correcte)
- [ ] Status badge (🔍 Scouting pour les imports CSV)
- [ ] Tier badge avec couleur + tooltip
- [ ] League + Team
- [ ] Nationality + Age
- [ ] Bouton Favoris fonctionnel
- [ ] Bouton Export PDF fonctionnel
- [ ] Liens externes : op.gg, Gol.gg, LoLPros, Leaguepedia

### 5.2 Onglet Stats
- [ ] SoloQ Stats card : Rank (coloré), Peak LP, Winrate, Games
- [ ] Pro Stats : grille 2 colonnes avec KDA, CSD@15, GD@15, DPM, KP%, etc.
- [ ] Radar chart affiché
- [ ] Valeurs formatées correctement (%, +sign, décimales)

### 5.3 Onglet SoloQ
- [ ] Table MatchHistory avec colonnes : Champion, Result, Duration, KDA, CSM, Gold, DMG, Vision, Date
- [ ] Filtres All/Wins/Losses fonctionnent
- [ ] Champion Pool affiché dans la sidebar
- [ ] SoloqAccounts affiché avec vraies données

### 5.4 Onglet Pro Matches
- [ ] Table LCK-style : Champion, Result, Duration, KDA, CSM, DPM, KP%, Build, Date, Game, Tournament
- [ ] Build column : keystone rune + secondary + 6 items
- [ ] Filtres All/Wins/Losses
- [ ] Header stats : XW — YL (Z% WR)
- [ ] Champion icons chargés depuis DataDragon

### 5.5 Onglet Pro Champions
- [ ] Stats agrégées depuis proMatches (pas de mock data)
- [ ] Champion, Games, Wins, Losses, Winrate, KDA, CSD@15, GD@15
- [ ] Pas de colonne "Rating"

### 5.6 Onglet History
- [ ] Graphique avec toggle Peak LP / Winrate
- [ ] Summary respecte le toggle
- [ ] Design dark compact

### 5.7 Onglet Similar
- [ ] Joueurs similaires affichés
- [ ] Rank/LP display
- [ ] Design dark compact

### 5.8 Onglet Timeline
- [ ] Événements chronologiques
- [ ] Design dark compact

### 5.9 Onglet Reports
- [ ] Reports du joueur listés
- [ ] Design dark compact

### 5.10 Onglet VODs
- [ ] Liste des VODs
- [ ] Design dark compact (list au lieu de cards)

---

## 6. PAGE COMPARE

### 6.1 Sélection
- [ ] `/compare` sans params → message + bouton "Go to Players"
- [ ] `/compare?players=id1` → 404 (besoin de 2 joueurs)
- [ ] `/compare?players=id1,id2` → comparaison affichée

### 6.2 Layout Head-to-Head
- [ ] 2 cartes joueur (gauche/droite) avec photo, pseudo, role, status
- [ ] VS divider avec icône épées
- [ ] Section "Head to Head" : Country, Age, Role, Team, League
- [ ] Section "SoloQ Stats" : Peak LP, Winrate, Total Games
- [ ] Section "Pro Stats" : KDA, CSD@15, GD@15, XPD@15, DPM, KP%, Vision Score, Games Played
- [ ] Barres de comparaison bleu/rouge
- [ ] Meilleure valeur highlightée en couleur
- [ ] Section "Links" : op.gg, Gol.gg, etc.
- [ ] Section "General" : 2 radar charts côte à côte

### 6.3 Design
- [ ] Fond `bg-[#0f1117]`
- [ ] Cartes `bg-[#141621]` avec bordure `border-[#2A2D3A]`
- [ ] Joueur gauche = bleu, Joueur droite = rouge

---

## 7. PAGE CONTACT

- [ ] `/contact` accessible depuis le footer
- [ ] Design dark cohérent
- [ ] Logo + titre "Get in touch"
- [ ] 4 cartes : X/Twitter, Email, Discord, YouTube
- [ ] Chaque carte a icône, label, description
- [ ] Liens externes s'ouvrent dans nouvel onglet
- [ ] Footer links : Terms of Service, Privacy Policy
- [ ] Back to Home fonctionnel

---

## 8. TERMS OF SERVICE & PRIVACY

- [ ] `/tos` accessible depuis le footer
- [ ] `/privacy` accessible depuis le footer
- [ ] Design dark cohérent
- [ ] Contenu structuré avec sections numérotées
- [ ] Disclaimer Riot Games présent
- [ ] Email contact cliquable

---

## 9. ADMIN DASHBOARD (`/admin`)

### 9.1 Accès
- [ ] Redirection vers `/login` si non authentifié
- [ ] Redirection vers `/login` si authentifié mais pas admin

### 9.2 Stats Cards
- [ ] Total Players
- [ ] Free Agents
- [ ] LEC Players
- [ ] POTM count
- [ ] Reports count

### 9.3 Onglet Players
- [ ] Liste paginée des joueurs
- [ ] Recherche fonctionne
- [ ] Bouton "Import CSV" → `/admin/import`
- [ ] Bouton "Add Player" → dialog
- [ ] Édition joueur (dialog avec tabs Info/Pro Stats/Tags)
- [ ] Suppression joueur avec confirmation
- [ ] Toggle POTM (étoile)
- [ ] Sync SoloQ (éclair)
- [ ] Status badge affiché correctement (🔍 Scouting)

### 9.4 Onglet Import CSV
- [ ] `/admin/import` accessible
- [ ] Drop zone fonctionnelle
- [ ] Sélecteurs League/Season/Split
- [ ] Import réussi → résultats affichés (created/updated/errors)
- [ ] Joueurs créés avec status SCOUTING
- [ ] ProStats créées avec season/split

### 9.5 Autres onglets
- [ ] Prospects
- [ ] SoloQ POTW
- [ ] Reports (CRUD)
- [ ] Oracle Import
- [ ] Sync
- [ ] Alerts

---

## 10. IMPORT CSV

### 10.1 Format supporté
- [ ] CSV avec colonnes : Player,Team,Pos,Games,KDA,CSD@15,GD@15,XPD@15,CSPM,DPM,KP,VS%,WPM,WCPM,FB%,FB Victim,DMG%,GOLD%,Solo Kills,EGPM
- [ ] Rôles mappés : Top→TOP, Middle→MID, Jungle→JUNGLE, ADC→ADC, Support→SUPPORT
- [ ] Team extraite correctement

### 10.2 Comportement
- [ ] Nouveau joueur → créé avec status SCOUTING
- [ ] Joueur existant → ProStats mise à jour
- [ ] League/Season/Split configurables
- [ ] Erreurs capturées et affichées

### 10.3 Test avec données réelles
- [ ] Importer `ROL_2026_Winter_FINAL.csv`
- [ ] 41 joueurs créés
- [ ] Tous en status SCOUTING
- [ ] ProStats pour Winter 2026
- [ ] Retrouvable via recherche par pseudo

---

## 11. API ROUTES

### 11.1 Players API
- [ ] `GET /api/players` → liste paginée
- [ ] `GET /api/players?page=1&limit=10` → pagination
- [ ] `GET /api/players?role=TOP` → filtre role
- [ ] `GET /api/players?league=LEC` → filtre league
- [ ] `GET /api/players?status=FREE_AGENT` → filtre status
- [ ] `POST /api/players` → création (admin only)
- [ ] `PUT /api/players/[id]` → update (admin only)
- [ ] `DELETE /api/players/[id]` → suppression (admin only)

### 11.2 ProStats API
- [ ] `GET /api/players/[id]/prostats` → dernières stats
- [ ] `PUT /api/players/[id]/prostats` → upsert avec season/split

### 11.3 ProMatches API
- [ ] `GET /api/players/[id]/pro-matches` → liste ordonnée par date desc
- [ ] `POST /api/players/[id]/pro-matches` → création (admin only)
- [ ] `PUT /api/players/[id]/pro-matches` → update (admin only)
- [ ] `DELETE /api/players/[id]/pro-matches` → suppression (admin only)

### 11.4 Auth API
- [ ] `POST /api/auth/register` → création compte
- [ ] Email déjà existant → 409
- [ ] Password < 8 caractères → 400
- [ ] `POST /api/auth/[...nextauth]` → login/logout/session

### 11.5 Admin API
- [ ] `POST /api/admin/import-csv` → import (admin only, 401 sinon)
- [ ] `POST /api/admin/cron/sync-stats` → sync SoloQ
- [ ] `POST /api/admin/cron/check-alerts` → alerts

### 11.6 Favorites API
- [ ] `GET /api/favorites` → liste (auth required)
- [ ] `POST /api/favorites` → ajout
- [ ] `DELETE /api/favorites` → suppression
- [ ] `PATCH /api/favorites` → notes

---

## 12. DONNÉES & BASE DE DONNÉES

### 12.1 Modèle Player
- [ ] Champs obligatoires : pseudo, role, league
- [ ] Defaults : status=SCOUTING, isFeatured=false, isProspect=false
- [ ] Relations : soloqStats, proStats, proMatches, reports, vods, favorites

### 12.2 Modèle ProStats
- [ ] Unique constraint : playerId + season + split
- [ ] Champs : kda, csdAt15, gdAt15, xpdAt15, cspm, gpm, dpm, kpPercent, visionScore, wpm, wcpm, fbParticipation, fbVictim, deathsUnder15, damagePercent, goldPercent, soloKills, proximityJungle, gamesPlayed, season, split

### 12.3 Modèle User
- [ ] Champs : email (unique), name, passwordHash, role, isPremium, subscriptionStatus
- [ ] Defaults : role="user", isPremium=false, subscriptionStatus="inactive"

---

## 13. COMPOSANTS UI

### 13.1 PlayerCard
- [ ] Affichage compact avec photo/initial
- [ ] Role badge coloré
- [ ] Status badge coloré
- [ ] Tier badge si défini
- [ ] Mode compare (checkbox)
- [ ] Mode favoris (étoile)

### 13.2 CompareBar
- [ ] Apparaît quand 1+ joueur sélectionné
- [ ] Affiche "X/2 selected"
- [ ] Noms des joueurs sélectionnés
- [ ] Bouton Clear
- [ ] Bouton Compare (disabled si < 2)
- [ ] Max 2 joueurs

### 13.3 ExportPdfButton
- [ ] Génère PDF avec stats du joueur
- [ ] Winrate affiché en % (pas 0.57)

### 13.4 Radar Charts
- [ ] RoleRadarChart : 7 axes par rôle
- [ ] AdcRadarChart : percentiles vs league/tier/all
- [ ] Données réelles ou placeholder

---

## 14. RESPONSIVE DESIGN

- [ ] Desktop (1280px+) : layout complet
- [ ] Laptop (1024px) : recherche réduite, nav compacte
- [ ] Tablet (768px) : menu mobile, grille 2 cols
- [ ] Mobile (375px) : menu hamburger, grille 1 col, recherche pleine largeur
- [ ] Player profile : tabs scrollables sur mobile
- [ ] Compare page : scroll horizontal si besoin

---

## 15. PERFORMANCE

- [ ] Page players charge en < 2s
- [ ] Profile joueur charge en < 2s
- [ ] Recherche suggestions en < 300ms
- [ ] Images optimisées (next/image)
- [ ] Pas de layout shift au chargement

---

## 16. SEO & ACCESSIBILITÉ

- [ ] Title tags uniques par page
- [ ] Meta descriptions
- [ ] OG tags (Open Graph)
- [ ] Twitter cards
- [ ] Canonical URLs
- [ ] Sitemap.xml
- [ ] Skip to main content link
- [ ] Aria labels sur boutons/icons
- [ ] Contraste suffisant (dark mode)

---

## 17. TESTS AUTOMATISÉS

- [ ] `npm run test` → 146 tests passent
- [ ] `npm run build` → build sans erreur
- [ ] Tests CompareBar (9 tests)
- [ ] Tests PlayerCard (13 tests)
- [ ] Tests schemas (24 tests)
- [ ] Tests constants (4 tests)
- [ ] Tests API auth (11 tests)

---

## 18. SCÉNARIOS END-TO-END

### 18.1 Scénario : Nouveau scout découvre la plateforme
1. [ ] Visite la home page
2. [ ] Clique "Players" dans le nav
3. [ ] Filtre par league "ROL"
4. [ ] Voit les joueurs importés avec badge 🔍 Scouting
5. [ ] Clique sur un joueur → page profile
6. [ ] Explore les onglets Stats, SoloQ, Pro Matches
7. [ ] Ajoute le joueur aux favoris
8. [ ] Crée un compte
9. [ ] Se connecte
10. [ ] Retrouve ses favoris

### 18.2 Scénario : Admin importe un nouveau tournoi
1. [ ] Se connecte en admin
2. [ ] Va sur `/admin`
3. [ ] Clique "Import CSV"
4. [ ] Upload un CSV
5. [ ] Configure League=ROL, Season=2026, Split=Summer
6. [ ] Clique "Import Players"
7. [ ] Vérifie les résultats (X créés, Y mis à jour)
8. [ ] Va sur `/players`
9. [ ] Filtre par league ROL
10. [ ] Vérifie que les nouveaux joueurs ont badge 🔍 Scouting

### 18.3 Scénario : Comparaison de 2 joueurs
1. [ ] Va sur `/players`
2. [ ] Active le mode Compare (checkbox)
3. [ ] Sélectionne 2 joueurs
4. [ ] Clique "Compare"
5. [ ] Vérifie la page compare head-to-head
6. [ ] Vérifie les barres de stats bleu/rouge
7. [ ] Vérifie les radar charts

---

## 19. BUGS CONNUS À VÉRIFIER

- [ ] ProStats % : pas de double *100 (doit afficher 65.6% pas 6560%)
- [ ] Export PDF winrate : doit afficher 57% pas 0.57
- [ ] SoloQ crash : Champion Pool avec onError en client component
- [ ] AdcRadarChart headers : en haut pas en bas
- [ ] Language : tout en anglais (All/Wins/Losses)

---

## 20. FONCTIONNALITÉS FUTURES À TESTER (quand implémentées)

- [ ] Système de pricing / abonnements
- [ ] Organisation/Team management
- [ ] API keys pour accès programmatique
- [ ] Webhooks pour notifications
- [ ] Import Oracle's Elixir
- [ ] Système de tags comportementaux
- [ ] Notes privées sur joueurs
- [ ] Partage de listes de joueurs
- [ ] Draft board interactif
- [ ] Notifications temps réel
