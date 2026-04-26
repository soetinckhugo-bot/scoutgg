/**
 * Structured logger for LeagueScout.
 * Replaces console.* calls with a consistent, filterable logging interface.
 * In production, errors are also sent to Sentry.
 */

import * as Sentry from "@sentry/nextjs";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

const isDev = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";
const isProd = process.env.NODE_ENV === "production";

function format(entry: LogEntry): string {
  const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${ctx}`;
}

function output(entry: LogEntry): void {
  if (isTest) return;

  const formatted = format(entry);

  switch (entry.level) {
    case "debug":
      if (isDev) console.debug(formatted);
      break;
    case "info":
      if (isDev) console.info(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  output({
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  });

  // Send errors to Sentry in production
  if (isProd && level === "error") {
    Sentry.captureMessage(message, {
      level: "error",
      extra: context,
    });
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => log("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => log("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => log("error", message, context),
};

