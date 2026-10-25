import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Pacifico } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { SwRegister } from "@/components/sw-register";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const pacifico = Pacifico({ subsets: ["latin"], weight: "400", variable: "--font-pacifico" });

export const metadata: Metadata = {
  title: "RecipeHub — Cook smarter. Eat better",
  description:
    "Video-first recipe discovery: step-synced cooking videos from YouTube, Shorts, TikTok, Instagram Reels and Facebook, a pantry matcher, hands-free cooking mode and more.",
  manifest: "/manifest.webmanifest",
  applicationName: "RecipeHub",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "RecipeHub" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF9F6" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable} ${pacifico.variable}`}>
      <body className="font-sans">
        {/* Apply persisted theme before paint to avoid flashes */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("rh-theme");if(t){var v=JSON.parse(t);if(v&&v.state&&v.state.theme==="dark")document.documentElement.classList.add("dark");}else if(window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.classList.add("dark");}}catch(e){}})();`,
          }}
        />
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 md:pb-12 md:pt-6">{children}</main>
          <BottomNav />
          <SwRegister />
        </Providers>
      </body>
    </html>
  );
}
