import type { Metadata } from 'next'
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
