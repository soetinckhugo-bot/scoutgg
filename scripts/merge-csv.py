#!/usr/bin/env python3
"""
Merge CSV — Oracle's Elixir + GOL.gg
=====================================

Usage:
    python merge-csv.py --oracles oracles.csv --gol gol.csv --output merged.csv
    python merge-csv.py --sr season_regular.csv --po playoffs.csv --gol gol.csv --output merged.csv

Règles de priorité:
    - W%, KP, FB%, DMG%, EGPM → GOL.gg (décimales plus précises)
    - DPM → Maximum des deux sources
    - K, D, A, KDA, CSPM, DTH%, KS% → Oracle's (données brutes fiables)
    - GD@15, CSD@15, XPD@15, Vision, Solo Kills, FB Victim, Penta Kills → GOL.gg uniquement
"""

import argparse
import csv
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple


# ============================================================================
# CONFIGURATION
# ============================================================================

# Mapping des noms de colonnes problématiques
COLUMN_ALIASES = {
    "csd15": ["CSD15", "CSD@15", "csd@15", "csd_15"],
    "gd15": ["GD15", "GD@15", "gd@15", "gd_15"],
    "xpd15": ["XPD15", "XPD@15", "xpd@15", "xpd_15"],
    "fbv": ["FB Victim", "FBVictim", "fb_victim", "fbvictim"],
    "fb": ["FB%", "fb%", "fb_percent"],
    "kp": ["KP", "kp", "kp_percent", "KP%"],
    "w": ["W%", "w%", "winrate", "win_rate"],
    "dmg": ["DMG%", "dmg%", "damage_percent"],
    "gold": ["GOLD%", "gold%", "gold_percent"],
    "dth": ["DTH%", "dth%", "death_percent"],
    "ks": ["KS%", "ks%", "kill_share"],
    "ctr": ["CTR%", "ctr%", "counter_pick"],
    "cspm": ["CSPM", "cspm"],
    "dpm": ["DPM", "dpm"],
    "egpm": ["EGPM", "egpm", "gpm"],
    "csmp15": ["CS%P15", "cs%p15", "cs_percent_15"],
    "dp15": ["D%P15", "d%p15", "d_percent_15"],
    "tdpg": ["TDPG", "tdpg", "total_damage_per_game"],
    "stl": ["STL", "stl", "steals"],
    "vspm": ["VSPM", "vspm", "vision_score_per_min"],
    "vs": ["VS%", "vs%", "vision_share"],
    "wpm": ["WPM", "wpm", "wards_per_min"],
    "cwpm": ["CWPM", "cwpm", "control_wards_per_min"],
    "wcpm": ["WCPM", "wcpm", "wards_cleared_per_min"],
    "vwpm": ["VWPM", "vwpm", "vision_wards_per_min"],
    "avgk": ["Avg kills", "avg_kills", "avg_k"],
    "avgd": ["Avg deaths", "avg_deaths", "avg_d"],
    "avga": ["Avg assists", "avg_assists", "avg_a"],
    "avgwpm": ["Avg WPM", "avg_wpm"],
    "avgwcpm": ["Avg WCPM", "avg_wcpm"],
    "avgvwpm": ["Avg VWPM", "avg_vwpm"],
    "csm": ["CSM", "csm", "cs_per_min"],
    "solo": ["Solo Kills", "solo_kills", "solokills"],
    "penta": ["Penta Kills", "penta_kills", "pentakills"],
}

