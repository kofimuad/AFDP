import type { Metadata } from "next";
import { AtSign, Globe, MessageCircle } from "lucide-react";
import { Fraunces, Inter } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "next-themes";
import "mapbox-gl/dist/mapbox-gl.css";

import "./globals.css";

import { Logo } from "@/components/ui/Logo";
import { NavBar } from "@/components/ui/NavBar";
import { ToastContainer } from "@/components/ui/Toast";

import { Providers } from "./providers";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display"
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "AFDP",
  description: "African Food Discovery Platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Providers>
            <NavBar />
            <main>{children}</main>
            <ToastContainer />

            <footer className="border-t border-white/10 bg-[#0F0E0D] px-4 py-10 text-white">
              <div className="mx-auto w-full max-w-7xl">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                  <section>
                    <Logo variant="light" />
                    <p className="mt-4 max-w-[200px] text-sm text-white/60">
                      Connecting African diaspora communities with the flavors of home.
                    </p>
                  </section>

                  <section>
                    <p className="mb-4 text-xs uppercase tracking-widest text-white/40">Discover</p>
                    <div className="space-y-2 text-sm">
                      <Link href="/search" className="block text-white/70 transition hover:text-white">
                        Search Dishes
                      </Link>
                      <Link href={{ pathname: "/search", query: { type: "restaurant" } }} className="block text-white/70 transition hover:text-white">
                        Browse Restaurants
                      </Link>
                      <Link href={{ pathname: "/search", query: { type: "grocery_store" } }} className="block text-white/70 transition hover:text-white">
                        Find Grocery Stores
                      </Link>
                      <Link href="/foods" className="block text-white/70 transition hover:text-white">
                        Popular Foods
                      </Link>
                    </div>
                  </section>

                  <section>
                    <p className="mb-4 text-xs uppercase tracking-widest text-white/40">For Businesses</p>
                    <div className="space-y-2 text-sm">
                      <Link href="/vendors/register" className="block text-white/70 transition hover:text-white">
                        List Your Restaurant
                      </Link>
                      <Link href="/vendors/register" className="block text-white/70 transition hover:text-white">
                        List Your Store
                      </Link>
                      <Link href="/dashboard" className="block text-white/70 transition hover:text-white">
                        Vendor Dashboard
                      </Link>
                      <Link href="/advertise" className="block text-white/70 transition hover:text-white">
                        Advertise
                      </Link>
                    </div>
                  </section>

                  <section>
                    <p className="mb-4 text-xs uppercase tracking-widest text-white/40">Connect</p>
                    <p className="mb-4 text-sm text-white/50">Built for the African diaspora community.</p>
                    <a href="mailto:hello@afdp.io" className="text-[#C8522A] transition hover:text-[#A8401E]">
                      hello@afdp.io
                    </a>
                    <div className="mt-4 flex items-center gap-2">
                      {[Globe, MessageCircle, AtSign].map((Icon, index) => (
                        <button
                          key={index}
                          type="button"
                          className="rounded-[var(--radius-md)] p-2 text-white/60 transition hover:text-white"
                          aria-label="Social link"
                        >
                          <Icon size={16} />
                        </button>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="mt-8 border-t border-white/10 pt-6 text-xs text-white/30 md:flex md:items-center md:justify-between">
                  <p>© 2025 AFDP. All rights reserved.</p>
                  <p className="mt-2 md:mt-0">Privacy Policy · Terms of Service</p>
                </div>
              </div>
            </footer>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}