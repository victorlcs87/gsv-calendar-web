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
    const isAtiva = scale.ativa !== false // Default to true if undefined
    const motivo = scale.motivo_inatividade || 'Motivo não informado'

    return (
        <Card className={cn(
            "group overflow-hidden transition-all hover:shadow-lg",
            !isAtiva && "opacity-75 bg-muted/30 border-dashed"
        )}>
            <CardContent className="p-0">
                <div className="flex">
                    {/* Barra lateral colorida - Cinza se inativa */}
                    <div
                        className={cn(
                            'w-2 shrink-0',
                            !isAtiva ? 'bg-muted-foreground/30' :
                                isOrdinaria ? 'bg-primary' : 'bg-secondary'
                        )}
                    />

                    {/* Conteúdo */}
                    <div className="flex flex-1 flex-col gap-3 p-4">
                        {/* Badge de Inatividade */}
                        {!isAtiva && (
                            <div className="flex items-center gap-2 mb-1 p-2 rounded-md bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
                                <span className="font-bold">Não Realizado:</span>
                                <span>{motivo}</span>
                            </div>
                        )}

                        {/* Operação (Topo) - Só mostra se ativa ou se não tiver badge de inatividade para não poluir */}
                        {isAtiva && scale.observacoes?.match(/Operação: (.*?)(?:\n|$)/) && (
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
                            <Badge variant={!isAtiva ? 'outline' : isOrdinaria ? 'default' : 'secondary'}>
                                {scale.tipo}
                            </Badge>
                        </div>

                        {/* Info Grid */}
                        {/* Info Grid */}
                        <div className="flex flex-row justify-between items-center gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span className="truncate">{scale.local}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
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
                                <p className={cn(
                                    "text-lg font-bold",
                                    !isAtiva ? "text-muted-foreground line-through decoration-destructive/50" : "text-green-600"
                                )}>
                                    {scale.valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Bruto</p>
                                <p className={cn(
                                    "text-sm text-muted-foreground",
                                    !isAtiva && "line-through"
                                )}>
                                    {scale.valorBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
                        <div className="flex gap-2">
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
