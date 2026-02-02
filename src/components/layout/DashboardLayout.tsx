'use client'

import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { MobileNav } from '@/components/layout/MobileNav'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Calendar, FileText, User, LogOut } from 'lucide-react'
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

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header Mobile (Logo + ThemeToggle only) */}
            <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur-md px-4 lg:hidden">
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
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                </div>
            </header>

            {/* Sidebar (Desktop Only via lg:translate-x-0 and hidden on smaller screens by default logic, but we need to strictly hide/show) */}
            <aside
                className="fixed left-0 top-0 z-50 hidden h-full w-64 border-r bg-sidebar transition-transform lg:block"
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
                <div className="absolute bottom-0 left-0 right-0 border-t p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-sm font-medium text-muted-foreground">Tema</span>
                        <ThemeToggle />
                    </div>
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
            {/* Added pb-20 for mobile nav spacing */}
            <main className="lg:pl-64">
                <div className="min-h-screen p-4 pb-24 lg:p-8 lg:pb-8">{children}</div>
            </main>

            {/* Mobile Navigation (Bottom Bar) */}
            <MobileNav />
        </div>
    )
}

