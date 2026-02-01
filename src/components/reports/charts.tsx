'use client'

import { useMemo } from 'react'
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Scale } from '@/types'
import { format, parseISO, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Colors from globals.css
const COLORS = [
    'oklch(0.45 0.2 25)', // Primary (Red)
    'oklch(0.65 0.18 45)', // Secondary (Orange)
    'oklch(0.55 0.15 35)', // Chart 3
    'oklch(0.75 0.12 55)', // Chart 4
]

interface ChartsProps {
    scales: Scale[]
}

/**
 * Gráfico de Pizza: Distribuição por Tipo de Escala
 */
export function ScaleTypeChart({ scales }: ChartsProps) {
    const data = useMemo(() => {
        const counts = scales.reduce((acc, scale) => {
            acc[scale.tipo] = (acc[scale.tipo] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        return Object.entries(counts).map(([name, value]) => ({ name, value }))
    }, [scales])

    if (scales.length === 0) return null

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Distribuição por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => [`${value} escalas`, 'Quantidade']}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Gráfico de Barras: Horas por Mês (ou Dia se for poucos dias) -> Vamos fazer por Mês para simplificar
 * Melhora: Se o range for curto, agrupar por dia? Vamos manter simples: Horas por Escala (Cronológico)
 */
export function HoursEvolutionChart({ scales }: ChartsProps) {
    const data = useMemo(() => {
        // Sort cronologicamente e pegar apenas data e horas
        return [...scales]
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
            .map(scale => ({
                date: format(parseISO(scale.data), 'dd/MM'),
                horas: scale.horas,
                local: scale.local
            }))
            // Limitar para não poluir se tiver muitas
            .slice(-20)
    }, [scales])

    if (scales.length === 0) return null

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Últimas Escalas (Horas)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                fontSize={12}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar
                                dataKey="horas"
                                fill="oklch(0.65 0.18 45)"
                                radius={[4, 4, 0, 0]}
                                name="Horas"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
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

        // Agrupar por mês para ficar mais bonito line chart
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
                                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor Líquido']}
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
