import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { WebSocketProvider } from "@/providers/websocket-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Header } from "@/components/layout/header";
import { ErrorBoundary } from "@/components/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskFlow - Real-time Collaborative Task Management",
  description: "A production-ready, enterprise-grade task management system with real-time collaboration features.",
  keywords: "task management, collaboration, real-time, productivity, enterprise",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/logo-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
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
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  const root = document.documentElement;
                  
                  // Determine theme: use stored value if valid, otherwise default to light
                  let shouldBeDark = false;
                  if (stored === 'dark') {
                    shouldBeDark = true;
                  } else if (stored === 'light') {
                    shouldBeDark = false;
                  } else if (stored === 'system') {
                    shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  } else {
                    // Default to light if no valid theme stored
                    shouldBeDark = false;
                  }
                  
                  // CRITICAL: Forcefully remove dark class FIRST
                  root.classList.remove('dark');
                  root.classList.remove('light');
                  
                  // Force a synchronous reflow to ensure browser processes the removal
                  void root.offsetHeight;
                  
                  // Apply the correct theme
                  if (shouldBeDark) {
                    root.classList.add('dark');
                  } else {
                    // Explicitly ensure dark is removed for light theme - CRITICAL
                    root.classList.remove('dark');
                    void root.offsetHeight;
                    root.classList.remove('dark');
                  }
                  
                  // Double-check after a brief delay to ensure light theme is applied
                  setTimeout(function() {
                    if (!shouldBeDark && root.classList.contains('dark')) {
                      root.classList.remove('dark');
                    }
                  }, 0);
                  
                  // Additional check after a longer delay
                  setTimeout(function() {
                    if (!shouldBeDark && root.classList.contains('dark')) {
                      root.classList.remove('dark');
                    }
                  }, 50);
                } catch (e) {
                  // Fallback: ensure light theme on error
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                <WebSocketProvider>
                  <Header />
                  <main>{children}</main>
                </WebSocketProvider>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
