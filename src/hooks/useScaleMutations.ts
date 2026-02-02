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
        const summary = operacao ? `GSV - ${operacao}` : `GSV - ${input.local}`

        const description = input.observacoes || ''

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
            let calendarEventId: string | undefined = undefined
            let isSynced = false
            const token = session.provider_token

            if (token) {
                try {
                    const calendarId = await getCalendarId(token)
                    const gEvent = formatToGoogleEvent(input)

                    // Verificar colisão
                    const events = await listEvents(token, calendarId, gEvent.start.dateTime, gEvent.end.dateTime)
                    // Filtro simples: se existe QUALQUER evento no mesmo horário exato criado pelo app (pode refinar checando título)
                    const hasConflict = events.some(e => {
                        // Comparação EXATA de data e hora (strings ISO completas) e título
                        // O Google retorna eventos que INTERSECTAM o range.
                        // Para duplicata exata, queremos saber se começa na mesma hora E tem mesmo nome.
                        const sameTitle = e.summary === gEvent.summary

                        // gEvent.start.dateTime tem formato YYYY-MM-DDTHH:mm:ss (ex: 2026-02-02T08:00:00)
                        // e.start.dateTime vindo da API pode ter offset (ex: 2026-02-02T08:00:00-03:00)
                        // Vamos comparar o timestamp para garantir
                        const eventStart = new Date(e.start.dateTime || e.start.date || '').getTime()
                        const inputStart = new Date(gEvent.start.dateTime).getTime()

                        // Tolerância de 1 minuto para diferenças de segundos
                        const sameTime = Math.abs(eventStart - inputStart) < 60000

                        return sameTitle && sameTime
                    })

                    if (hasConflict) {
                        // Lançar erro específico para ser tratado no frontend se necessário, 
                        // ou apenas retornar false aqui com toast
                        toast.error('Já existe uma escala similar no Google Calendar!')
                        return false // Interrompe criação
                    }
                } catch (err: any) {
                    // Erros de API não devem bloquear o uso do app (exceto se for crítico)
                    console.warn('Erro na verificação do Google Calendar:', err)
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
                sincronizado: false, // Atualizado depois
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

                        calendarEventId = createdEvent.id
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

            // Mapear apenas os campos definidos
            const dbData: Record<string, unknown> = {}
            if (input.data) dbData.data = input.data
            if (input.tipo) dbData.tipo = input.tipo
            if (input.local) dbData.local = input.local
            if (input.horaInicio !== undefined) dbData.hora_inicio = input.horaInicio
            if (input.horaFim !== undefined) dbData.hora_fim = input.horaFim
            if (input.observacoes !== undefined) dbData.observacoes = input.observacoes

            // Buscar escala atual para ver se tem ID do Google
            const { data: currentScale, error: fetchError } = await supabase
                .from('scales')
                .select('calendar_event_id, data, local, hora_inicio, hora_fim, observacoes, tipo')
                .eq('id', id)
                .single()

            if (fetchError) throw fetchError

            const { error } = await supabase
                .from('scales')
                .update(dbData)
                .eq('id', id)

            if (error) throw error

            // --- Google Calendar Sync (Update) ---
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.provider_token

            if (token && currentScale?.calendar_event_id) {
                try {
                    const calendarId = await getCalendarId(token)

                    // Merge dos dados novos com antigos para formar o input completo para o Google
                    // Precisamos garantir que temos todos os dados obrigatórios para formatToGoogleEvent
                    const mergedInput: ScaleInput = {
                        data: input.data || currentScale.data,
                        tipo: input.tipo || currentScale.tipo,
                        local: input.local || currentScale.local,
                        horaInicio: input.horaInicio ?? currentScale.hora_inicio,
                        horaFim: input.horaFim ?? currentScale.hora_fim,
                        observacoes: input.observacoes !== undefined ? input.observacoes : currentScale.observacoes
                    }

                    const gEvent = formatToGoogleEvent(mergedInput)

                    await updateEvent(token, calendarId, currentScale.calendar_event_id, gEvent)
                    toast.success('Escala atualizada no Google Calendar!')
                } catch (gError) {
                    console.error('Erro ao atualizar no Google:', gError)
                    toast.warning('Atualizada localmente, mas falha no Google Calendar.')
                }
            }
            // -------------------------------------

            toast.success('Escala atualizada com sucesso!')
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

            // Buscar ID do evento ANTES de deletar
            const { data: scale } = await supabase
                .from('scales')
                .select('calendar_event_id')
                .eq('id', id)
                .single()

            const { error } = await supabase
                .from('scales')
                .delete()
                .eq('id', id)

            if (error) throw error

            // --- Google Calendar Sync (Delete) ---
            if (scale?.calendar_event_id) {
                const { data: { session } } = await supabase.auth.getSession()
                const token = session?.provider_token

                if (token) {
                    try {
                        const calendarId = await getCalendarId(token)
                        await deleteEvent(token, calendarId, scale.calendar_event_id)
                        toast.success('Removida também do Google Calendar.')
                    } catch (gError) {
                        console.error('Erro ao deletar do Google:', gError)
                    }
                }
            }
            // -------------------------------------

            toast.success('Escala removida com sucesso!')
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
