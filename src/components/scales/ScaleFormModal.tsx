'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import type { Scale, ScaleInput, TipoEscala } from '@/types'
import { useScaleMutations } from '@/hooks/useScaleMutations'
import { toast } from 'sonner'
import { formatLocalDate, parseLocalDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

/**
 * Props do componente ScaleFormModal
 */
interface ScaleFormModalProps {
    /** Se o modal está aberto */
    open: boolean
    /** Callback para fechar o modal */
    onOpenChange: (open: boolean) => void
    /** Escala para edição (undefined = criar nova) */
    scale?: Scale
    /** Callback após salvar com sucesso */
    onSuccess?: () => void
}

/**
 * Modal de formulário para criar/editar escalas
 * Usa validação local e hooks de mutação do Supabase
 */
export function ScaleFormModal({
    open,
    onOpenChange,
    scale,
    onSuccess,
}: ScaleFormModalProps) {
    const isEdit = !!scale
    const { createScale, updateScale, isSubmitting } = useScaleMutations(onSuccess)

    // Estados do formulário
    const [data, setData] = useState<Date | undefined>(undefined)
    const [tipo, setTipo] = useState<TipoEscala>('Ordinária')
    const [local, setLocal] = useState('')
    const [horaInicio, setHoraInicio] = useState('')
    const [horaFim, setHoraFim] = useState('')
    const [observacoes, setObservacoes] = useState('')
    const [operacao, setOperacao] = useState('')
    const [calendarOpen, setCalendarOpen] = useState(false)

    // Preencher formulário ao editar
    useEffect(() => {
        if (scale) {
            // FIX: Usar parser local para evitar shift de timezone
            // eslint-disable-next-line react-hooks/exhaustive-deps
            setData(parseLocalDate(scale.data))
            setTipo(scale.tipo)
            setLocal(scale.local)
            setHoraInicio(String(scale.horaInicio))
            setHoraFim(String(scale.horaFim))

            // Extrair Operação das observações
            const obs = scale.observacoes || ''
            const opMatch = obs.match(/Operação: (.*?)(?:\n|$)/)
            if (opMatch) {
                setOperacao(opMatch[1])
                // Remove a linha da operação para não duplicar visualmente
                setObservacoes(obs.replace(opMatch[0], '').trim())
            } else {
                setOperacao('')
                setObservacoes(obs)
            }
        } else if (open) { // Apenas resetar se estiver abrindo
            // Reset para criação
            if (!scale) {
                setData(undefined)
                setTipo('Ordinária')
                setLocal('')
                setHoraInicio('')
                setHoraFim('')
                setObservacoes('')
                setOperacao('')
            }
        }
    }, [scale, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validações básicas
        if (!data) {
            toast.error('Selecione uma data')
            return
        }
        if (!local.trim()) {
            toast.error('Informe o local')
            return
        }
        const horaInicioNum = parseInt(horaInicio)
        const horaFimNum = parseInt(horaFim)
        if (isNaN(horaInicioNum) || horaInicioNum < 0 || horaInicioNum > 23) {
            toast.error('Hora de início inválida (0-23)')
            return
        }
        if (isNaN(horaFimNum) || horaFimNum < 0 || horaFimNum > 23) {
            toast.error('Hora de fim inválida (0-23)')
            return
        }

        let finalObs = observacoes.trim()
        if (operacao.trim()) {
            finalObs = `Operação: ${operacao.trim()}\n${finalObs}`.trim()
        }

        const input: ScaleInput = {
            // FIX: Usar formatador local
            data: formatLocalDate(data),
            tipo,
            local: local.trim(),
            horaInicio: horaInicioNum,
            horaFim: horaFimNum,
            observacoes: finalObs || undefined,
        }

        let success: boolean
        if (isEdit) {
            success = await updateScale(scale.id, input)
        } else {
            success = await createScale(input)
        }

        if (success) {
            onOpenChange(false)
        }
    }

    // Gerar opções de hora (0-23)
    const horaOptions = Array.from({ length: 24 }, (_, i) => ({
        value: String(i),
        label: `${i.toString().padStart(2, '0')}:00`,
    }))

    // Presets de horário
    const applyPreset = (preset: '24h' | '12h_dia' | '12h_noite') => {
        switch (preset) {
            case '24h':
                setHoraInicio('8')
                setHoraFim('8')
                setTipo('Ordinária')
                break
            case '12h_dia':
                setHoraInicio('7')
                setHoraFim('19')
                setTipo('Extra')
                break
            case '12h_noite':
                setHoraInicio('19')
                setHoraFim('7')
                setTipo('Extra')
                break
        }
        toast.info(`Horário ${preset.replace('_', ' ')} aplicado`)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Editar Escala' : 'Nova Escala'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? 'Atualize os dados da escala abaixo.'
                            : 'Preencha os dados para criar uma nova escala.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Botões de Preset (Atalhos) */}
                    <div className="flex gap-2 mb-2 p-2 bg-muted/50 rounded-lg">
                        <div className="flex items-center text-xs text-muted-foreground mr-2">
                            <Clock className="w-3 h-3 mr-1" />
                            Atalhos:
                        </div>
                        <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => applyPreset('24h')}
                        >
                            24h (8-8)
                        </Badge>
                        <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => applyPreset('12h_dia')}
                        >
                            12h Dia (7-19)
                        </Badge>
                        <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => applyPreset('12h_noite')}
                        >
                            12h Noite (19-7)
                        </Badge>
                    </div>

                    {/* Data */}
                    <div className="space-y-2">
                        <Label>Data</Label>
                        <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                                onClick={() => setCalendarOpen(true)}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {data ? format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Selecionar data'}
                            </Button>
                            <DialogContent className="w-auto p-4">
                                <DialogHeader>
                                    <DialogTitle>Selecionar Data</DialogTitle>
                                </DialogHeader>
                                <Calendar
                                    mode="single"
                                    selected={data}
                                    onSelect={(date) => {
                                        setData(date)
                                        setCalendarOpen(false)
                                    }}
                                    initialFocus
                                />
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Tipo */}
                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoEscala)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Ordinária">Ordinária</SelectItem>
                                <SelectItem value="Extra">Extra</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Operação */}
                    <div className="space-y-2">
                        <Label htmlFor="operacao">Operação (Opcional)</Label>
                        <Input
                            id="operacao"
                            value={operacao}
                            onChange={(e) => setOperacao(e.target.value)}
                            placeholder="Ex: Operação Verão, Carnaval..."
                        />
                    </div>

                    {/* Local */}
                    <div className="space-y-2">
                        <Label htmlFor="local">Local</Label>
                        <Input
                            id="local"
                            value={local}
                            onChange={(e) => setLocal(e.target.value)}
                            placeholder="Ex: QCG, 1º GBM, 5º GBM..."
                        />
                    </div>

                    {/* Horários */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Hora Início</Label>
                            <Select value={horaInicio} onValueChange={setHoraInicio}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {horaOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Hora Fim</Label>
                            <Select value={horaFim} onValueChange={setHoraFim}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    {horaOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Observações */}
                    <div className="space-y-2">
                        <Label htmlFor="observacoes">Observações (opcional)</Label>
                        <Input
                            id="observacoes"
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Anotações adicionais..."
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : isEdit ? (
                                'Atualizar'
                            ) : (
                                'Criar Escala'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
