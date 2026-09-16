import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "NAMAMI — Autonomous Marine Intelligence & Ocean Safety Network (SIH 2026)",
  description: "Agentic AI marine intelligence platform combining INCOIS PFZ, Ocean State Forecasts, IMD Warnings, ISRO Bhoonidhi, PostGIS Geofences, and BHASHINI Indian multilingual copilot.",
  keywords: ["NAMAMI", "INCOIS", "PFZ", "Marine Intelligence", "IMBL", "Indian Ocean", "SIH 2026", "Ocean Safety", "BHASHINI"],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#060e17" />
      </head>
      <body>{children}</body>
    </html>
  );
}
