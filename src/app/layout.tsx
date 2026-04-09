import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Belsuite — AI-Powered Content & Marketing Suite",
    template: "%s | Belsuite",
  },
  description:
    "Create, automate, and scale your content and marketing with AI — all in one platform. AI video, content generation, auto-posting, ad engine, UGC creator & advanced analytics.",
  keywords: [
    "AI content creation",
    "marketing automation",
    "content scheduling",
    "AI video editor",
    "social media automation",
    "UGC creator",
    "AI ad generator",
    "content marketing platform",
    "Belsuite",
  ],
  authors: [{ name: "Belsuite AI Inc." }],
  creator: "Belsuite AI Inc.",
  publisher: "Belsuite AI Inc.",
  metadataBase: new URL("https://belsuite.ai"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://belsuite.ai",
    siteName: "Belsuite",
    title: "Belsuite — AI-Powered Content & Marketing Suite",
    description:
      "Create, automate, and scale your content and marketing with AI — all in one platform. Join 10,000+ creators and brands dominating their niche.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Belsuite — AI-Powered Content & Marketing Suite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Belsuite — AI-Powered Content & Marketing Suite",
    description:
      "Create, automate, and scale your content and marketing with AI — all in one platform.",
    images: ["/og-image.png"],
    creator: "@belsuite",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0D0D0D" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('belsuite-theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || (!stored && prefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
