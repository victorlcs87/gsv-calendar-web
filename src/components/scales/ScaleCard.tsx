import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock, MapPin, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Scale } from '@/types'
import { cn, parseLocalDate } from '@/lib/utils'

/**
 * Props do ScaleCard
 */
interface ScaleCardProps {
    scale: Scale
    onEdit?: (scale: Scale) => void
    onDelete?: (scale: Scale) => void
}

/**
 * Card de exibição de uma escala
 * Mostra data, local, horas e valores com ações de editar/excluir
 */
export function ScaleCard({ scale, onEdit, onDelete }: ScaleCardProps) {
    // FIX: Usar parseLocalDate para evitar problemas de timezone
    const dataFormatada = format(parseLocalDate(scale.data), "dd 'de' MMMM", { locale: ptBR })
    const diaSemana = format(parseLocalDate(scale.data), 'EEEE', { locale: ptBR })
    const isOrdinaria = scale.tipo === 'Ordinária'

    return (
        <Card className="group overflow-hidden transition-all hover:shadow-lg">
            <CardContent className="p-0">
                <div className="flex">
                    {/* Barra lateral colorida */}
                    <div
                        className={cn(
                            'w-2 shrink-0',
                            isOrdinaria ? 'bg-primary' : 'bg-secondary'
                        )}
                    />

                    {/* Conteúdo */}
                    <div className="flex flex-1 flex-col gap-3 p-4">
                        {/* Operação (Topo) */}
                        {scale.observacoes?.match(/Operação: (.*?)(?:\n|$)/) && (
                            <div className="flex items-start gap-2 mb-1 text-sm font-medium text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-100 dark:bg-amber-950/30 dark:border-amber-900">
                                <span className="font-bold shrink-0">Operação:</span>
                                <span className="break-words">{scale.observacoes.match(/Operação: (.*?)(?:\n|$)/)?.[1]}</span>
                            </div>
                        )}

                        {/* Header: Data e Badge */}
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-lg font-semibold text-foreground">{dataFormatada}</p>
                                <p className="text-sm capitalize text-muted-foreground">{diaSemana}</p>
                            </div>
                            <Badge variant={isOrdinaria ? 'default' : 'secondary'}>
                                {scale.tipo}
                            </Badge>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span className="truncate">{scale.local}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4 shrink-0" />
                                <span>
                                    {scale.horaInicio}h - {scale.horaFim}h ({scale.horas}h)
                                </span>
                            </div>
                        </div>



                        {/* Valores */}
                        <div className="flex items-center justify-between border-t pt-3">
                            <div>
                                <p className="text-xs text-muted-foreground">Valor Líquido</p>
                                <p className="text-lg font-bold text-primary">
                                    R$ {scale.valorLiquido.toFixed(2)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Bruto</p>
                                <p className="text-sm text-muted-foreground">
                                    R$ {scale.valorBruto.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Status de Sincronização */}
                        {scale.sincronizado && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                                <Calendar className="h-3 w-3" />
                                <span>Sincronizado com Google Calendar</span>
                                {scale.calendar_event_id && (
                                    <ExternalLink className="h-3 w-3" />
                                )}
                            </div>
                        )}

                        {/* Ações */}
                        <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            {onEdit && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => onEdit(scale)}
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => onDelete(scale)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
