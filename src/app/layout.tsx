
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppSettings } from './api/settings/route';

async function getAppSettings(): Promise<AppSettings> {
  // This is a placeholder. In a real app, you'd fetch this from a service
  // or have it available during the build process.
  // For this example, we fetch it on every request, which is not optimal.
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:9002'}/api/settings`, { cache: 'no-store' });
    if (!res.ok) {
        throw new Error("Failed to fetch settings")
    }
    return res.json();
  } catch(e) {
    // Return default settings if fetch fails
    return {
        appName: "VoteChain",
        appDescription: "A secure and transparent voting system.",
        theme: {
            background: "220 17% 95%",
            foreground: "240 10% 3.9%",
            primary: "216 100% 74%",
            accent: "120 60% 45%",
        },
    }
  }
}


export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAppSettings();
  return {
    title: settings.appName,
    description: settings.appDescription,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getAppSettings();

  const themeStyle = {
    '--background-light': settings.theme.background,
    '--foreground-light': settings.theme.foreground,
    '--primary-light': settings.theme.primary,
    '--accent-light': settings.theme.accent,
    // For dark mode, you might have separate settings or derive them
    '--background-dark': '240 10% 3.9%',
    '--foreground-dark': '0 0% 98%',
    '--primary-dark': settings.theme.primary,
    '--accent-dark': settings.theme.accent,
  } as React.CSSProperties;

  return (
    <html lang="en" suppressHydrationWarning style={themeStyle}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
