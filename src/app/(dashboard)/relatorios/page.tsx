'use client'

import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths, addMonths, startOfYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DateRange } from "react-day-picker"
import { ChevronLeft, ChevronRight, Download, TrendingUp, TrendingDown, Clock, DollarSign, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MonthlyReport } from '@/types'
import { useScales } from '@/hooks/useScales'
import { OperationRanking, LocationRanking, EarningsChart } from '@/components/reports/charts'

/**
 * Página de Relatórios
 * Exibe estatísticas mensais e anuais das escalas
 */
export default function RelatoriosPage() {
    const { scales, isLoading } = useScales()
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfYear(new Date()),
        to: new Date()
    })

    // Filtrar escalas pelo período selecionado
    const periodScales = useMemo(() => {
        if (!dateRange?.from) return []

        const start = dateRange.from
        const end = dateRange.to ? new Date(dateRange.to) : new Date(start)
        end.setHours(23, 59, 59, 999)
        start.setHours(0, 0, 0, 0)

        const interval = { start, end }

        return scales.filter((scale) => {
            if (!scale.data) return false
            try {
                return isWithinInterval(parseISO(scale.data), interval)
            } catch { return false }
        })
    }, [dateRange, scales])

    // Calcular relatório do período selecionado
    const currentReport = useMemo((): MonthlyReport => {
        return {
            mes: 'Período Atual',
            totalEscalas: periodScales.length,
            totalHoras: periodScales.reduce((acc, s) => acc + s.horas, 0),
            valorBrutoTotal: periodScales.reduce((acc, s) => acc + s.valorBruto, 0),
            valorLiquidoTotal: periodScales.reduce((acc, s) => acc + s.valorLiquido, 0),
            escalasOrdinarias: periodScales.filter((s) => s.tipo === 'Ordinária').length,
            escalasExtras: periodScales.filter((s) => s.tipo === 'Extra').length,
        }
    }, [periodScales])

    // Calcular relatório do período anterior para comparação
    const previousReport = useMemo((): MonthlyReport => {
        if (!dateRange?.from) return { mes: '', totalEscalas: 0, totalHoras: 0, valorBrutoTotal: 0, valorLiquidoTotal: 0, escalasOrdinarias: 0, escalasExtras: 0 }

        const currentStart = dateRange.from
        const currentEnd = dateRange.to ? new Date(dateRange.to) : new Date(currentStart)

        // Calcular duração em milissegundos
        const duration = currentEnd.getTime() - currentStart.getTime()

        // Período anterior: termina logo antes do começo do atual
        const prevEnd = new Date(currentStart.getTime() - 86400000) // -1 dia
        const prevStart = new Date(prevEnd.getTime() - duration)

        prevEnd.setHours(23, 59, 59, 999)
        prevStart.setHours(0, 0, 0, 0)

        const interval = { start: prevStart, end: prevEnd }

        const periodScales = scales.filter((scale) => {
            if (!scale.data) return false
            try {
                return isWithinInterval(parseISO(scale.data), interval)
            } catch { return false }
        })

        return {
            mes: 'Período Anterior',
            totalEscalas: periodScales.length,
            totalHoras: periodScales.reduce((acc, s) => acc + s.horas, 0),
            valorBrutoTotal: periodScales.reduce((acc, s) => acc + s.valorBruto, 0),
            valorLiquidoTotal: periodScales.reduce((acc, s) => acc + s.valorLiquido, 0),
            escalasOrdinarias: periodScales.filter((s) => s.tipo === 'Ordinária').length,
            escalasExtras: periodScales.filter((s) => s.tipo === 'Extra').length,
        }
    }, [dateRange, scales])


    const getDiff = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return ((current - previous) / previous) * 100
    }

    const horasDiff = getDiff(currentReport.totalHoras, previousReport.totalHoras)
    const valorDiff = getDiff(currentReport.valorLiquidoTotal, previousReport.valorLiquidoTotal)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
                    <p className="text-muted-foreground">Acompanhe suas estatísticas</p>
                </div>
                <div className="flex items-center gap-2">
                </div>
            </div>

            {/* Seletor de Período */}
            <div className="flex items-center justify-center gap-4 py-4">
                <DateRangePicker
                    date={dateRange}
                    setDate={setDateRange}
                    className="w-full sm:w-auto"
                />
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total de Escalas</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{currentReport.totalEscalas}</div>
                        <p className="text-xs text-muted-foreground">
                            {currentReport.escalasOrdinarias} ordinárias, {currentReport.escalasExtras} extras
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
                        {horasDiff >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{currentReport.totalHoras}h</div>
                        <p className={`text-xs ${horasDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {horasDiff >= 0 ? '+' : ''}{horasDiff.toFixed(1)}% vs período anterior
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Valor Bruto</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            R$ {currentReport.valorBrutoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">Antes dos descontos</p>
                    </CardContent>
                </Card>

                <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-transparent">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Valor Líquido</CardTitle>
                        {valorDiff >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                            R$ {currentReport.valorLiquidoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className={`text-xs ${valorDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {valorDiff >= 0 ? '+' : ''}{valorDiff.toFixed(1)}% vs período anterior
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Gráficos */}
            <div className="grid gap-4 lg:grid-cols-2">
                <OperationRanking scales={periodScales} />
                <LocationRanking scales={periodScales} />
                <EarningsChart scales={periodScales} />
            </div>
        </div>
    )
}
