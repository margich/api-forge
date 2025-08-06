import type { Metadata } from 'next';
import { Geist_Mono, Inter } from 'next/font/google';
import { Layout } from '../components/Layout';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
  preload: true,
  weight: ['400', '500', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  fallback: [
    'ui-monospace',
    'Cascadia Code',
    'Source Code Pro',
    'Menlo',
    'Monaco',
    'Consolas',
    'Courier New',
    'monospace',
  ],
});

export const metadata: Metadata = {
  title: 'API Generator - Transform Ideas into APIs',
  description:
    'Generate production-ready APIs from natural language descriptions',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
