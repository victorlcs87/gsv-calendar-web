import { Scale } from '@/types'
import { format } from 'date-fns'
import { parseLocalDate } from './utils'

/**
 * Formata um valor numérico como moeda brasileira (BRL).
 * @param value - Valor numérico
 * @returns String formatada (ex: "R$ 1.234,56")
 */
function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Exporta escalas para um arquivo CSV e inicia o download.
 * 
 * O arquivo CSV gerado contém as colunas (compatível com Importação Outlook/Google):
 * - Subject: Tipo de serviço
 * - Location: Local do serviço
 * - Start Date / End Date: Datas formatadas
 * - Start Time / End Time: Horários
 * - Description: Horas, valor bruto e líquido
 * 
 * @param scales - Array de escalas para exportar
 * @returns True se a exportação foi iniciada com sucesso
 * @throws {Error} Se não houver escalas para exportar
 */
export function exportScalesToCsv(scales: Scale[]): boolean {
    if (scales.length === 0) {
        throw new Error("Nenhuma escala para exportar.")
    }

    // Montar CSV com formato compatível usando separador vírgula (padrão internacional/Google)
    // Se precisar de compatibilidade Excel Brasil, usaria ponto-e-vírgula, mas mobile usa vírgula.
    const header = "Subject,Location,Start Date,End Date,Start Time,End Time,Description\n"

    const rows = scales.map(s => {
        const date = parseLocalDate(s.data)
        const dStart = format(date, 'dd/MM/yyyy')

        // Assumindo que a data fim é a mesma ou dia seguinte.
        // Como o mobile trata isso na lógica de calendário, aqui faremos uma simplificação:
        // Se horaFim < horaInicio, entende-se que é no dia seguinte.
        let dEnd = dStart
        if (s.horaFim < s.horaInicio) {
            const nextDay = new Date(date)
            nextDay.setDate(nextDay.getDate() + 1)
            dEnd = format(nextDay, 'dd/MM/yyyy')
        }

        // Formatar horários HH:mm
        const tStart = `${String(s.horaInicio).padStart(2, '0')}:00`
        const tEnd = `${String(s.horaFim).padStart(2, '0')}:00`

        // Description contém informações financeiras com quebras de linha escapadas
        const description = `Horas: ${s.horas}h\\nBruto: ${formatCurrency(s.valorBruto)}\\nLíquido: ${formatCurrency(s.valorLiquido)}`

        // Escapar aspas duplas se houver no conteúdo (CSV standard)
        const escape = (str: string) => str.replace(/"/g, '""')

        return `"${escape(s.tipo)}","${escape(s.local)}","${dStart}","${dEnd}","${tStart}","${tEnd}","${description}"`
    }).join('\n')

    const csvContent = header + rows

    // Gerar Blob com BOM para UTF-8 correto no Excel
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })

    // Nome do arquivo no padrão GSV-yyyyMMdd-HHmmss.csv
    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss')
    const fileName = `GSV-${timestamp}.csv`

    // Criar link temporário para download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()

    // Limpar
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return true
}
