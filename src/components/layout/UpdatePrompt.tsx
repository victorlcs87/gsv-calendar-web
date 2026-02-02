'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function UpdatePrompt() {
    const [lastVersion, setLastVersion] = useState<string | null>(null)

    useEffect(() => {
        // Função para checar versão
        const checkVersion = async () => {
            try {
                // Adiciona timestamp para evitar cache
                const res = await fetch(`/api/version?t=${Date.now()}`)
                const data = await res.json()
                const currentVersion = data.version

                if (currentVersion === 'dev') return

                if (lastVersion && lastVersion !== currentVersion) {
                    // Nova versão detectada!
                    toast.info('Nova atualização disponível!', {
                        description: 'O aplicativo foi atualizado. Recarregue para aplicar.',
                        action: <Button size="sm" onClick={() => window.location.reload()}>Atualizar</Button>,
                        duration: Infinity, // Fica visível até clicar
                        id: 'update-toast' // Evita duplicatas
                    })
                }

                setLastVersion(currentVersion)
            } catch (error) {
                console.error('Falha ao verificar atualizações', error)
            }
        }

        // Checar ao montar
        checkVersion()

        // Checar quando a janela ganhar foco (balternar abas/apps)
        const onFocus = () => checkVersion()
        window.addEventListener('focus', onFocus)

        // Checar periodicamente a cada 5 minutos
        const interval = setInterval(checkVersion, 5 * 60 * 1000)

        return () => {
            window.removeEventListener('focus', onFocus)
            clearInterval(interval)
        }
    }, [lastVersion])

    return null
}
