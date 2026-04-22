import type { Metadata, Viewport } from 'next';
import { Geist, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { ServiceWorkerRegistrar } from '@/components/providers/sw-registrar';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans', preload: false });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'],
  preload: false,
});

export const metadata: Metadata = {
  title: 'Wheel of Fortune Platform',
  description: 'Customizable spin-to-win wheel campaigns for your business.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SpinPlatform',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#7C3AED',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${spaceGrotesk.variable} dark h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <ServiceWorkerRegistrar />
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
