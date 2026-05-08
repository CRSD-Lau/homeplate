import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getThemePreference } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "HomePlate",
  title: {
    default: "HomePlate",
    template: "%s | HomePlate",
  },
  description: "Private household nutrition, body, and wellness tracker.",
  manifest: "/manifest.webmanifest",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  appleWebApp: {
    capable: true,
    title: "HomePlate",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0B1F3A" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1F3A" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getThemePreference();
  const darkClass = theme === "dark" ? "dark" : "";

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${geistSans.variable} ${geistMono.variable} h-full ${darkClass}`}
      suppressHydrationWarning
    >
      <body
        data-theme={theme}
        className={`flex min-h-full flex-col antialiased ${darkClass}`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(()=>{try{const m=document.cookie.match(/(?:^|; )homeplate_theme=([^;]+)/);const v=m?decodeURIComponent(m[1]):'light';const t=v==='dark'?'dark':'light';const d=t==='dark';document.documentElement.classList.toggle('dark',d);document.body?.classList.toggle('dark',d);document.documentElement.dataset.theme=t;document.body&&(document.body.dataset.theme=t);}catch{}})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
