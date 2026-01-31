import { z } from 'zod'

/**
 * Schemas Zod para validação de dados
 * Validação client + server side para segurança
 */

/** Schema para tipo de escala */
export const tipoEscalaSchema = z.enum(['Ordinária', 'Extra'])

/** Schema para criar/editar escala */
export const scaleInputSchema = z.object({
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
    tipo: tipoEscalaSchema,
    local: z.string().min(2, 'Local deve ter pelo menos 2 caracteres').max(100),
    horaInicio: z.number().int().min(0).max(23),
    horaFim: z.number().int().min(0).max(23),
    observacoes: z.string().max(500).optional(),
})

/** Schema para filtros de busca */
export const scaleFiltersSchema = z.object({
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    tipo: tipoEscalaSchema.optional(),
    local: z.string().optional(),
})

/** Schema para login */
export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

/** Schema para registro */
export const registerSchema = z.object({
    nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
})

/** Schema para linha de CSV importado */
export const csvRowSchema = z.object({
    data: z.string(),
    tipo: z.string(),
    local: z.string(),
    horaInicio: z.union([z.string(), z.number()]),
    horaFim: z.union([z.string(), z.number()]),
    observacoes: z.string().optional(),
})

/** Tipos inferidos dos schemas */
export type ScaleInput = z.infer<typeof scaleInputSchema>
export type ScaleFilters = z.infer<typeof scaleFiltersSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CsvRow = z.infer<typeof csvRowSchema>
