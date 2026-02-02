import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Scale } from '@/types'

/**
 * Hook para buscar escalas do Supabase
 * Realiza o mapeamento de campos (snake_case -> camelCase)
 */
export function useScales() {
    const [scales, setScales] = useState<Scale[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchScales = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)
            const supabase = createClient()

            const { data, error: supabaseError } = await supabase
                .from('scales')
                .select('*')
                .order('data', { ascending: false })

            if (supabaseError) {
                throw new Error(supabaseError.message)
            }

            if (data) {
                // Interface para o banco de dados
                interface ScaleDB {
                    id: string
                    user_id: string
                    data: string
                    tipo: 'Ordinária' | 'Extra'
                    local: string
                    hora_inicio: number
                    hora_fim: number
                    horas: number
                    valor_bruto: number
                    valor_liquido: number
                    observacoes?: string
                    sincronizado: boolean
                    sync_status: 'pending' | 'synced' | 'error'
                    calendar_event_id?: string
                    created_at: string
                    updated_at: string
                    ativa: boolean
                    motivo_inatividade?: string
                }

                // Mapeia os dados do banco (snake_case) para a interface (camelCase)
                const mappedScales: Scale[] = (data as unknown as ScaleDB[]).map((item) => ({
                    id: item.id,
                    user_id: item.user_id,
                    data: item.data,
                    tipo: item.tipo,
                    local: item.local,
                    horaInicio: item.hora_inicio,
                    horaFim: item.hora_fim,
                    horas: item.horas,
                    valorBruto: item.valor_bruto,
                    valorLiquido: item.valor_liquido,
                    observacoes: item.observacoes,
                    sincronizado: item.sincronizado,
                    syncStatus: item.sync_status,
                    calendar_event_id: item.calendar_event_id,
                    created_at: item.created_at,
                    updated_at: item.updated_at,
                    ativa: item.ativa,
                    motivo_inatividade: item.motivo_inatividade
                }))
                setScales(mappedScales)
            }
        } catch (err) {
            console.error('Erro ao buscar escalas:', err)
            const message = err instanceof Error ? err.message : 'Erro desconhecido ao buscar escalas'
            setError(message)
            toast.error('Erro ao carregar escalas', { description: message })
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchScales()
    }, [fetchScales])

    return {
        scales,
        isLoading,
        error,
        refresh: fetchScales
    }
}
