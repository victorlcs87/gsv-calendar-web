'use client'

import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths, addMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Download, TrendingUp, TrendingDown, Clock, DollarSign, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/layout'
import type { MonthlyReport } from '@/types'
import { useScales } from '@/hooks/useScales'

/**
 * Página de Relatórios
 * Exibe estatísticas mensais e anuais das escalas
 */
export default function RelatoriosPage() {
    const { scales, isLoading } = useScales()
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())

    // Calcular relatório do mês selecionado
    const currentMonthReport = useMemo((): MonthlyReport => {
        const monthStart = startOfMonth(selectedDate)
        const monthEnd = endOfMonth(selectedDate)

        const monthScales = scales.filter((scale) =>
            scale.data && isWithinInterval(parseISO(scale.data), { start: monthStart, end: monthEnd })
        )

        return {
            mes: format(selectedDate, 'yyyy-MM'),
            totalEscalas: monthScales.length,
            totalHoras: monthScales.reduce((acc, s) => acc + s.horas, 0),
            valorBrutoTotal: monthScales.reduce((acc, s) => acc + s.valorBruto, 0),
            valorLiquidoTotal: monthScales.reduce((acc, s) => acc + s.valorLiquido, 0),
            escalasOrdinarias: monthScales.filter((s) => s.tipo === 'Ordinária').length,
            escalasExtras: monthScales.filter((s) => s.tipo === 'Extra').length,
        }
    }, [selectedDate, scales])

    // Calcular relatório do mês anterior para comparação
    const previousMonthReport = useMemo((): MonthlyReport => {
        const prevDate = subMonths(selectedDate, 1)
        const monthStart = startOfMonth(prevDate)
        const monthEnd = endOfMonth(prevDate)

        const monthScales = scales.filter((scale) =>
            scale.data && isWithinInterval(parseISO(scale.data), { start: monthStart, end: monthEnd })
        )

        return {
            mes: format(prevDate, 'yyyy-MM'),
            totalEscalas: monthScales.length,
            totalHoras: monthScales.reduce((acc, s) => acc + s.horas, 0),
            valorBrutoTotal: monthScales.reduce((acc, s) => acc + s.valorBruto, 0),
            valorLiquidoTotal: monthScales.reduce((acc, s) => acc + s.valorLiquido, 0),
            escalasOrdinarias: monthScales.filter((s) => s.tipo === 'Ordinária').length,
            escalasExtras: monthScales.filter((s) => s.tipo === 'Extra').length,
        }
    }, [selectedDate, scales])


    const getDiff = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return ((current - previous) / previous) * 100
    }

    const horasDiff = getDiff(currentMonthReport.totalHoras, previousMonthReport.totalHoras)
    const valorDiff = getDiff(currentMonthReport.valorLiquidoTotal, previousMonthReport.valorLiquidoTotal)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
                    <p className="text-muted-foreground">Acompanhe suas estatísticas mensais</p>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar CSV
                    </Button>
                </div>
            </div>

            {/* Navegação de Mês */}
            <div className="flex items-center justify-center gap-4">
                <Button variant="outline" size="icon" onClick={() => setSelectedDate(subMonths(selectedDate, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="min-w-48 text-center text-xl font-semibold">
                    {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
                </h2>
                <Button variant="outline" size="icon" onClick={() => setSelectedDate(addMonths(selectedDate, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total de Escalas</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{currentMonthReport.totalEscalas}</div>
                        <p className="text-xs text-muted-foreground">
                            {currentMonthReport.escalasOrdinarias} ordinárias, {currentMonthReport.escalasExtras} extras
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
                        <div className="text-3xl font-bold">{currentMonthReport.totalHoras}h</div>
                        <p className={`text-xs ${horasDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {horasDiff >= 0 ? '+' : ''}{horasDiff.toFixed(1)}% vs mês anterior
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
                            R$ {currentMonthReport.valorBrutoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                        <div className="text-3xl font-bold text-primary">
                            R$ {currentMonthReport.valorLiquidoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <p className={`text-xs ${valorDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {valorDiff >= 0 ? '+' : ''}{valorDiff.toFixed(1)}% vs mês anterior
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Resumo por Tipo */}
            <Card>
                <CardHeader>
                    <CardTitle>Distribuição por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Escalas Ordinárias</p>
                                <p className="text-2xl font-bold">{currentMonthReport.escalasOrdinarias}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                <div className="h-4 w-4 rounded-full bg-primary" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Escalas Extras</p>
                                <p className="text-2xl font-bold">{currentMonthReport.escalasExtras}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                                <div className="h-4 w-4 rounded-full bg-secondary" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
