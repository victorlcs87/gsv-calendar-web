import Papa from 'papaparse'
import type { ScaleInput, TipoEscala } from '@/types'

/**
 * Colunas esperadas no CSV (Suporta formato manual e exportação Sigmanet)
 */
interface CsvRow {
    // Formato Manual
    Data?: string
    Tipo?: string
    Local?: string
    HoraInicio?: string
    HoraFim?: string
    Observacoes?: string

    // Alternativas manuais (minúsculas/acentos)
    data?: string
    tipo?: string
    local?: string
    horaInicio?: string
    horaFim?: string
    hora_inicio?: string
    hora_fim?: string
    observacoes?: string

    // Formato Sigmanet
    datIniVagas?: string // "06/02/2026"
    nomTurno?: string    // "07h00 às 19h00"
    nomLocalServico?: string // "HRT"
    nomGrupoServico?: string // "SOCORRISTAS..."
    nomStatusVaga?: string   // "Selecionada"
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
 * Extrai horas de início e fim de uma string de turno
 * Ex: "07h00 às 19h00" -> { inicio: 7, fim: 19 }
 */
function parseTurno(turno: string): { inicio: number, fim: number } | null {
    if (!turno) return null

    // Tenta formato "07h00 às 19h00" ou "07:00 - 19:00"
    // Regex captura dois grupos de dígitos iniciais
    const match = turno.match(/(\d{1,2})[h:]\d{2}\s*(?:às|-|to)\s*(\d{1,2})[h:]\d{2}/i)

    if (match) {
        const inicio = parseInt(match[1])
        const fim = parseInt(match[2])
        if (!isNaN(inicio) && !isNaN(fim)) {
            return { inicio, fim }
        }
    }

    return null
}

/**
 * Valida e normaliza o tipo de escala ou infere baseado nas horas
 */
function determineTipo(tipoStr: string | undefined, horas: { inicio: number, fim: number } | null): TipoEscala {
    // Se veio explícito, respeita
    if (tipoStr) {
        const normalized = tipoStr.trim().toLowerCase()
        if (normalized === 'ordinária' || normalized === 'ordinaria' || normalized === 'ord') return 'Ordinária'
        if (normalized === 'extra' || normalized === 'ext') return 'Extra'
    }

    // Se não veio, infere pelas horas (Heurística)
    if (horas) {
        // Se começa e termina na mesma hora (ex: 08h às 08h do dia seguinte) = 24h = Ordinária
        if (horas.inicio === horas.fim) return 'Ordinária'
        // Caso contrário (ex: 07h às 19h) = 12h = Extra
        return 'Extra'
    }

    return 'Extra' // Default fallback
}

/**
 * Valida e normaliza a data (aceita DD/MM/YYYY ou YYYY-MM-DD)
 */
function normalizeData(value: string): string | null {
    if (!value) return null
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
function normalizeHora(value: string | number): number | null {
    const num = typeof value === 'string' ? parseInt(value.trim()) : value
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

                    // 1. Tentar mapear campos Sigmanet vs Manual
                    const dataRaw = row.Data || row.data || row.datIniVagas || ''
                    const localRaw = row.Local || row.local || row.nomLocalServico || ''
                    // Tipo e Horas dependem do formato
                    const tipoRaw = row.Tipo || row.tipo

                    // Lógica de Observação e Operação (nomGrupoServico)
                    const obsManual = row.Observacoes || row.observacoes || ''
                    const operacao = row.nomGrupoServico || ''

                    const obsRaw = operacao
                        ? `Operação: ${operacao}${obsManual ? `\n${obsManual}` : ''}`
                        : obsManual

                    // 2. Processar Horários
                    let horaInicio: number | null = null
                    let horaFim: number | null = null

                    // Se for formato Sigmanet com "nomTurno"
                    if (row.nomTurno) {
                        const parsedTurno = parseTurno(row.nomTurno)
                        if (parsedTurno) {
                            horaInicio = parsedTurno.inicio
                            horaFim = parsedTurno.fim
                        }
                    } else {
                        // Formato manual com colunas separadas
                        horaInicio = normalizeHora(row.HoraInicio || row.horaInicio || row.hora_inicio || '')
                        horaFim = normalizeHora(row.HoraFim || row.horaFim || row.hora_fim || '')
                    }

                    // 3. Validar Data
                    const normalizedData = normalizeData(dataRaw)
                    if (!normalizedData) {
                        // Se não encontrou data válida, tentar logar o que veio para debug
                        // Ignorar linhas vazias ou metadados estranhos
                        if (!dataRaw && !localRaw && !row.nomTurno) return

                        errors.push(`Linha ${rowNum}: Data inválida "${dataRaw}"`)
                        return
                    }

                    // 4. Determinar Tipo
                    // Se horaFim não foi parseada ainda, não dá pra inferir tipo
                    const tipoFinal = determineTipo(tipoRaw, (horaInicio !== null && horaFim !== null) ? { inicio: horaInicio, fim: horaFim } : null)

                    // 5. Validar Local
                    if (!localRaw.trim()) {
                        errors.push(`Linha ${rowNum}: Local é obrigatório`)
                        return
                    }

                    // 6. Validar Horas Finais
                    if (horaInicio === null) {
                        errors.push(`Linha ${rowNum}: Hora início não encontrada (verifique coluna HoraInicio ou nomTurno)`)
                        return
                    }
                    if (horaFim === null) {
                        errors.push(`Linha ${rowNum}: Hora fim não encontrada`)
                        return
                    }

                    // Adicionar escala válida
                    data.push({
                        data: normalizedData,
                        tipo: tipoFinal,
                        local: localRaw.trim(),
                        horaInicio,
                        horaFim,
                        observacoes: obsRaw.trim() || undefined,
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
