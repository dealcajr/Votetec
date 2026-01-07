
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppSettings } from './api/settings/route';
import { ThemeProvider } from '@/components/theme-provider';
import fs from 'fs/promises';
import path from 'path';

async function getAppSettings(): Promise<AppSettings> {
  try {
    const filePath = path.resolve(process.cwd(), 'public/settings.json');
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch(e) {
    // Return default settings if the file doesn't exist or there's an error
    return {
        appName: "VoteChain",
        appDescription: "A secure and transparent voting system.",
        theme: {
            background: "0 0% 100%",
            foreground: "240 10% 3.9%",
            primary: "216 100% 74%",
            accent: "120 60% 45%",
        },
        adminPasscode: "admin123",
        trustedFingerprintId: "VOTER-001",
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
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
