import { ImageResponse } from "next/og";
import { db } from "@/lib/server/db";
import { getChampionIconUrl } from "@/lib/game-assets";

export const alt = "LeagueScout Clip of the Month";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function getInterBold() {
  const res = await fetch(
    "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2"
  );
  return res.arrayBuffer();
}

async function getInterRegular() {
  const res = await fetch(
    "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2"
  );
  return res.arrayBuffer();
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const clip = await db.clip.findUnique({
    where: { id },
    include: { votes: { select: { score: true } } },
  });

  if (!clip) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)",
            color: "#E9ECEF",
            fontSize: 48,
            fontFamily: "Inter",
          }}
        >
          Clip not found
        </div>
      ),
      { ...size }
    );
  }

  const totalVotes = clip.votes.length;
  const avgScore = totalVotes > 0
    ? clip.votes.reduce((sum, v) => sum + v.score, 0) / totalVotes
    : 0;
  const roundedScore = Math.round(avgScore * 10) / 10;

  const championUrl = clip.champion ? getChampionIconUrl(clip.champion) : null;

  const interBold = await getInterBold();
  const interRegular = await getInterRegular();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 60%, #0F3460 100%)",
          padding: 60,
          position: "relative",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#E94560",
          }}
        />

        {/* Title */}
        <div
          style={{
            color: "#E9ECEF",
            fontSize: 38,
            fontWeight: 700,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.2,
            marginBottom: 32,
            textWrap: "balance",
          }}
        >
          {clip.title}
        </div>

        {/* Champion icon */}
        {championUrl && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 200,
              height: 200,
              borderRadius: 24,
              background: "rgba(233, 69, 96, 0.08)",
              border: "2px solid rgba(233, 69, 96, 0.25)",
              marginBottom: 28,
            }}
          >
            <img
              src={championUrl}
              alt={clip.champion || ""}
              width={160}
              height={160}
              style={{
                borderRadius: 16,
                objectFit: "contain",
              }}
            />
          </div>
        )}

        {/* Player info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              background: "rgba(15, 52, 96, 0.6)",
              color: "#A0AEC0",
              fontSize: 18,
              fontWeight: 600,
              padding: "8px 18px",
              borderRadius: 999,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {clip.playerRole}
          </div>
          <div
            style={{
              color: "#E9ECEF",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            {clip.playerName}
          </div>
        </div>

        {/* Rating */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                width={28}
                height={28}
                viewBox="0 0 24 24"
                fill={star <= Math.round(avgScore) ? "#FFC107" : "#2A2D3A"}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <div
            style={{
              color: "#FFC107",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {roundedScore}/5
          </div>
          <div
            style={{
              color: "#6C757D",
              fontSize: 18,
            }}
          >
            · {totalVotes} votes
          </div>
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            right: 48,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          <div
            style={{
              color: "#E94560",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            LeagueScout
          </div>
          <div
            style={{
              color: "#6C757D",
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Clip of the Month
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: interBold,
          weight: 700,
          style: "normal",
        },
        {
          name: "Inter",
          data: interRegular,
          weight: 400,
          style: "normal",
        },
      ],
    }
  );
}
