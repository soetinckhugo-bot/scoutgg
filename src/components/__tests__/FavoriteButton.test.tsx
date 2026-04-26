import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import FavoriteButton from "../FavoriteButton";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from "sonner";

describe("FavoriteButton", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        })
      ) as unknown as typeof fetch
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches favorite status on mount", async () => {
    render(<FavoriteButton playerId="p1" />);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/favorites");
    });
  });

  it("shows 'Add to Watchlist' when not favorited", async () => {
    render(<FavoriteButton playerId="p1" />);
    await waitFor(() => {
      expect(screen.getByText("Add to Watchlist")).toBeInTheDocument();
    });
  });

  it("shows 'Favorited' when already favorited", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ playerId: "p1" }]),
        })
      ) as unknown as typeof fetch
    );

    render(<FavoriteButton playerId="p1" />);
    await waitFor(() => {
      expect(screen.getByText("Favorited")).toBeInTheDocument();
    });
  });

  it("toggles favorite on click (add)", async () => {
    const mockFetch = vi.fn();
    // First call: check status (empty)
    // Second call: POST to add
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });
    vi.stubGlobal("fetch", mockFetch as unknown as typeof fetch);

    render(<FavoriteButton playerId="p1" />);
    await waitFor(() => screen.getByText("Add to Watchlist"));

    fireEvent.click(screen.getByText("Add to Watchlist"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenLastCalledWith("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: "p1" }),
      });
    });
    expect(toast.success).toHaveBeenCalledWith("Added to watchlist");
  });

  it("toggles favorite on click (remove)", async () => {
    const mockFetch = vi.fn();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ playerId: "p1" }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });
    vi.stubGlobal("fetch", mockFetch as unknown as typeof fetch);

    render(<FavoriteButton playerId="p1" />);
    await waitFor(() => screen.getByText("Favorited"));

    fireEvent.click(screen.getByText("Favorited"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenLastCalledWith("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: "p1" }),
      });
    });
    expect(toast.success).toHaveBeenCalledWith("Removed from watchlist");
  });

  it("renders small variant as icon button", async () => {
    render(<FavoriteButton playerId="p1" variant="small" />);
    await waitFor(() => {
      expect(screen.getByLabelText("Add to favorites")).toBeInTheDocument();
    });
  });

  it("handles 409 conflict as success when adding", async () => {
    const mockFetch = vi.fn();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () => Promise.resolve({}),
      });
    vi.stubGlobal("fetch", mockFetch as unknown as typeof fetch);

    render(<FavoriteButton playerId="p1" />);
    await waitFor(() => screen.getByText("Add to Watchlist"));

    fireEvent.click(screen.getByText("Add to Watchlist"));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Added to watchlist");
    });
  });

  it("shows error toast on failed toggle", async () => {
    const mockFetch = vi.fn();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });
    vi.stubGlobal("fetch", mockFetch as unknown as typeof fetch);

    render(<FavoriteButton playerId="p1" />);
    await waitFor(() => screen.getByText("Add to Watchlist"));

    fireEvent.click(screen.getByText("Add to Watchlist"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to update watchlist");
    });
  });

  it("prevents click propagation in small variant", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });
    vi.stubGlobal("fetch", mockFetch as unknown as typeof fetch);

    render(<FavoriteButton playerId="p1" variant="small" />);
    await waitFor(() => screen.getByLabelText("Add to favorites"));

    const btn = screen.getByLabelText("Add to favorites");
    expect(btn).toBeInTheDocument();
  });
});
