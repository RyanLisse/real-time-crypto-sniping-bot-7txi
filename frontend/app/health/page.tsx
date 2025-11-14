const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type HealthResponse = {
  status: "ok";
  timestamp: string;
  version: string;
  env: string;
};

async function fetchHealth(): Promise<HealthResponse> {
  const url = `${API_BASE_URL}/health`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to reach the backend health endpoint");
  }
  return response.json();
}

export default async function HealthPage() {
  let health: HealthResponse | null = null;
  let errorMessage: string | null = null;

  try {
    health = await fetchHealth();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";
  }

  const statusLabel = health?.status === "ok" ? "Backend OK" : health?.status ?? "Unknown";
  const timestampLabel = health
    ? new Date(health.timestamp).toLocaleString()
    : "Unavailable";

  return (
    <main className="health-card">
      <h1>Sniper Bot Health</h1>
      {errorMessage ? (
        <p>{errorMessage}</p>
      ) : (
        <>
          <p>Status: {statusLabel}</p>
          <div className="health-meta">
            <span>Version: {health?.version}</span>
            <span>Env: {health?.env}</span>
          </div>
          <p className="text-muted">Timestamp: {timestampLabel}</p>
        </>
      )}
    </main>
  );
}
