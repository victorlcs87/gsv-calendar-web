'use client'

import { useMemo } from 'react'
import {
    AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Scale } from '@/types'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ChartsProps {
    scales: Scale[]
}

// Helper para formatar moeda
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value)
}

/**
 * Componente Visual de Ranking (Barra de Progresso)
 */
const RankingItem = ({
    rank,
    label,
    subLabel,
    valueDisplay,
    valueSubDisplay,
    percentage,
    colorClass,
    bgClass
}: {
    rank: number
    label: string
    subLabel: string
    valueDisplay: string
    valueSubDisplay: string
    percentage: number
    colorClass: string
    bgClass: string
}) => (
    <div className="mb-4 last:mb-0">
        <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-white ${colorClass}`}>
                    {rank}
                </div>
                <div>
                    <h4 className="text-sm font-semibold">{label}</h4>
                    <p className="text-xs text-muted-foreground">{subLabel}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold">{valueDisplay}</p>
                <p className="text-xs text-muted-foreground">{valueSubDisplay}</p>
            </div>
        </div>
        {/* Progress Bar Background */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/10">
            {/* Progress Bar Fill */}
            <div
                className={`h-full rounded-full ${bgClass}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
            />
        </div>
    </div>
)

/**
 * Lista: Distribuição por Operação
 * Mostra ranking por horas trabalhadas em cada operação
 */
export function OperationRanking({ scales }: ChartsProps) {
    const data = useMemo(() => {
        const grouped = scales.reduce((acc, scale) => {
            // Extrair operação das observações ou usar 'Geral'
            const opMatch = scale.observacoes?.match(/Operação: (.*?)(?:\n|$)/)
            const key = opMatch ? opMatch[1] : 'Operação Padrão'

            if (!acc[key]) acc[key] = { count: 0, hours: 0 }
            acc[key].count += 1
            acc[key].hours += scale.horas
            return acc
        }, {} as Record<string, { count: number, hours: number }>)

        const sorted = Object.entries(grouped)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.hours - a.hours)

        const totalHours = sorted.reduce((acc, item) => acc + item.hours, 0)
        const maxHours = sorted.length > 0 ? sorted[0].hours : 0

        return { items: sorted, totalHours, maxHours }
    }, [scales])

    if (scales.length === 0) return null

    return (
        <Card className="h-fit">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <span className="text-orange-500">🚒</span>
                    Distribuição por Operação
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                    Horas dedicadas por tipo de operação
                </p>
            </CardHeader>
            <CardContent>
                {data.items.map((item, index) => {
                    const percentOfTotal = data.totalHours > 0 ? (item.hours / data.totalHours) * 100 : 0
                    const percentOfMax = data.maxHours > 0 ? (item.hours / data.maxHours) * 100 : 0

                    return (
                        <RankingItem
                            key={item.name}
                            rank={index + 1}
                            label={item.name}
                            subLabel={`${item.count} escala${item.count !== 1 ? 's' : ''} • ${percentOfTotal.toFixed(1)}%`}
                            valueDisplay={`${item.hours}h`}
                            valueSubDisplay="trabalhadas"
                            percentage={percentOfMax}
                            colorClass="bg-orange-500"
                            bgClass="bg-orange-500"
                        />
                    )
                })}
            </CardContent>
        </Card>
    )
}

/**
 * Lista: Distribuição por Local
 * Mostra ranking por valor recebido (R$)
 */
export function LocationRanking({ scales }: ChartsProps) {
    const data = useMemo(() => {
        const grouped = scales.reduce((acc, scale) => {
            const key = scale.local
            if (!acc[key]) acc[key] = { count: 0, value: 0 }
            acc[key].count += 1
            acc[key].value += scale.valorLiquido
            return acc
        }, {} as Record<string, { count: number, value: number }>)

        const sorted = Object.entries(grouped)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.value - a.value)

        const totalValue = sorted.reduce((acc, item) => acc + item.value, 0)
        const maxValue = sorted.length > 0 ? sorted[0].value : 0

        return { items: sorted, totalValue, maxValue }
    }, [scales])

    if (scales.length === 0) return null

    return (
        <Card className="h-fit">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <span className="text-emerald-500">📍</span>
                    Distribuição por Local
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                    Serviços e valores recebidos por localidade
                </p>
            </CardHeader>
            <CardContent>
                {data.items.map((item, index) => {
                    const percentOfMax = data.maxValue > 0 ? (item.value / data.maxValue) * 100 : 0

                    // Cálculo de porcentagem de "frequência" (serviços) ou valor?
                    // Imagem mostra "3 serviços • 60.0%". Parece % de serviços? Ou % do total de valor?
                    // Texto diz "60.0%". Serviços: 3.
                    // Rio: 1 serviço • 20.0%.
                    // Soma services: 3+1+1=5. 3/5 = 60%. Ok, é % de COUNT.
                    // Vou calcular percentage of Count para o label.
                    // Para o Value Display (R$), mantenho o valor.

                    // Recalcular totalCount
                    const totalCount = data.items.reduce((acc, i) => acc + i.count, 0)
                    const percentOfCount = totalCount > 0 ? (item.count / totalCount) * 100 : 0

                    return (
                        <RankingItem
                            key={item.name}
                            rank={index + 1}
                            label={item.name}
                            subLabel={`${item.count} serviço${item.count !== 1 ? 's' : ''} • ${percentOfCount.toFixed(1)}%`}
                            valueDisplay={formatCurrency(item.value)}
                            valueSubDisplay="recebidos"
                            percentage={percentOfMax} // Barra baseada no valor monetário, provavelmente? Imagem tem barra cheia para o top 1. Sim, relativo ao máximo.
                            colorClass="bg-emerald-500"
                            bgClass="bg-emerald-500"
                        />
                    )
                })}
            </CardContent>
        </Card>
    )
}

/**
 * Gráfico de Área: Valor Líquido Acumulado
 */
export function EarningsChart({ scales }: ChartsProps) {
    const data = useMemo(() => {
        const sorted = [...scales].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

        // Agrupar por mês
        const monthlyData = sorted.reduce((acc, scale) => {
            const monthKey = format(parseISO(scale.data), 'MMM/yyyy', { locale: ptBR })
            if (!acc[monthKey]) acc[monthKey] = 0
            acc[monthKey] += scale.valorLiquido
            return acc
        }, {} as Record<string, number>)

        return Object.entries(monthlyData).map(([month, value]) => ({
            month,
            value
        }))
    }, [scales])

    if (data.length === 0) return null

    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle className="text-sm font-medium">Faturamento Mensal (Líquido)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="oklch(0.45 0.2 25)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="oklch(0.45 0.2 25)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                            />
                            <YAxis
                                hide
                            />
                            <Tooltip
                                formatter={(value: number | undefined) => [value ? `R$ ${value ? value.toFixed(2) : '0.00'}` : 'R$ 0,00', 'Valor Líquido']}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="oklch(0.45 0.2 25)"
                                fillOpacity={1}
                                fill="url(#colorValue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
