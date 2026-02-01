'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Calendar, FileText, User, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

/**
 * Links de navegação do dashboard
 */
const navLinks = [
    { href: '/', label: 'Escalas', icon: Calendar },
    { href: '/relatorios', label: 'Relatórios', icon: FileText },
    { href: '/perfil', label: 'Perfil', icon: User },
]

/**
 * Props do DashboardLayout
 */
interface DashboardLayoutProps {
    children: React.ReactNode
}

/**
 * Layout principal do dashboard com sidebar responsiva
 * Inclui navegação, logo e controle de sessão
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header Mobile */}
            <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
                <div className="flex items-center gap-2">
                    <Image
                        src="/gsv-logo.png"
                        alt="GSV"
                        width={32}
                        height={32}
                        className="object-contain"
                    />
                    <span className="text-xl font-bold text-primary">GSV</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-50 h-full w-64 transform bg-sidebar border-r transition-transform duration-300 lg:translate-x-0',
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Logo */}
                <div className="flex h-16 items-center gap-3 border-b px-6">
                    <Image
                        src="/gsv-logo.png"
                        alt="GSV Logo"
                        width={56}
                        height={48}
                        className="object-contain"
                    />
                    <div>
                        <h1 className="text-lg font-bold text-primary">GSV Calendar</h1>
                        <p className="text-xs text-muted-foreground">CBMDF</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-1 p-4">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href ||
                            (link.href !== '/' && pathname.startsWith(link.href))
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                            >
                                <link.icon className="h-5 w-5" />
                                {link.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout */}
                <div className="absolute bottom-0 left-0 right-0 border-t p-4">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-5 w-5" />
                        Sair
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:pl-64">
                <div className="min-h-screen p-4 lg:p-8">{children}</div>
            </main>
        </div>
    )
}
