'use client'

import { useState, useEffect } from 'react'
import { addDays, format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Calendar, Loader2, RefreshCw } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'
import type { Scale } from '@/types'
import { listCalendars, createCalendar, insertEvent } from '@/lib/googleCalendar'

interface SyncButtonProps {
    scales: Scale[]
}

export function SyncButton({ scales }: SyncButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [calendarName, setCalendarName] = useState('GSV Calendar')

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        checkConnection()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const checkConnection = async () => {
        const { data: { session } } = await supabase.auth.getSession()

        // Verifica se há token de provedor (Login OAuth recente)
        if (session?.provider_token) {
            setIsConnected(true)
            return
        }

        // Verifica metadados ou identidades vinculadas
        const isGoogle = session?.user?.app_metadata?.provider === 'google' ||
            session?.user?.identities?.some((id) => id.provider === 'google')

        if (isGoogle) {
            setIsConnected(true)
        }
    }

    const handleConnect = async () => {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    scopes: 'https://www.googleapis.com/auth/calendar',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            })
            if (error) throw error
        } catch (error) {
            console.error(error)
            toast.error('Erro na conexão com Google')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSync = async () => {
        setIsLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.provider_token) {
                toast.error('Sessão expirada. Reconecte com o Google.')
                setIsConnected(false)
                return
            }

            const token = session.provider_token
            let targetCalendarId = ''

            // 1. Buscar calendários
            const calendars = await listCalendars(token)
            const existingCalendar = calendars.find(c => c.summary === calendarName)

            if (existingCalendar) {
                targetCalendarId = existingCalendar.id
            } else {
                // 2. Criar se não existir
                const newCalendar = await createCalendar(token, calendarName)
                targetCalendarId = newCalendar.id
                toast.success(`Calendário "${calendarName}" criado!`)
            }

            // 3. Sincronizar escalas (Filtrando apenas futuras ou não sincronizadas)
            // Para este teste, vamos pegar as próximas 5 escalas para não estourar cota ou demorar
            const scalesToSync = scales.slice(0, 5) // TODO: Melhorar filtro

            let syncedCount = 0

            for (const scale of scalesToSync) {
                // Formato de data para Google Event (ISO com Timezone ou Date puro)
                // Assumindo scale.data YYYY-MM-DD
                const startIso = parseISO(`${scale.data}T${scale.horaInicio.toString().padStart(2, '0')}:00:00`)
                let endIso = parseISO(`${scale.data}T${scale.horaFim.toString().padStart(2, '0')}:00:00`)

                // Se hora fim <= hora inicio (ex: 8h as 8h = 24h, ou 20h as 8h), adicionar 1 dia
                if (scale.horaFim <= scale.horaInicio) {
                    endIso = addDays(endIso, 1)
                }

                // Extrair Operação para o título (Subject)
                const operacaoMatch = scale.observacoes?.match(/Operação: (.*?)(?:\n|$)/)
                const operacao = operacaoMatch ? operacaoMatch[1] : ''
                const summary = operacao ? `GSV - ${operacao}` : `GSV - ${scale.local}`

                // Montar descrição com valores
                const valorBruto = scale.valorBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                const valorLiquido = scale.valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                const descriptionLines = [
                    `Valor Bruto: ${valorBruto}`,
                    `Valor Líquido: ${valorLiquido}`,
                    '',
                    scale.observacoes || ''
                ]
                const description = descriptionLines.join('\n').trim()

                await insertEvent(token, targetCalendarId, {
                    summary: summary,
                    description: description,
                    start: { dateTime: format(startIso, "yyyy-MM-dd'T'HH:mm:ss"), timeZone: 'America/Sao_Paulo' },
                    end: { dateTime: format(endIso, "yyyy-MM-dd'T'HH:mm:ss"), timeZone: 'America/Sao_Paulo' },
                    location: scale.local
                })
                syncedCount++
            }

            toast.success(`Sincronização concluída!`, {
                description: `${syncedCount} escalas enviadas para "${calendarName}".`
            })
            setDialogOpen(false)

        } catch (error) {
            console.error('Erro na sincronização:', error)
            toast.error('Falha ao sincronizar. Verifique o console.')
        } finally {
            setIsLoading(false)
        }
    }

    if (!isConnected) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={handleConnect}
                disabled={isLoading}
                className="gap-2"
            >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                Conectar Google
            </Button>
        )
    }

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Sincronizar
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Sincronizar com Google Calendar</DialogTitle>
                    <DialogDescription>
                        Envie suas escalas para sua agenda google.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="calendar-name" className="text-right">
                            Calendário
                        </Label>
                        <Input
                            id="calendar-name"
                            value={calendarName}
                            onChange={(e) => setCalendarName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                        Se o calendário não existir, ele será criado automaticamente.
                    </p>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSync} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sincronizando...
                            </>
                        ) : (
                            'Iniciar Sincronização'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
