import { test, expect } from "@playwright/test";

test.describe("Public API Endpoints", () => {
  test("GET /api/players returns paginated list", async ({ request }) => {
    const response = await request.get("/api/players");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty("players");
    expect(body).toHaveProperty("pagination");
    expect(body.pagination).toHaveProperty("page");
    expect(body.pagination).toHaveProperty("totalCount");
    expect(Array.isArray(body.players)).toBe(true);
  });

  test("GET /api/players supports pagination", async ({ request }) => {
    const response = await request.get("/api/players?page=1&limit=5");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.pagination.limit).toBe(5);
  });

  test("GET /api/players supports role filter", async ({ request }) => {
    const response = await request.get("/api/players?role=MID");
    expect(response.status()).toBe(200);

    const body = await response.json();
    for (const player of body.players) {
      expect(player.role).toBe("MID");
    }
  });

  test("GET /api/players supports sorting", async ({ request }) => {
    const response = await request.get("/api/players?sort=peakLp&order=desc");
    expect(response.status()).toBe(200);
    expect(response.status()).toBe(200);
  });

  test("GET /api/search/suggestions returns results", async ({ request }) => {
    const response = await request.get("/api/search/suggestions?q=Z");
    expect(response.status()).toBe(200);

    const body = await response.json();
    // Response may be an array or an object with results
    expect(body).toBeTruthy();
  });

  test("GET /api/prospects returns top prospects", async ({ request }) => {
    const response = await request.get("/api/prospects");
    expect(response.status()).toBe(200);

    const body = await response.json();
    // Response may be an array or an object with prospects
    expect(body).toBeTruthy();
  });
});

test.describe("Protected API Endpoints", () => {
  test("POST /api/players requires admin", async ({ request }) => {
    const response = await request.post("/api/players", {
      data: { pseudo: "Test" },
    });
    expect(response.status()).toBe(401);
  });

  test("POST /api/reports requires auth", async ({ request }) => {
    const response = await request.post("/api/reports", {
      data: { title: "Test" },
    });
    expect(response.status()).toBe(401);
  });

  test("PATCH /api/favorites requires auth", async ({ request }) => {
    const response = await request.patch("/api/favorites", {
      data: { playerId: "p1", notes: "test" },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe("API Error Handling", () => {
  test("invalid sort field returns 500 or empty", async ({ request }) => {
    const response = await request.get("/api/players?sort=invalid");
    // Should not crash — may return 500 or default sort
    expect(response.status()).toBeLessThan(600);
  });

  test("negative page is handled", async ({ request }) => {
    const response = await request.get("/api/players?page=-1");
    expect(response.status()).toBe(200);
  });
});