# Mapping inverse : nom normalisé → nom canonique
CANONICAL_NAMES = {
    "csd15": "CSD@15",
    "gd15": "GD@15",
    "xpd15": "XPD@15",
    "fbv": "FB Victim",
    "fb": "FB%",
    "kp": "KP",
    "w": "W%",
    "dmg": "DMG%",
    "gold": "GOLD%",
    "dth": "DTH%",
    "ks": "KS%",
    "ctr": "CTR%",
    "cspm": "CSPM",
    "dpm": "DPM",
    "egpm": "EGPM",
    "csmp15": "CS%P15",
    "dp15": "D%P15",
    "tdpg": "TDPG",
    "stl": "STL",
    "vspm": "VSPM",
    "vs": "VS%",
    "wpm": "WPM",
    "cwpm": "CWPM",
    "wcpm": "WCPM",
    "vwpm": "VWPM",
    "avgk": "Avg kills",
    "avgd": "Avg deaths",
    "avga": "Avg assists",
    "avgwpm": "Avg WPM",
    "avgwcpm": "Avg WCPM",
    "avgvwpm": "Avg VWPM",
    "csm": "CSM",
    "solo": "Solo Kills",
    "penta": "Penta Kills",
}

# Règles de priorité
GOL_PRIORITY = {"w", "kp", "fb", "dmg", "egpm"}  # GOL.gg gagne
ORACLES_PRIORITY = {"k", "d", "a", "kda", "cspm", "dth", "ks", "ctr",
                    "gd10", "xpd10", "csd10"}  # Oracle's gagne
MAX_FIELDS = {"dpm"}  # Maximum des deux
GOL_EXCLUSIVE = {"gd15", "csd15", "xpd15", "vspm", "wpm", "cwpm", "wcpm",
                 "vwpm", "vs", "csm", "avgk", "avgd", "avga", "avgwpm",
                 "avgwcpm", "avgvwpm", "solo", "fbv", "penta", "stl",
                 "tdpg", "csmp15", "dp15"}

# Mapping des noms de joueurs problématiques
NAME_MAPPING = {
    "Hiro": "H1ro",
    "KKT": "Karim KT",
    "Saken": "SAKEN",
}


# ============================================================================
# UTILITAIRES
# ============================================================================

def normalize_column(col: str) -> str:
    """Normalise un nom de colonne pour le matching."""
    col = col.strip().lower()
    col = col.replace("@", "").replace("_", "").replace(" ", "").replace("%", "")
    return col


def find_canonical_name(col: str) -> Optional[str]:
    """Trouve le nom canonique d'une colonne."""
    norm = normalize_column(col)
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if normalize_column(alias) == norm:
                return canonical
    return None


def normalize_name(name: str) -> str:
    """Normalise un nom de joueur."""
    name = name.strip()
    return NAME_MAPPING.get(name, name)


def parse_value(val: str) -> Optional[float]:
    """Parse une valeur numérique."""
    if not val or val.strip() in ("", "-", "Absente", "absente", "N/A", "n/a"):
        return None
    val = val.replace(",", "").replace("%", "").strip()
    try:
        return float(val)
    except ValueError:
        return None


def parse_int_value(val: str) -> Optional[int]:
    """Parse une valeur entière."""
    parsed = parse_value(val)
    return int(parsed) if parsed is not None else None


# ============================================================================
# PARSING CSV
# ============================================================================

