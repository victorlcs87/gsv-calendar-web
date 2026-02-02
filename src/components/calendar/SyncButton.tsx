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

        // STRICT CHECK: Only consider connected if we have the actual Token needed for the API
        // Being "logged in" isn't enough if the OAuth token is missing or expired.
        // We need the provider_token to make calls to Google Calendar.
        if (session?.provider_token) {
            setIsConnected(true)
        } else {
            setIsConnected(false)
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

            // 1. Buscar/Criar calendário
            try {
                const calendars = await listCalendars(token)
                const existingCalendar = calendars.find(c => c.summary === calendarName)

                if (existingCalendar) {
                    targetCalendarId = existingCalendar.id
                } else {
                    const newCalendar = await createCalendar(token, calendarName)
                    targetCalendarId = newCalendar.id
                    toast.success(`Calendário "${calendarName}" criado!`)
                }
            } catch (error) {
                console.error('Erro ao acessar calendários:', error)
                toast.error('Falha ao acessar calendários do Google')
                return
            }

            // 2. Filtrar escalas não sincronizadas
            // Verificamos apenas as que NÃO têm calendar_event_id ou flag de sincronizado
            const scalesToSync = scales.filter(s => !s.calendar_event_id)

            if (scalesToSync.length === 0) {
                toast.info('Todas as escalas já parecem estar sincronizadas.')
                setDialogOpen(false)
                return
            }

            let syncedCount = 0
            let linkedCount = 0
            let errorCount = 0

            // Limitando lote para evitar rate limit
            const batch = scalesToSync.slice(0, 10)

            for (const scale of batch) {
                // Formato de data para Google Event
                const startIso = parseISO(`${scale.data}T${scale.horaInicio.toString().padStart(2, '0')}:00:00`)
                let endIso = parseISO(`${scale.data}T${scale.horaFim.toString().padStart(2, '0')}:00:00`)

                if (scale.horaFim <= scale.horaInicio) {
                    endIso = addDays(endIso, 1)
                }

                const operacaoMatch = scale.observacoes?.match(/Operação: (.*?)(?:\n|$)/)
                const operacao = operacaoMatch ? operacaoMatch[1] : ''
                const summary = operacao ? `GSV - ${operacao}` : `GSV - ${scale.local}`

                const valorBruto = scale.valorBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                const valorLiquido = scale.valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

                const description = [
                    `Valor Bruto: ${valorBruto}`,
                    `Valor Líquido: ${valorLiquido}`,
                    '',
                    scale.observacoes || ''
                ].join('\n').trim()

                const gEvent = {
                    summary: summary,
                    description: description,
                    start: { dateTime: format(startIso, "yyyy-MM-dd'T'HH:mm:ss"), timeZone: 'America/Sao_Paulo' },
                    end: { dateTime: format(endIso, "yyyy-MM-dd'T'HH:mm:ss"), timeZone: 'America/Sao_Paulo' },
                    location: scale.local
                }

                try {
                    const { listEvents } = await import('@/lib/googleCalendar')

                    // CORREÇÃO: Usar .toISOString() (UTC) para query, pois a API exige RFC3339
                    // A data original 'startIso' é um objeto Date gerado com fuso local do browser pelo parseISO
                    const events = await listEvents(token, targetCalendarId, startIso.toISOString(), endIso.toISOString())

                    const hasConflict = events.some(e => {
                        const sameTitle = e.summary === gEvent.summary
                        const eventStart = new Date(e.start.dateTime || e.start.date || '').getTime()
                        const inputStart = new Date(gEvent.start.dateTime).getTime()
                        const sameTime = Math.abs(eventStart - inputStart) < 60000
                        return sameTitle && sameTime
                    })

                    if (hasConflict) {
                        const existingEvent = events.find(e => {
                            const sameTitle = e.summary === gEvent.summary
                            const eventStart = new Date(e.start.dateTime || e.start.date || '').getTime()
                            const inputStart = new Date(gEvent.start.dateTime).getTime()
                            return sameTitle && Math.abs(eventStart - inputStart) < 60000
                        })

                        if (existingEvent && existingEvent.id) {
                            await supabase
                                .from('scales')
                                .update({
                                    sincronizado: true,
                                    sync_status: 'synced',
                                    calendar_event_id: existingEvent.id
                                })
                                .eq('id', scale.id)
                            linkedCount++
                        }
                        continue
                    }

                    const createdEvent = await insertEvent(token, targetCalendarId, gEvent)

                    if (createdEvent.id) {
                        await supabase
                            .from('scales')
                            .update({
                                sincronizado: true,
                                sync_status: 'synced',
                                calendar_event_id: createdEvent.id
                            })
                            .eq('id', scale.id)
                        syncedCount++
                    }

                } catch (err) {
                    console.error(`Falha ao sincronizar escala ${scale.id}:`, err)
                    errorCount++
                }
            }

            if (errorCount > 0) {
                toast.warning('Algumas escalas falharam.', {
                    description: `Novas: ${syncedCount}, Vinculadas: ${linkedCount}, Falhas: ${errorCount}`
                })
            } else if (syncedCount > 0 || linkedCount > 0) {
                toast.success('Sincronização concluída!', {
                    description: `Novas: ${syncedCount}, Vinculadas: ${linkedCount}`
                })
            } else {
                toast.info('Nenhuma alteração necessária.')
            }

            setDialogOpen(false)

        } catch (error) {
            console.error('Erro na sincronização:', error)
            toast.error('Falha ao sincronizar. Tente novamente.')
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
