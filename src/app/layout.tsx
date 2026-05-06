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
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#256f5b",
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
        {children}
      </body>
    </html>
  );
}
