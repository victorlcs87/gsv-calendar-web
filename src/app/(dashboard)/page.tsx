'use client'

import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Upload, Filter, CalendarDays, Loader2, Download, Clock, DollarSign, BarChart3 } from 'lucide-react'
import { DateRange } from "react-day-picker" // Import DateRange type
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { ScaleCard, ScaleFormModal, CsvImportDialog } from '@/components/scales'
import { SyncButton } from '@/components/calendar'
import type { Scale, TipoEscala, ScaleFilters } from '@/types'
import { useScales } from '@/hooks/useScales'
import { useScaleMutations } from '@/hooks/useScaleMutations'
import { exportScalesToCsv } from '@/lib/export'
import { toast } from 'sonner'

/**
 * Página principal de Escalas
 * Lista escalas com filtros, ações CRUD e importação CSV
 */
export default function EscalasPage() {
    const { scales, isLoading, refresh } = useScales()
    const { deleteScale } = useScaleMutations(refresh)

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
    })

    const [filters, setFilters] = useState<ScaleFilters>({})
    const [showFilters, setShowFilters] = useState(false)
    // Removed calendarOpen state

    // Estados do modal CRUD
    const [formModalOpen, setFormModalOpen] = useState(false)
    const [editingScale, setEditingScale] = useState<Scale | undefined>(undefined)

    // Estado do modal de importação CSV
    const [csvModalOpen, setCsvModalOpen] = useState(false)

    // Filtrar escalas por período e filtros
    const filteredScales = useMemo(() => {
        if (!dateRange?.from) return scales

        // Ajustar fim para o final do dia se existir, ou usar o início como fim (intervalo de 1 dia)
        const start = dateRange.from
        // Se 'to' existir, pega o final desse dia. Se não, usa o final do dia 'from'.
        // Mas o DateRange picker do shadcn as vezes retorna undefined no 'to' durante a seleção.
        // Vamos considerar intervalo válido apenas se tiver from.
        const end = dateRange.to ? new Date(dateRange.to) : new Date(start)
        // Garantir que englobe o dia inteiro
        end.setHours(23, 59, 59, 999)
        start.setHours(0, 0, 0, 0)

        // Intervalo para comparação
        const interval = { start, end }

        return scales.filter((scale) => {
            // Verificar se a data é válida
            if (!scale.data) return false
            const scaleDate = parseISO(scale.data)

            // Filtro por data (Range)
            // isWithinInterval lança erro se start > end, mas nosso setup garante start <= end
            // exceto se o componente retornar algo estranho.
            try {
                if (!isWithinInterval(scaleDate, interval)) {
                    return false
                }
            } catch {
                return false
            }

            // Filtro por tipo
            if (filters.tipo && scale.tipo !== filters.tipo) {
                return false
            }

            // Filtro por local
            if (filters.local && !scale.local.toLowerCase().includes(filters.local.toLowerCase())) {
                return false
            }

            return true
        })
    }, [scales, dateRange, filters])

    // Totais do mês
    const totals = useMemo(() => {
        return filteredScales.reduce(
            (acc, scale) => ({
                totalHoras: acc.totalHoras + scale.horas,
                totalBruto: acc.totalBruto + scale.valorBruto,
                totalLiquido: acc.totalLiquido + scale.valorLiquido,
                totalEscalas: acc.totalEscalas + 1,
            }),
            { totalHoras: 0, totalBruto: 0, totalLiquido: 0, totalEscalas: 0 }
        )
    }, [filteredScales])

    const handleNewScale = () => {
        setEditingScale(undefined)
        setFormModalOpen(true)
    }

    const handleEdit = (scale: Scale) => {
        setEditingScale(scale)
        setFormModalOpen(true)
    }

    const handleDelete = async (scale: Scale) => {
        if (confirm('Tem certeza que deseja excluir esta escala?')) {
            await deleteScale(scale.id)
        }
    }

    const handleFormSuccess = () => {
        refresh()
        setFormModalOpen(false)
        setEditingScale(undefined)
    }

    const handleExport = () => {
        try {
            exportScalesToCsv(filteredScales)
            toast.success('Exportação iniciada!')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao exportar')
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Escalas</h1>
                    <p className="text-muted-foreground">
                        {dateRange?.from ? (
                            dateRange.to ? (
                                `${format(dateRange.from, "dd 'de' MMM", { locale: ptBR })} - ${format(dateRange.to, "dd 'de' MMM, yyyy", { locale: ptBR })}`
                            ) : (
                                format(dateRange.from, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                            )
                        ) : (
                            'Selecione um período'
                        )}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredScales.length === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                    <SyncButton scales={filteredScales} />
                    <Button variant="outline" size="sm" onClick={() => setCsvModalOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Importar CSV
                    </Button>
                    <Button size="sm" onClick={handleNewScale}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Escala
                    </Button>
                </div>
            </div>

            {/* Totais do Mês */}
            {/* Totais do Mês */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total de Escalas</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.totalEscalas}</div>
                        <p className="text-xs text-muted-foreground">
                            No período selecionado
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.totalHoras}h</div>
                        <p className="text-xs text-muted-foreground">
                            Carga horária total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Valor Bruto</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ {totals.totalBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground">
                            Antes dos descontos
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-transparent">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Valor Líquido</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">R$ {totals.totalLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-green-600/80">
                            Valor estimado a receber
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Seletor de Período */}
                <DateRangePicker
                    date={dateRange}
                    setDate={setDateRange}
                />

                <Button
                    variant={showFilters ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                </Button>

                {showFilters && (
                    <>
                        <Select
                            value={filters.tipo || 'all'}
                            onValueChange={(value) =>
                                setFilters((f) => ({ ...f, tipo: value === 'all' ? undefined : (value as TipoEscala) }))
                            }
                        >
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="Ordinária">Ordinária</SelectItem>
                                <SelectItem value="Extra">Extra</SelectItem>
                            </SelectContent>
                        </Select>

                        <Input
                            placeholder="Filtrar por local..."
                            value={filters.local || ''}
                            onChange={(e) => setFilters((f) => ({ ...f, local: e.target.value || undefined }))}
                            className="w-48"
                        />

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilters({})}
                        >
                            Limpar
                        </Button>
                    </>
                )}
            </div>

            {/* Lista de Escalas */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredScales.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredScales.map((scale) => (
                        <ScaleCard
                            key={scale.id}
                            scale={scale}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                    <CalendarDays className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Nenhuma escala encontrada</h3>
                    <p className="text-muted-foreground">
                        Adicione escalas manualmente ou importe um arquivo CSV.
                    </p>
                    <Button className="mt-4" onClick={handleNewScale}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Escala
                    </Button>
                </div>
            )}

            {/* Modal de Criar/Editar Escala */}
            <ScaleFormModal
                open={formModalOpen}
                onOpenChange={setFormModalOpen}
                scale={editingScale}
                onSuccess={handleFormSuccess}
            />

            {/* Modal de Importação CSV */}
            <CsvImportDialog
                open={csvModalOpen}
                onOpenChange={setCsvModalOpen}
                onSuccess={refresh}
                existingScales={scales}
            />
        </div>
    )
}
