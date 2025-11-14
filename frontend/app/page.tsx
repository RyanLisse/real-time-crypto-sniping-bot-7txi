import Link from "next/link";

export default function HomePage() {
  return (
    <main className="health-card">
      <h1>Crypto Sniper Bot</h1>
      <p>Encore backend health is a single call away.</p>
      <Link href="/health" className="health-link">
        Open /health
      </Link>
    </main>
  );
}
