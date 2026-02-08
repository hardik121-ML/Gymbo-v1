import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import { PWAInstall } from "@/components/PWAInstall";

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Gymbo - Personal Trainer Assistant",
  description: "Track client classes, payments, and balances for personal trainers",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gymbo",
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2d2d2d",
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
              (function() {
                try {
                  var path = window.location.pathname;
                  if (path === '/login' || path === '/signup') {
                    document.documentElement.classList.add('theme-orange');
                  } else {
                    var theme = localStorage.getItem('gymbo-theme') || 'dark';
                    if (theme === 'dark') document.documentElement.classList.add('dark');
                  }
                } catch(e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${spaceMono.variable} antialiased`}>
        <PWAInstall />
        {children}
      </body>
    </html>
  );
}
