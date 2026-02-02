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
                    <div className="flex flex-1 flex-col gap-2 p-3">
                        {/* Badge de Inatividade */}
                        {!isAtiva && (
                            <div className="flex items-center gap-2 mb-0.5 p-1.5 rounded-md bg-destructive/10 text-destructive text-xs font-medium border border-destructive/20">
                                <span className="font-bold">Não Realizado:</span>
                                <span>{motivo}</span>
                            </div>
                        )}

                        {/* Operação (Topo) */}
                        {isAtiva && scale.observacoes?.match(/Operação: (.*?)(?:\n|$)/) && (
                            <div className="flex items-start gap-2 mb-0.5 text-xs font-medium text-amber-600 bg-amber-50 p-1.5 rounded-md border border-amber-100 dark:bg-amber-950/30 dark:border-amber-900">
                                <span className="font-bold shrink-0">Operação:</span>
                                <span className="break-words">{scale.observacoes.match(/Operação: (.*?)(?:\n|$)/)?.[1]}</span>
                            </div>
                        )}

                        {/* Header: Data e Badge */}
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-base font-semibold text-foreground">{dataFormatada}</p>
                                <p className="text-xs capitalize text-muted-foreground">{diaSemana}</p>
                            </div>
                            <Badge variant={!isAtiva ? 'outline' : isOrdinaria ? 'default' : 'secondary'} className="h-5 text-xs px-2">
                                {scale.tipo}
                            </Badge>
                        </div>

                        {/* Info Grid */}
                        <div className="flex flex-row justify-between items-center gap-2 text-xs">
                            <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{scale.local}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                    {scale.horaInicio}h - {scale.horaFim}h ({scale.horas}h)
                                </span>
                            </div>
                        </div>

                        {/* Valores */}
                        <div className="flex items-center justify-between border-t pt-2 gap-2">
                            <div>
                                <p className="text-[10px] text-muted-foreground">Líquido</p>
                                <p className={cn(
                                    "text-base font-bold",
                                    !isAtiva ? "text-muted-foreground line-through decoration-destructive/50" : "text-green-600"
                                )}>
                                    {scale.valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-muted-foreground">Bruto</p>
                                <p className={cn(
                                    "text-xs text-muted-foreground",
                                    !isAtiva && "line-through"
                                )}>
                                    {scale.valorBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                        </div>

                        {/* Status de Sincronização */}
                        {scale.sincronizado && (
                            <div className="flex items-center gap-1 text-[10px] text-green-600 -mt-1">
                                <Calendar className="h-3 w-3" />
                                <span>Sincronizado</span>
                            </div>
                        )}

                        {/* Ações */}
                        <div className="flex gap-2 mt-1">
                            {onEdit && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-8 text-xs"
                                    onClick={() => onEdit(scale)}
                                >
                                    <Pencil className="mr-2 h-3 w-3" />
                                    Editar
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 px-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => onDelete(scale)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
