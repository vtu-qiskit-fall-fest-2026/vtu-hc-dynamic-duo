import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Q-Shield | Quantum Cryptography & DevSecOps Migration Platform",
  description:
    "Enterprise DevSecOps platform for post-quantum cryptographic migration, CBOM inventory parsing, and QKD telemetry monitoring.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
