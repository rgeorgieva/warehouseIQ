import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { NavSidebar, MobileNavBar } from "@/components/nav-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatusPill } from "@/components/status-pill";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "warehouseIQ — Intelligent Warehouse Orchestrator",
  description:
    "Real-time inventory dashboard for GlobalLogistics Corp. with AI-powered operations specialist.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="relative flex min-h-screen flex-col bg-gradient-mesh md:flex-row">
            <NavSidebar />
            <div className="flex flex-1 flex-col">
              <MobileNavBar />
              <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/70 px-4 backdrop-blur-md md:px-8">
                <div>
                  <h1 className="text-sm font-medium text-muted-foreground">
                    GlobalLogistics Corp.
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill />
                  <ThemeToggle />
                </div>
              </header>
              <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
            </div>
          </div>
          <Toaster richColors position="top-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