def read_csv_file(filepath: str) -> Tuple[List[str], List[Dict[str, str]]]:
    """Lit un fichier CSV et retourne (headers, rows)."""
    path = Path(filepath)
    if not path.exists():
        print(f"❌ Fichier non trouvé: {filepath}")
        sys.exit(1)

    with open(path, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        headers = next(reader)
        rows = []
        for row in reader:
            if not row or all(cell.strip() == "" for cell in row):
                continue
            row_dict = {}
            for i, h in enumerate(headers):
                row_dict[h.strip()] = row[i] if i < len(row) else ""
            rows.append(row_dict)

    return headers, rows


def parse_oracles_csv(filepath: str) -> Dict[str, Dict[str, any]]:
    """
    Parse un CSV Oracle's Elixir (stats par game) et agrège par joueur.
    Retourne: {nom_joueur_normalisé: {champ: valeur}}
    """
    headers, rows = read_csv_file(filepath)

    # Identifier les colonnes importantes
    col_map = {}
    for h in headers:
        canon = find_canonical_name(h)
        if canon:
            col_map[h] = canon
        elif h.lower() in ("playername", "player", "name"):
            col_map[h] = "player"
        elif h.lower() in ("teamname", "team"):
            col_map[h] = "team"
        elif h.lower() in ("position", "pos", "role"):
            col_map[h] = "pos"
        elif h.lower() in ("game", "games", "result"):
            col_map[h] = "result"
        elif h.lower() in ("kills", "k"):
            col_map[h] = "k"
        elif h.lower() in ("deaths", "d"):
            col_map[h] = "d"
        elif h.lower() in ("assists", "a"):
            col_map[h] = "a"
        elif h.lower() in ("damagetochamps", "damagetotal"):
            col_map[h] = "damage"

    # Agréger par joueur
    players: Dict[str, Dict] = {}

    for row in rows:
        # Trouver le nom du joueur
        player_name = None
        for h, mapped in col_map.items():
            if mapped == "player" and row.get(h, "").strip():
                player_name = normalize_name(row[h].strip())
                break

        if not player_name:
            continue

        if player_name not in players:
            players[player_name] = {
                "games": 0,
                "wins": 0,
                "k_sum": 0, "d_sum": 0, "a_sum": 0,
                "damage_sum": 0,
                "kda_values": [],
                "cspm_values": [],
                "dpm_values": [],
                "team": "",
                "pos": "TOP",
            }

        p = players[player_name]
        p["games"] += 1

        # Win/Loss
        for h, mapped in col_map.items():
            if mapped == "result":
                result = row.get(h, "").strip()
                if result in ("1", "True", "true", "WIN", "win"):
                    p["wins"] += 1
                break

        # K, D, A
        for h, mapped in col_map.items():
            if mapped == "k":
                val = parse_value(row.get(h, ""))
                if val is not None:
                    p["k_sum"] += val
            elif mapped == "d":
                val = parse_value(row.get(h, ""))
                if val is not None:
                    p["d_sum"] += val
            elif mapped == "a":
                val = parse_value(row.get(h, ""))
                if val is not None:
                    p["a_sum"] += val
            elif mapped == "damage":
                val = parse_value(row.get(h, ""))
                if val is not None:
                    p["damage_sum"] += val

        # Team et Pos (prendre la première valeur)
        for h, mapped in col_map.items():
            if mapped == "team" and not p["team"]:
                p["team"] = row.get(h, "").strip()
            elif mapped == "pos" and not p["pos"]:
                p["pos"] = row.get(h, "").strip()

    # Calculer les moyennes
    result = {}
    for name, data in players.items():
        games = data["games"]
        if games == 0:
            continue

        row = {
            "Player": name,
            "Team": data["team"],
            "Pos": data["pos"],
            "Games": games,
            "K": round(data["k_sum"] / games, 1),
            "D": round(data["d_sum"] / games, 1),
            "A": round(data["a_sum"] / games, 1),
            "W%": round((data["wins"] / games) * 100, 1),
        }

        # KDA
        d = data["d_sum"] if data["d_sum"] > 0 else 1
        row["KDA"] = round((data["k_sum"] + data["a_sum"]) / d, 2)

        # DPM (approximatif si on a damage_sum)
        if data["damage_sum"] > 0:
            # Approximation : game moyenne = 30 min
            row["DPM"] = round(data["damage_sum"] / games / 30, 0)

        result[name] = row

    print(f"  📊 Oracle's: {len(result)} joueurs agrégés ({len(rows)} games)")
    return result


def parse_gol_csv(filepath: str) -> Dict[str, Dict[str, any]]:
    """
    Parse un CSV GOL.gg (stats moyennes par joueur).
    Retourne: {nom_joueur_normalisé: {champ: valeur}}
    """
    headers, rows = read_csv_file(filepath)

    # Mapper les colonnes vers les noms canoniques
    header_map = {}
    for h in headers:
        canon = find_canonical_name(h)
        if canon:
            header_map[h] = canon
        elif h.lower() in ("player", "playername", "name"):
            header_map[h] = "player"
        elif h.lower() in ("team", "teamname"):
            header_map[h] = "team"
        elif h.lower() in ("pos", "position", "role"):
            header_map[h] = "pos"
        elif h.lower() in ("games", "game"):
            header_map[h] = "games"

    result = {}
    for row in rows:
        # Trouver le nom
        player_name = None
        for h, mapped in header_map.items():
            if mapped == "player" and row.get(h, "").strip():
                player_name = normalize_name(row[h].strip())
                break

        if not player_name:
            continue

        player_data = {"Player": player_name}

        # Extraire les valeurs
        for h, mapped in header_map.items():
            if mapped in ("player", "team", "pos"):
                if mapped == "team":
                    player_data["Team"] = row.get(h, "").strip()
                elif mapped == "pos":
                    player_data["Pos"] = row.get(h, "").strip()
            elif mapped == "games":
                val = parse_int_value(row.get(h, ""))
                if val is not None:
                    player_data["Games"] = val
            else:
                # Champ canonique
                canon_name = CANONICAL_NAMES.get(mapped, mapped)
                val = parse_value(row.get(h, ""))
                if val is not None:
                    player_data[canon_name] = val

        result[player_name] = player_data

    print(f"  📊 GOL.gg: {len(result)} joueurs")
    return result


# ============================================================================
# MERGE
# ============================================================================

def merge_player(oracles_data: Dict, gol_data: Dict) -> Dict[str, any]:
    """Merge les données d'un joueur des deux sources."""
    merged = {
        "Player": gol_data.get("Player") or oracles_data.get("Player"),
        "Team": gol_data.get("Team") or oracles_data.get("Team", ""),
        "Pos": gol_data.get("Pos") or oracles_data.get("Pos", "TOP"),
        "Games": gol_data.get("Games") or oracles_data.get("Games", 0),
    }

    # Collecter tous les champs disponibles
    all_fields = set()
    for d in [oracles_data, gol_data]:
        for k in d.keys():
            if k not in ("Player", "Team", "Pos", "Games"):
                canon = find_canonical_name(k)
                if canon:
                    all_fields.add(canon)
                else:
                    all_fields.add(k.lower())

    conflicts = []

    for field in all_fields:
        canon = field if field in CANONICAL_NAMES else find_canonical_name(field)
        if not canon:
            continue

        canon_name = CANONICAL_NAMES.get(canon, canon)

        # Récupérer les valeurs des deux sources
        o_val = None
        g_val = None

        for k, v in oracles_data.items():
            if find_canonical_name(k) == canon and v is not None:
                o_val = v
                break

        for k, v in gol_data.items():
            if find_canonical_name(k) == canon and v is not None:
                g_val = v
                break

        if o_val is None and g_val is None:
            continue

        # Appliquer les règles de priorité
        if canon in GOL_EXCLUSIVE:
            merged[canon_name] = g_val if g_val is not None else o_val
        elif canon in GOL_PRIORITY:
            merged[canon_name] = g_val if g_val is not None else o_val
            if o_val is not None and g_val is not None and o_val != g_val:
                conflicts.append({
                    "field": canon_name,
                    "oracles": o_val,
                    "gol": g_val,
                    "chosen": g_val,
                    "reason": "GOL.gg prioritaire"
                })
        elif canon in ORACLES_PRIORITY:
            merged[canon_name] = o_val if o_val is not None else g_val
            if o_val is not None and g_val is not None and o_val != g_val:
                conflicts.append({
                    "field": canon_name,
                    "oracles": o_val,
                    "gol": g_val,
                    "chosen": o_val,
                    "reason": "Oracle's prioritaire"
                })
        elif canon in MAX_FIELDS:
            if o_val is not None and g_val is not None:
                merged[canon_name] = max(o_val, g_val)
                if o_val != g_val:
                    conflicts.append({
                        "field": canon_name,
                        "oracles": o_val,
                        "gol": g_val,
                        "chosen": max(o_val, g_val),
                        "reason": "Maximum des deux"
                    })
            else:
                merged[canon_name] = o_val if o_val is not None else g_val
        else:
            # Défaut : GOL.gg si dispo
            merged[canon_name] = g_val if g_val is not None else o_val

    return merged, conflicts


def merge_weighted_sr_po(sr_file: str, po_file: str) -> Dict[str, Dict]:
    """Merge Saison Régulière + Playoffs avec pondération par Games."""
    print(f"\n📁 Merge pondéré SR + PO")
    print(f"   SR: {sr_file}")
    print(f"   PO: {po_file}")

    sr_data = parse_gol_csv(sr_file) if "gol" in sr_file.lower() or "gold" in sr_file.lower() else parse_oracles_csv(sr_file)
    po_data = parse_gol_csv(po_file) if "gol" in po_file.lower() or "gold" in po_file.lower() else parse_oracles_csv(po_file)

    all_players = set(sr_data.keys()) | set(po_data.keys())
    result = {}

    for player in all_players:
        sr = sr_data.get(player, {})
        po = po_data.get(player, {})

        sr_games = sr.get("Games", 0) or 0
        po_games = po.get("Games", 0) or 0
        total_games = sr_games + po_games

        if total_games == 0:
            continue

        merged = {
            "Player": player,
            "Team": sr.get("Team") or po.get("Team", ""),
            "Pos": sr.get("Pos") or po.get("Pos", "TOP"),
            "Games": total_games,
        }

        # Pondérer les champs numériques
        numeric_fields = [
            "K", "D", "A", "KDA", "CSPM", "DPM", "EGPM",
            "GD10", "XPD10", "CSD10", "GD@15", "CSD@15", "XPD@15",
            "VSPM", "WPM", "CWPM", "WCPM", "VWPM",
            "Avg kills", "Avg deaths", "Avg assists",
            "Avg WPM", "Avg WCPM", "Avg VWPM",
            "CSM", "TDPG", "STL",
        ]

        for field in numeric_fields:
            sr_val = sr.get(field)
            po_val = po.get(field)

            if sr_val is not None or po_val is not None:
                sr_v = sr_val if sr_val is not None else 0
                po_v = po_val if po_val is not None else 0
                weighted = (sr_v * sr_games + po_v * po_games) / total_games
                merged[field] = round(weighted, 2)

        # Pourcentages : moyenne pondérée
        percent_fields = ["W%", "KP", "KS%", "DTH%", "FB%", "DMG%", "GOLD%", "VS%",
                         "CS%P15", "D%P15", "CTR%", "FB Victim"]

        for field in percent_fields:
            sr_val = sr.get(field)
            po_val = po.get(field)

            if sr_val is not None or po_val is not None:
                sr_v = sr_val if sr_val is not None else 0
                po_v = po_val if po_val is not None else 0
                weighted = (sr_v * sr_games + po_v * po_games) / total_games
                merged[field] = round(weighted, 1)

        # Compteurs : somme
        count_fields = ["Solo Kills", "Penta Kills"]
        for field in count_fields:
            sr_val = sr.get(field, 0) or 0
            po_val = po.get(field, 0) or 0
            if sr_val or po_val:
                merged[field] = sr_val + po_val

        result[player] = merged

    print(f"  ✅ {len(result)} joueurs après merge pondéré")
    return result


# ============================================================================
# GÉNÉRATION CSV
# ============================================================================

COLUMN_ORDER = [
    "Player", "Team", "Pos", "Games", "W%", "CTR%",
    "K", "D", "A", "KDA", "KP", "KS%", "DTH%",
    "FB%", "FB Victim", "GD10", "XPD10", "CSD10",
    "CSPM", "CS%P15", "DPM", "DMG%", "D%P15", "TDPG",
    "EGPM", "GOLD%", "STL",
    "WPM", "CWPM", "WCPM",
    "Avg kills", "Avg deaths", "Avg assists",
    "CSM", "VS%", "VSPM",
    "Avg WPM", "Avg WCPM", "Avg VWPM",
    "GD@15", "CSD@15", "XPD@15",
    "Penta Kills", "Solo Kills",
]


def generate_csv(players: Dict[str, Dict], output_file: str):
    """Génère le CSV final."""
    # Collecter toutes les colonnes présentes
    all_cols = set()
    for p in players.values():
        all_cols.update(p.keys())

    # Ordonner selon COLUMN_ORDER
    ordered = [c for c in COLUMN_ORDER if c in all_cols]
    remaining = sorted([c for c in all_cols if c not in COLUMN_ORDER and not c.startswith("_")])
    headers = ordered + remaining

    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers, extrasaction="ignore")
        writer.writeheader()

        for player_name in sorted(players.keys()):
            row = players[player_name]
            # S'assurer que tous les champs existent
            for h in headers:
                if h not in row:
                    row[h] = ""
            writer.writerow(row)

    print(f"\n💾 CSV généré: {output_file}")
    print(f"   Joueurs: {len(players)}")
    print(f"   Colonnes: {len(headers)}")


