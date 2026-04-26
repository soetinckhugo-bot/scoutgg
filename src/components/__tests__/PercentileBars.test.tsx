import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PercentileBars from "@/components/PercentileBars";

describe("PercentileBars", () => {
  const mockPercentiles = {
    KDA: { percentile: 92, rank: 2, total: 25, tier: "S" as const, color: "#00D9C0" },
    KP: { percentile: 78, rank: 6, total: 25, tier: "A" as const, color: "#00E676" },
    CSPM: { percentile: 65, rank: 9, total: 25, tier: "B" as const, color: "#FFD93D" },
    DTH: { percentile: 45, rank: 14, total: 25, tier: "D" as const, color: "#FF6B6B" },
  };

  it("renders title when provided", () => {
    render(<PercentileBars percentiles={mockPercentiles} title="Test Analysis" />);
    expect(screen.getByText("Test Analysis")).toBeInTheDocument();
  });

  it("renders percentile bars for each metric", () => {
    render(<PercentileBars percentiles={mockPercentiles} />);

    // Should show tier badges
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
  });

  it("shows percentile values", () => {
    render(<PercentileBars percentiles={mockPercentiles} />);

    expect(screen.getByText("92th")).toBeInTheDocument();
    expect(screen.getByText("78th")).toBeInTheDocument();
  });

  it("shows rank info", () => {
    render(<PercentileBars percentiles={mockPercentiles} />);

    expect(screen.getByText("2/25")).toBeInTheDocument();
    expect(screen.getByText("6/25")).toBeInTheDocument();
  });

  it("limits items when maxItems is set", () => {
    render(<PercentileBars percentiles={mockPercentiles} maxItems={2} />);

    // Should only show top 2 by percentile (92th and 78th)
    const bars = screen.getAllByText(/\d+th/);
    expect(bars.length).toBe(2);
  });

  it("shows empty state when showEmpty is true and no data", () => {
    render(<PercentileBars percentiles={{}} showEmpty />);
    expect(screen.getByText("No percentile data available.")).toBeInTheDocument();
  });

  it("returns null when no data and showEmpty is false", () => {
    const { container } = render(<PercentileBars percentiles={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it("sorts by percentile descending", () => {
    render(<PercentileBars percentiles={mockPercentiles} />);

    const percentileTexts = screen.getAllByText(/th/);
    // First should be highest (92)
    expect(percentileTexts[0].textContent).toBe("92th");
  });
});
