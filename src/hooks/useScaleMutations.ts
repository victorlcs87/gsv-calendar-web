import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { ScaleInput } from '@/types'

/**
 * Hook para mutações de escalas (Create, Update, Delete)
 */
export function useScaleMutations(onSuccess?: () => void) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const createScale = async (input: ScaleInput) => {
        setIsSubmitting(true)
        try {
            const supabase = createClient()

            // Obter usuário atual
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) throw new Error('Usuário não autenticado')

            // Mapear para snake_case
            const dbData = {
                user_id: user.id,
                data: input.data,
                tipo: input.tipo,
                local: input.local,
                hora_inicio: input.horaInicio,
                hora_fim: input.horaFim,
                observacoes: input.observacoes
                // horas, valor_bruto, valor_liquido são calculados por trigger no BD
            }

            const { error } = await supabase
                .from('scales')
                .insert(dbData)

            if (error) throw error

            toast.success('Escala criada com sucesso!')
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

            const { error } = await supabase
                .from('scales')
                .update(dbData)
                .eq('id', id)

            if (error) throw error

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
        // Confirmation is usually handled in UI, but safe to safeguard
        setIsSubmitting(true)
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('scales')
                .delete()
                .eq('id', id)

            if (error) throw error

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

    return {
        createScale,
        updateScale,
        deleteScale,
        isSubmitting
    }
}