# ============================================================================
# MAIN
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Merge CSV Oracle's Elixir + GOL.gg",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples:
  # Merge simple Oracle's + GOL.gg
  python merge-csv.py --oracles lec_oracles.csv --gol lec_gol.csv -o lec_merged.csv

  # Merge SR + PO pondéré, puis avec GOL.gg
  python merge-csv.py --sr lec_sr.csv --po lec_po.csv --gol lec_gol.csv -o lec_final.csv

  # Juste merge SR + PO
  python merge-csv.py --sr lec_sr.csv --po lec_po.csv -o lec_combined.csv
        """
    )

    parser.add_argument("--oracles", "-o", help="Fichier CSV Oracle's Elixir")
    parser.add_argument("--gol", "-g", help="Fichier CSV GOL.gg")
    parser.add_argument("--sr", help="Fichier CSV Saison Régulière")
    parser.add_argument("--po", help="Fichier CSV Playoffs")
    parser.add_argument("--output", "-out", required=True, help="Fichier CSV de sortie")
    parser.add_argument("--min-games", type=int, default=3, help="Nombre minimum de games (défaut: 3)")

    args = parser.parse_args()

    print("=" * 60)
    print("🔄 Merge CSV — Oracle's Elixir + GOL.gg")
    print("=" * 60)

    oracles_data = {}
    gol_data = {}

    # Étape 1: Merge SR + PO si fournis
    if args.sr and args.po:
        oracles_data = merge_weighted_sr_po(args.sr, args.po)
    elif args.oracles:
        print(f"\n📁 Parsing Oracle's Elixir: {args.oracles}")
        oracles_data = parse_oracles_csv(args.oracles)

    # Étape 2: Parse GOL.gg
    if args.gol:
        print(f"\n📁 Parsing GOL.gg: {args.gol}")
        gol_data = parse_gol_csv(args.gol)

    # Étape 3: Merge les deux sources
    print(f"\n🔀 Merge des sources")
    all_players = set(oracles_data.keys()) | set(gol_data.keys())

    merged_players = {}
    total_conflicts = []

    for player in sorted(all_players):
        o = oracles_data.get(player, {})
        g = gol_data.get(player, {})

        # Vérifier min games
        games = max(o.get("Games", 0) or 0, g.get("Games", 0) or 0)
        if games < args.min_games:
            continue

        if o and g:
            merged, conflicts = merge_player(o, g)
            total_conflicts.extend(conflicts)
            merged_players[player] = merged
        elif o:
            merged_players[player] = o
        elif g:
            merged_players[player] = g

    print(f"  ✅ {len(merged_players)} joueurs après merge")

    # Afficher les conflits
    if total_conflicts:
        print(f"\n⚠️  Conflits résolus ({len(total_conflicts)}):")
        for c in total_conflicts[:10]:  # Limiter l'affichage
            print(f"     {c['field']}: Oracle's={c['oracles']:.2f} GOL={c['gol']:.2f} → {c['chosen']:.2f} ({c['reason']})")
        if len(total_conflicts) > 10:
            print(f"     ... et {len(total_conflicts) - 10} autres")

    # Générer le CSV
    generate_csv(merged_players, args.output)

    print("\n✅ Terminé!")


if __name__ == "__main__":
    main()
