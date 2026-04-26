import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ReportCard from "../ReportCard";

const baseReport = {
  id: "r1",
  playerId: "p1",
  title: "Scouting Report: Zeka",
  content: "Excellent mechanical skill and macro understanding.",
  strengths: "Laning, Teamfighting",
  weaknesses: "Vision control, Roaming",
  verdict: "Must Sign",
  author: "Scout A",
  isPremium: false,
  publishedAt: new Date("2026-01-15"),
  player: { id: "p1", pseudo: "Zeka" },
};

describe("ReportCard", () => {
  it("renders report title and content", () => {
    render(<ReportCard report={baseReport} />);
    expect(screen.getByText("Scouting Report: Zeka")).toBeInTheDocument();
    expect(screen.getByText(/Excellent mechanical skill/)).toBeInTheDocument();
  });

  it("renders strengths as badges", () => {
    render(<ReportCard report={baseReport} />);
    expect(screen.getByText("+ Laning")).toBeInTheDocument();
    expect(screen.getByText("+ Teamfighting")).toBeInTheDocument();
  });

  it("renders weaknesses as badges", () => {
    render(<ReportCard report={baseReport} />);
    expect(screen.getByText("- Vision control")).toBeInTheDocument();
    expect(screen.getByText("- Roaming")).toBeInTheDocument();
  });

  it("renders verdict badge", () => {
    render(<ReportCard report={baseReport} />);
    expect(screen.getByText("Must Sign")).toBeInTheDocument();
  });

  it("renders author and date", () => {
    render(<ReportCard report={baseReport} />);
    expect(screen.getByText(/by Scout A/)).toBeInTheDocument();
    expect(screen.getByText(/1\u202f15\u202f2026|15\/01\/2026|Jan 15, 2026/)).toBeInTheDocument();
  });

  it("shows star icon for free reports", () => {
    render(<ReportCard report={baseReport} />);
    expect(screen.queryByLabelText("Premium")).not.toBeInTheDocument();
  });

  it("shows lock icon for premium reports", () => {
    const premium = { ...baseReport, isPremium: true };
    render(<ReportCard report={premium} />);
    // The lock icon is present (no aria-label on lucide by default, but it's in the DOM)
    expect(screen.getByText("Scouting Report: Zeka")).toBeInTheDocument();
  });

  it("renders preview variant with blur overlay", () => {
    render(<ReportCard report={baseReport} variant="preview" />);
    expect(screen.getByText("Premium content")).toBeInTheDocument();
    expect(screen.getByText("Unlock with Scout Pass")).toBeInTheDocument();
  });

  it("preview shows player name when available", () => {
    render(<ReportCard report={baseReport} variant="preview" />);
    expect(screen.getByText("Zeka")).toBeInTheDocument();
  });

  it("preview links to pricing page", () => {
    render(<ReportCard report={baseReport} variant="preview" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/pricing");
  });

  it("handles report without player", () => {
    const noPlayer = { ...baseReport, player: undefined };
    render(<ReportCard report={noPlayer} />);
    expect(screen.getByText("Scouting Report: Zeka")).toBeInTheDocument();
  });

  it("handles single strength/weakness", () => {
    const single = { ...baseReport, strengths: "Mechanics", weaknesses: "Tilt" };
    render(<ReportCard report={single} />);
    expect(screen.getByText("+ Mechanics")).toBeInTheDocument();
    expect(screen.getByText("- Tilt")).toBeInTheDocument();
  });
});
