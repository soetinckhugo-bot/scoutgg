import { z } from "zod";

export const PlayerCreateSchema = z.object({
  pseudo: z.string().min(1).max(100),
  realName: z.string().max(100).optional().nullable(),
  role: z.enum(["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"]),
  nationality: z.string().max(100).optional().nullable(),
  age: z.number().int().min(13).max(99).optional().nullable(),
  currentTeam: z.string().max(200).optional().nullable(),
  league: z.enum(["LEC", "LFL", "LFL_D2", "LVP", "Prime League", "ROL", "ERL Major", "ERL Minor", "ERL2", "Amateur"]),
  tier: z.enum(["S+", "S", "A+", "A", "B+", "B", "C"]).optional().nullable(),
  status: z.enum(["FREE_AGENT", "UNDER_CONTRACT", "ACADEMY", "SUB", "SCOUTING"]),
  opggUrl: z.string().url().optional().nullable(),
  golggUrl: z.string().url().optional().nullable(),
  lolprosUrl: z.string().url().optional().nullable(),
  leaguepediaUrl: z.string().url().optional().nullable(),
  twitterUrl: z.string().url().optional().nullable(),
  twitchUrl: z.string().url().optional().nullable(),
  riotId: z.string().max(100).optional().nullable(),
  photoUrl: z.string().max(500).optional().nullable(),
  bio: z.string().max(5000).optional().nullable(),
  isFeatured: z.boolean().optional(),
  contractEndDate: z.string().optional().nullable(),
});

export const PlayerUpdateSchema = z.object({
  pseudo: z.string().min(1).max(100).optional(),
  realName: z.string().max(100).optional().nullable(),
  role: z.enum(["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"]).optional(),
  nationality: z.string().min(1).max(100).optional(),
  age: z.number().int().min(13).max(99).optional().nullable(),
  currentTeam: z.string().max(200).optional().nullable(),
  league: z.enum(["LEC", "LFL", "LFL_D2", "LVP", "Prime League", "ROL", "ERL Major", "ERL Minor", "ERL2", "Amateur"]).optional(),
  tier: z.enum(["S+", "S", "A+", "A", "B+", "B", "C"]).optional().nullable(),
  status: z.enum(["FREE_AGENT", "UNDER_CONTRACT", "ACADEMY", "SUB", "SCOUTING"]).optional(),
  opggUrl: z.string().url().optional().nullable(),
  golggUrl: z.string().url().optional().nullable(),
  lolprosUrl: z.string().url().optional().nullable(),
  leaguepediaUrl: z.string().url().optional().nullable(),
  twitterUrl: z.string().url().optional().nullable(),
  twitchUrl: z.string().url().optional().nullable(),
  riotId: z.string().max(100).optional().nullable(),
  photoUrl: z.string().max(500).optional().nullable(),
  bio: z.string().max(5000).optional().nullable(),
  behaviorTags: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  contractEndDate: z.string().optional().nullable(),
}).strip();

export const ProStatsUpdateSchema = z.object({
  kda: z.number().optional().nullable(),
  csdAt15: z.number().optional().nullable(),
  gdAt15: z.number().optional().nullable(),
  xpdAt15: z.number().optional().nullable(),
  cspm: z.number().optional().nullable(),
  gpm: z.number().optional().nullable(),
  dpm: z.number().optional().nullable(),
  kpPercent: z.number().optional().nullable(),
  visionScore: z.number().optional().nullable(),
  wpm: z.number().optional().nullable(),
  wcpm: z.number().optional().nullable(),
  fbParticipation: z.number().optional().nullable(),
  fbVictim: z.number().optional().nullable(),
  deathsUnder15: z.number().optional().nullable(),
  damagePercent: z.number().optional().nullable(),
  goldPercent: z.number().optional().nullable(),
  soloKills: z.number().optional().nullable(),
  proximityJungle: z.number().optional().nullable(),
  championPool: z.string().optional().nullable(),
  poolSize: z.number().int().optional().nullable(),
  otpScore: z.number().optional().nullable(),
  winRateByChampion: z.string().optional().nullable(),
  gamesPlayed: z.number().int().optional().nullable(),
  season: z.string().optional().nullable(),
  split: z.string().optional().nullable(),
});

export const ReportCreateSchema = z.object({
  playerId: z.string().min(1),
  title: z.string().min(1).max(300),
  content: z.string().max(20000).optional(),
  strengths: z.string().max(2000).optional(),
  weaknesses: z.string().max(2000).optional(),
  verdict: z.enum(["Must Sign", "Monitor", "Pass"]),
  author: z.string().min(1).max(200),
  isPremium: z.boolean().optional(),
});

export const ReportUpdateSchema = z.object({
  playerId: z.string().min(1).optional(),
  title: z.string().min(1).max(300).optional(),
  content: z.string().max(20000).optional(),
  strengths: z.string().max(2000).optional(),
  weaknesses: z.string().max(2000).optional(),
  verdict: z.enum(["Must Sign", "Monitor", "Pass"]).optional(),
  author: z.string().min(1).max(200).optional(),
  isPremium: z.boolean().optional(),
});

export const FavoriteCreateSchema = z.object({
  playerId: z.string().min(1),
});

export const FavoriteUpdateSchema = z.object({
  playerId: z.string().min(1),
  notes: z.string().max(5000).optional().nullable(),
});

export const RiotSyncSchema = z.object({
  playerId: z.string().min(1),
});

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

