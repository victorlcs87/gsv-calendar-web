'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileNav() {
    const pathname = usePathname()

    const navLinks = [
        { href: '/', label: 'Escalas', icon: Calendar },
        { href: '/relatorios', label: 'Relatórios', icon: FileText },
        { href: '/perfil', label: 'Perfil', icon: User },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg lg:hidden pb-[env(safe-area-inset-bottom)]">
            <nav className="flex items-center justify-around h-16 px-2">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href ||
                        (link.href !== '/' && pathname.startsWith(link.href))

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <link.icon className={cn("h-6 w-6", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{link.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
