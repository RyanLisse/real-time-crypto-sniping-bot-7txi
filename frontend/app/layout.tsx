import type { ReactNode } from "react";
import "../app/globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "MEXC Sniper Bot",
  description: "Monitor new MEXC listings in near real-time",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="app-body">
        <Providers>
          <div className="app-shell">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
