import './globals.css';
import { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/ThemeProvider';

export const viewport: Viewport = {
  themeColor: '#0b0b0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'SyncVerse | Listen Together',
  description: 'A modern, premium listen together platform.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SyncVerse',
  },
  icons: {
    icon: '/logos/logo-icon.png',
    apple: '/logos/logo-icon.png',
  },
};

import { GlobalLoading } from '@/components/GlobalLoading';
import { UserHydrator } from '@/components/UserHydrator';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body suppressHydrationWarning className="bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white min-h-screen font-sans antialiased selection:bg-purple-500/30 transition-colors duration-500">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          storageKey="syncverse-theme"
          disableTransitionOnChange={false}
        >
          {/* Animated Background Mesh */}
          <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            {/* Dark Mode Orbs */}
            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-purple-600/20 dark:bg-purple-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-30 animate-blob"></div>
            <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 dark:bg-blue-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] rounded-full bg-pink-500/20 dark:bg-pink-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-30 animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative z-0 flex flex-col min-h-screen">
            <GlobalLoading />
            <UserHydrator />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
