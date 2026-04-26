import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("logger", () => {
  const consoleDebug = vi.spyOn(console, "debug").mockImplementation(() => {});
  const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});
  const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not output anything in test environment", async () => {
    // In test env, logger should be silent
    const { logger } = await import("../logger");
    logger.debug("test debug");
    logger.info("test info");
    logger.warn("test warn");
    logger.error("test error");

    expect(consoleDebug).not.toHaveBeenCalled();
    expect(consoleInfo).not.toHaveBeenCalled();
    expect(consoleWarn).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });
});

describe("logger in dev mode", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  it("outputs debug and info in development", async () => {
    const consoleDebug = vi.spyOn(console, "debug").mockImplementation(() => {});
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});

    const { logger } = await import("../logger");
    logger.debug("debug msg", { key: "value" });
    logger.info("info msg");

    expect(consoleDebug).toHaveBeenCalledOnce();
    expect(consoleInfo).toHaveBeenCalledOnce();

    const debugCall = consoleDebug.mock.calls[0][0] as string;
    expect(debugCall).toContain("[DEBUG]");
    expect(debugCall).toContain("debug msg");
    expect(debugCall).toContain('"key":"value"');
  });

  it("always outputs warn and error", async () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { logger } = await import("../logger");
    logger.warn("warn msg");
    logger.error("error msg", { code: 500 });

    expect(consoleWarn).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledOnce();

    const errorCall = consoleError.mock.calls[0][0] as string;
    expect(errorCall).toContain("[ERROR]");
    expect(errorCall).toContain("error msg");
    expect(errorCall).toContain('"code":500');
  });
});

describe("logger in production", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    process.env.NODE_ENV = "production";
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  it("only outputs warn and error in production", async () => {
    const consoleDebug = vi.spyOn(console, "debug").mockImplementation(() => {});
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const { logger } = await import("../logger");
    logger.debug("debug msg");
    logger.info("info msg");
    logger.warn("warn msg");
    logger.error("error msg");

    expect(consoleDebug).not.toHaveBeenCalled();
    expect(consoleInfo).not.toHaveBeenCalled();
    expect(consoleWarn).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledOnce();
  });
});
