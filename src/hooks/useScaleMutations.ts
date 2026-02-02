import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { ScaleInput } from '@/types'
import { addDays, format, parseISO } from 'date-fns'
import {
    listCalendars,
    createCalendar,
    insertEvent,
    updateEvent,
    deleteEvent,
    listEvents
} from '@/lib/googleCalendar'

/**
 * Hook para mutações de escalas (Create, Update, Delete)
 */
export function useScaleMutations(onSuccess?: () => void) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Helper para converter texto em riscado (Unicode strikethrough)
    const toStrikethrough = (text: string) => {
        return text.split('').map(char => char + '\u0336').join('')
    }

    // Helper para formatar data para Google Event
    const formatToGoogleEvent = (input: ScaleInput) => {
        const startIso = parseISO(`${input.data}T${input.horaInicio.toString().padStart(2, '0')}:00:00`)
        let endIso = parseISO(`${input.data}T${input.horaFim.toString().padStart(2, '0')}:00:00`)

        // Se hora fim <= hora inicio (ex: 8h as 8h = 24h, ou 20h as 8h), adicionar 1 dia
        if (input.horaFim <= input.horaInicio) {
            endIso = addDays(endIso, 1)
        }

        const operacaoMatch = input.observacoes?.match(/Operação: (.*?)(?:\n|$)/)
        const operacao = operacaoMatch ? operacaoMatch[1] : ''

        // Base Summary
        let summary = operacao ? `GSV - ${operacao}` : `GSV - ${input.local}`

        // Modificar título se inativo (RISCADO)
        if (input.ativa === false) {
            summary = toStrikethrough(summary)
        }

        let description = input.observacoes || ''
        if (input.ativa === false && input.motivo_inatividade) {
            description = `MOTIVO CANCELAMENTO: ${input.motivo_inatividade}\n\n${description}`
        }

        return {
            summary,
            description,
            start: { dateTime: format(startIso, "yyyy-MM-dd'T'HH:mm:ss"), timeZone: 'America/Sao_Paulo' },
            end: { dateTime: format(endIso, "yyyy-MM-dd'T'HH:mm:ss"), timeZone: 'America/Sao_Paulo' },
            location: input.local
        }
    }

    // Helper para obter/criar calendário
    const getCalendarId = async (accessToken: string) => {
        const calendars = await listCalendars(accessToken)
        const existingCalendar = calendars.find(c => c.summary === 'GSV Calendar')
        if (existingCalendar) return existingCalendar.id

        const newCalendar = await createCalendar(accessToken, 'GSV Calendar')
        return newCalendar.id
    }

    const createScale = async (input: ScaleInput) => {
        setIsSubmitting(true)
        try {
            const supabase = createClient()

            // Obter usuário atual
            const { data: { session }, error: authError } = await supabase.auth.getSession()
            if (authError || !session?.user) throw new Error('Usuário não autenticado')

            // --- Google Calendar Check (Duplicate Prevention) ---
            let isSynced = false
            const token = session.provider_token

            if (token) {
                try {
                    const calendarId = await getCalendarId(token)
                    const gEvent = formatToGoogleEvent(input)

                    const checkStart = parseISO(gEvent.start.dateTime || '')
                    const checkEnd = parseISO(gEvent.end.dateTime || '')

                    const events = await listEvents(token, calendarId, checkStart.toISOString(), checkEnd.toISOString())

                    const hasConflict = events.some(e => {
                        const sameTitle = e.summary === gEvent.summary
                        const eventStart = new Date(e.start.dateTime || e.start.date || '').getTime()
                        const inputStart = checkStart.getTime()
                        const sameTime = Math.abs(eventStart - inputStart) < 60000

                        return sameTitle && sameTime
                    })

                    if (hasConflict) {
                        toast.error('Já existe uma escala para este horário no Google Calendar!')
                        return false
                    }
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Unknown error'
                    console.warn('Erro na verificação do Google Calendar:', message)
                }
            }
            // ----------------------------------------------------

            // Mapear para snake_case
            const dbData = {
                user_id: session.user.id,
                data: input.data,
                tipo: input.tipo,
                local: input.local,
                hora_inicio: input.horaInicio,
                hora_fim: input.horaFim,
                observacoes: input.observacoes,
                ativa: input.ativa !== undefined ? input.ativa : true,
                motivo_inatividade: input.motivo_inatividade,
                sincronizado: false,
                calendar_event_id: null as string | null
            }

            const { data: insertedScale, error } = await supabase
                .from('scales')
                .insert(dbData)
                .select()
                .single()

            if (error) throw error

            // --- Google Calendar Create ---
            if (token && insertedScale) {
                try {
                    const calendarId = await getCalendarId(token)
                    const gEvent = formatToGoogleEvent(input)
                    const createdEvent = await insertEvent(token, calendarId, gEvent)

                    if (createdEvent.id) {
                        // Atualizar DB com o ID
                        await supabase
                            .from('scales')
                            .update({
                                sincronizado: true,
                                sync_status: 'synced',
                                calendar_event_id: createdEvent.id
                            })
                            .eq('id', insertedScale.id)

                        isSynced = true
                    }
                } catch (gError) {
                    console.error('Falha ao criar no Google Calendar pós-insert:', gError)
                    toast.warning('Escala criada, mas falha ao sincronizar com Google.')
                }
            }
            // -----------------------------

            if (isSynced) {
                toast.success('Escala criada e sincronizada com Google!')
            } else {
                toast.success('Escala criada com sucesso!')
            }

            onSuccess?.()
            return true
        } catch (error) {
            console.error('Erro ao criar escala:', error)
            toast.error('Erro ao criar escala')
            return false
        } finally {
            setIsSubmitting(false)
        }
    }

    const updateScale = async (id: string, input: Partial<ScaleInput>) => {
        setIsSubmitting(true)
        try {
            const supabase = createClient()
            const { data: { session }, error: authError } = await supabase.auth.getSession()
            if (authError || !session?.user) throw new Error('Usuário não autenticado')

            const token = session.provider_token

            // Buscar escala atual
            const { data: currentScale, error: fetchError } = await supabase
                .from('scales')
                .select('calendar_event_id, data, local, hora_inicio, hora_fim, observacoes, tipo, ativa, motivo_inatividade')
                .eq('id', id)
                .single()

            if (fetchError) throw fetchError

            // --- Google Calendar Consistency Check ---
            if (currentScale?.calendar_event_id && !token) {
                toast.error('Erro de Sincronização', {
                    description: 'Para editar uma escala sincronizada, você precisa estar conectado ao Google Calendar. Reconecte-se e tente novamente.'
                })
                return false
            }

            // Mapear apenas os campos definidos
            const dbData: Record<string, unknown> = {}
            if (input.data) dbData.data = input.data
            if (input.tipo) dbData.tipo = input.tipo
            if (input.local) dbData.local = input.local
            if (input.horaInicio !== undefined) dbData.hora_inicio = input.horaInicio
            if (input.horaFim !== undefined) dbData.hora_fim = input.horaFim
            if (input.observacoes !== undefined) dbData.observacoes = input.observacoes
            if (input.ativa !== undefined) dbData.ativa = input.ativa
            if (input.motivo_inatividade !== undefined) dbData.motivo_inatividade = input.motivo_inatividade

            // Atualizar Google Calendar se necessário
            let googleUpdateSuccess = true
            if (token && currentScale?.calendar_event_id) {
                try {
                    const calendarId = await getCalendarId(token)

                    const mergedInput: ScaleInput = {
                        data: input.data || currentScale.data,
                        tipo: input.tipo || currentScale.tipo,
                        local: input.local || currentScale.local,
                        horaInicio: input.horaInicio ?? currentScale.hora_inicio,
                        horaFim: input.horaFim ?? currentScale.hora_fim,
                        observacoes: input.observacoes !== undefined ? input.observacoes : currentScale.observacoes,
                        ativa: input.ativa !== undefined ? input.ativa : currentScale.ativa,
                        motivo_inatividade: input.motivo_inatividade !== undefined ? input.motivo_inatividade : currentScale.motivo_inatividade
                    }

                    const gEvent = formatToGoogleEvent(mergedInput)
                    await updateEvent(token, calendarId, currentScale.calendar_event_id, gEvent)
                } catch (gError) {
                    console.error('Erro ao atualizar no Google:', gError)
                    toast.error('Falha ao atualizar no Google Calendar. Operação cancelada para manter sincronia.')
                    googleUpdateSuccess = false
                    return false
                }
            }

            if (!googleUpdateSuccess) return false

            const { error } = await supabase
                .from('scales')
                .update(dbData)
                .eq('id', id)

            if (error) throw error

            if (currentScale?.calendar_event_id) {
                toast.success('Escala e Google Calendar atualizados!')
            } else {
                toast.success('Escala atualizada com sucesso!')
            }

            onSuccess?.()
            return true
        } catch (error) {
            console.error('Erro ao atualizar escala:', error)
            toast.error('Erro ao atualizar escala')
            return false
        } finally {
            setIsSubmitting(false)
        }
    }

    const deleteScale = async (id: string) => {
        setIsSubmitting(true)
        try {
            const supabase = createClient()
            const { data: { session }, error: authError } = await supabase.auth.getSession()
            if (authError || !session?.user) throw new Error('Usuário não autenticado')

            const token = session.provider_token

            // Buscar ID do evento ANTES de deletar
            const { data: scale } = await supabase
                .from('scales')
                .select('calendar_event_id')
                .eq('id', id)
                .single()

            // --- Google Calendar Consistency Check ---
            // Se está sincronizada, verificar token ANTES de deletar do banco
            if (scale?.calendar_event_id) {
                if (!token) {
                    toast.error('Erro de Autenticação', {
                        description: 'Para excluir uma escala sincronizada, você precisa estar conectado ao Google Calendar.'
                    })
                    return false
                }

                // Tentar deletar do Google Calendar PRIMEIRO
                try {
                    const calendarId = await getCalendarId(token)
                    await deleteEvent(token, calendarId, scale.calendar_event_id)
                } catch (gError: unknown) {
                    console.error('Erro ao deletar do Google:', gError)
                    const err = gError as { code?: number }
                    // 410 Gone ou 404 Not Found significa que já não existe, então podemos prosseguir
                    if (err?.code !== 404 && err?.code !== 410) {
                        toast.error('Falha ao remover do Google Calendar. A operação foi cancelada para evitar inconsistência.')
                        return false
                    }
                }
            }
            // -------------------------------------

            const { error } = await supabase
                .from('scales')
                .delete()
                .eq('id', id)

            if (error) throw error

            if (scale?.calendar_event_id) {
                toast.success('Escala removida do Sistema e do Google Calendar.')
            } else {
                toast.success('Escala removida com sucesso!')
            }

            onSuccess?.()
            return true
        } catch (error) {
            console.error('Erro ao deletar escala:', error)
            toast.error('Erro ao remover escala')
            return false
        } finally {
            setIsSubmitting(false)
        }
    }

    const deleteAllScales = async () => {
        // Implementação simplificada: Não sincroniza deleção em massa com Google por segurança e cota
        setIsSubmitting(true)
        try {
            const supabase = createClient()
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) throw new Error('Usuário não autenticado')

            const { error } = await supabase
                .from('scales')
                .delete()
                .eq('user_id', user.id)

            if (error) throw error

            toast.success('Todas as escalas foram removidas! (Google Calendar não afetado)')
            onSuccess?.()
            return true
        } catch (error) {
            console.error('Erro ao limpar escalas:', error)
            toast.error('Erro ao limpar escalas')
            return false
        } finally {
            setIsSubmitting(false)
        }
    }

    return {
        createScale,
        updateScale,
        deleteScale,
        deleteAllScales,
        isSubmitting
    }
}
