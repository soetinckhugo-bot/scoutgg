import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PlayerCard from "../PlayerCard";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [k: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock FavoriteButton to avoid fetch calls
vi.mock("../FavoriteButton", () => ({
  default: ({ playerId }: { playerId: string }) => (
    <button data-testid="favorite-btn" data-playerid={playerId}>
      ♥
    </button>
  ),
}));

const basePlayer = {
  id: "p1",
  pseudo: "Zeka",
  realName: "Kim Geon-woo",
  role: "MID",
  league: "LFL",
  status: "FREE_AGENT",
  currentTeam: null,
  photoUrl: null,
};

describe("PlayerCard", () => {
  it("renders player pseudo and role", () => {
    render(<PlayerCard player={basePlayer} />);
    expect(screen.getByText("Zeka")).toBeInTheDocument();
    expect(screen.getByText("MID")).toBeInTheDocument();
  });

  it("renders real name when available", () => {
    render(<PlayerCard player={basePlayer} />);
    expect(screen.getByText("Kim Geon-woo")).toBeInTheDocument();
  });

  it("renders initial avatar when no photoUrl", () => {
    render(<PlayerCard player={basePlayer} />);
    expect(screen.getByText("Z")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<PlayerCard player={basePlayer} />);
    expect(screen.getByText("FREE AGENT")).toBeInTheDocument();
  });

  it("renders league info", () => {
    render(<PlayerCard player={basePlayer} />);
    expect(screen.getByText("LFL")).toBeInTheDocument();
  });

  it("renders player info without soloq stats", () => {
    render(<PlayerCard player={basePlayer} />);
    expect(screen.getByText("Zeka")).toBeInTheDocument();
    expect(screen.queryByText("Rank")).not.toBeInTheDocument();
  });

  it("hides favorite button when showFavorite=false", () => {
    render(<PlayerCard player={basePlayer} showFavorite={false} />);
    expect(screen.queryByTestId("favorite-btn")).not.toBeInTheDocument();
  });

  it("shows favorite button by default", () => {
    render(<PlayerCard player={basePlayer} />);
    expect(screen.getByTestId("favorite-btn")).toBeInTheDocument();
  });

  it("renders compact variant", () => {
    render(<PlayerCard player={basePlayer} variant="compact" />);
    expect(screen.getByText("Zeka")).toBeInTheDocument();
    expect(screen.getByText("MID")).toBeInTheDocument();
    // Compact shows rank only, not full stats grid
    expect(screen.queryByText("LP")).not.toBeInTheDocument();
  });

  it("renders compare checkbox in compareMode", () => {
    const toggle = vi.fn();
    render(
      <PlayerCard
        player={basePlayer}
        compareMode
        isSelected={false}
        onToggleCompare={toggle}
      />
    );
    expect(screen.getByLabelText("Compare")).toBeInTheDocument();
  });

  it("renders current team when available", () => {
    const withTeam = { ...basePlayer, currentTeam: "Team Vitality" };
    render(<PlayerCard player={withTeam} />);
    expect(screen.getByText(/Team Vitality/)).toBeInTheDocument();
  });

  it("links to player detail page", () => {
    render(<PlayerCard player={basePlayer} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/players/p1");
  });
});
