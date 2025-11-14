import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HealthPage from "./page";

describe("HealthPage", () => {
  const originalFetch = globalThis.fetch;
  const payload = {
    status: "ok",
    timestamp: "2025-01-01T00:00:00.000Z",
    version: "1.0.0",
    env: "test",
  } as const;

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  test("renders stats from the backend", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    });
    globalThis.fetch = fetchMock as typeof fetch;

    const pageElement = await HealthPage();
    render(pageElement);

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/health"), {
      cache: "no-store",
    });
    expect(await screen.findByText("Status: Backend OK")).toBeInTheDocument();
    expect(screen.getByText("Version: 1.0.0")).toBeInTheDocument();
    expect(screen.getByText("Env: test")).toBeInTheDocument();
  });
});
