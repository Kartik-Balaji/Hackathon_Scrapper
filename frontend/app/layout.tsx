import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/QueryProvider";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "Hackathon Globe Radar",
  description: "Discover hackathons worldwide. Built for hackers. Not corporations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
