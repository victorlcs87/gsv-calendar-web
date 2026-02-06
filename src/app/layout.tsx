import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
}

export const metadata: Metadata = {
  title: 'GSV Calendar - Gestão de Escalas CBMDF',
  description: 'Sistema de gestão de escalas de trabalho para bombeiros do CBMDF',
  keywords: ['CBMDF', 'escalas', 'bombeiros', 'gestão'],
  authors: [{ name: 'GSV Calendar' }],
  openGraph: {
    title: 'GSV Calendar',
    description: 'Gestão de escalas de trabalho CBMDF',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GSV Calendar',
  },
  icons: {
    icon: '/icon-512.png?v=7',
    apple: '/apple-touch-icon-v2.png?v=6',
  },
  manifest: '/manifest.json?v=2',
}

import { UpdatePrompt } from '@/components/layout/UpdatePrompt'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <UpdatePrompt />
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
