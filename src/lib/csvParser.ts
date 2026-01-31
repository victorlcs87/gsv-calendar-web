import Papa from 'papaparse'
import type { ScaleInput, TipoEscala } from '@/types'

/**
 * Colunas esperadas no CSV
 * Formato: Data, Tipo, Local, HoraInicio, HoraFim, Observacoes
 */
interface CsvRow {
    Data?: string
    Tipo?: string
    Local?: string
    HoraInicio?: string
    HoraFim?: string
    Observacoes?: string
    // Alternativas com acentos ou minúsculas
    data?: string
    tipo?: string
    local?: string
    horaInicio?: string
    horaFim?: string
    hora_inicio?: string
    hora_fim?: string
    observacoes?: string
}

/**
 * Resultado do parsing do CSV
 */
export interface CsvParseResult {
    success: boolean
    data: ScaleInput[]
    errors: string[]
    totalRows: number
}

/**
 * Valida e normaliza o tipo de escala
 */
function normalizeTipo(value: string): TipoEscala | null {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'ordinária' || normalized === 'ordinaria' || normalized === 'ord') {
        return 'Ordinária'
    }
    if (normalized === 'extra' || normalized === 'ext') {
        return 'Extra'
    }
    return null
}

/**
 * Valida e normaliza a data (aceita DD/MM/YYYY ou YYYY-MM-DD)
 */
function normalizeData(value: string): string | null {
    const trimmed = value.trim()

    // Formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed
    }

    // Formato DD/MM/YYYY
    const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (match) {
        const [, day, month, year] = match
        return `${year}-${month}-${day}`
    }

    return null
}

/**
 * Valida e normaliza a hora (0-23)
 */
function normalizeHora(value: string): number | null {
    const num = parseInt(value.trim())
    if (isNaN(num) || num < 0 || num > 23) {
        return null
    }
    return num
}

/**
 * Faz o parsing de um arquivo CSV para ScaleInput[]
 * @param file Arquivo CSV
 * @returns Promise com resultado do parsing
 */
export function parseCsvFile(file: File): Promise<CsvParseResult> {
    return new Promise((resolve) => {
        const errors: string[] = []
        const data: ScaleInput[] = []

        Papa.parse<CsvRow>(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                results.data.forEach((row, index) => {
                    const rowNum = index + 2 // +1 para 1-indexed, +1 para header

                    // Extrair valores com fallbacks para diferentes nomes de coluna
                    const dataValue = row.Data || row.data || ''
                    const tipoValue = row.Tipo || row.tipo || ''
                    const localValue = row.Local || row.local || ''
                    const horaInicioValue = row.HoraInicio || row.horaInicio || row.hora_inicio || ''
                    const horaFimValue = row.HoraFim || row.horaFim || row.hora_fim || ''
                    const observacoesValue = row.Observacoes || row.observacoes || ''

                    // Validar data
                    const normalizedData = normalizeData(dataValue)
                    if (!normalizedData) {
                        errors.push(`Linha ${rowNum}: Data inválida "${dataValue}"`)
                        return
                    }

                    // Validar tipo
                    const normalizedTipo = normalizeTipo(tipoValue)
                    if (!normalizedTipo) {
                        errors.push(`Linha ${rowNum}: Tipo inválido "${tipoValue}" (use Ordinária ou Extra)`)
                        return
                    }

                    // Validar local
                    if (!localValue.trim()) {
                        errors.push(`Linha ${rowNum}: Local é obrigatório`)
                        return
                    }

                    // Validar horas
                    const horaInicio = normalizeHora(horaInicioValue)
                    if (horaInicio === null) {
                        errors.push(`Linha ${rowNum}: Hora início inválida "${horaInicioValue}"`)
                        return
                    }

                    const horaFim = normalizeHora(horaFimValue)
                    if (horaFim === null) {
                        errors.push(`Linha ${rowNum}: Hora fim inválida "${horaFimValue}"`)
                        return
                    }

                    // Adicionar escala válida
                    data.push({
                        data: normalizedData,
                        tipo: normalizedTipo,
                        local: localValue.trim(),
                        horaInicio,
                        horaFim,
                        observacoes: observacoesValue.trim() || undefined,
                    })
                })

                resolve({
                    success: errors.length === 0,
                    data,
                    errors,
                    totalRows: results.data.length,
                })
            },
            error: (error) => {
                resolve({
                    success: false,
                    data: [],
                    errors: [`Erro ao ler arquivo: ${error.message}`],
                    totalRows: 0,
                })
            },
        })
    })
}

/**
 * Gera um template CSV para download
 */
export function generateCsvTemplate(): string {
    const header = 'Data,Tipo,Local,HoraInicio,HoraFim,Observacoes'
    const example = '01/01/2026,Ordinária,QCG,7,19,Escala de exemplo'
    return `${header}\n${example}`
}
