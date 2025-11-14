import type { ReactNode } from "react";
import "../app/globals.css";

export const metadata = {
  title: "Crypto Sniper Bot",
  description: "Monitor the Encore API health status",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="app-body">
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
