'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Botão de toggle para Dark Mode
 * Persiste preferência no localStorage
 */
export function ThemeToggle() {
    const [isDark, setIsDark] = useState(false)
    const [mounted, setMounted] = useState(false)

    const updateThemeColor = (darkMode: boolean) => {
        const themeColor = darkMode ? '#09090b' : '#ffffff'
        const metaThemeColor = document.querySelector('meta[name="theme-color"]')
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', themeColor)
        } else {
            const meta = document.createElement('meta')
            meta.name = 'theme-color'
            meta.content = themeColor
            document.head.appendChild(meta)
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return
        const stored = localStorage.getItem('theme')
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const isDarkMode = stored === 'dark' || (!stored && prefersDark)

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsDark(isDarkMode)
        document.documentElement.classList.toggle('dark', isDarkMode)
        updateThemeColor(isDarkMode)
    }, [mounted])

    const toggleTheme = () => {
        const newIsDark = !isDark
        setIsDark(newIsDark)
        document.documentElement.classList.toggle('dark', newIsDark)
        localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
        updateThemeColor(newIsDark)
    }

    if (!mounted) return null

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
    )
}
