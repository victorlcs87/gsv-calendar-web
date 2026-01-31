'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle2, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { parseCsvFile, generateCsvTemplate, type CsvParseResult } from '@/lib/csvParser'
import { useScaleMutations } from '@/hooks/useScaleMutations'
import { toast } from 'sonner'

/**
 * Props do componente CsvImportDialog
 */
interface CsvImportDialogProps {
    /** Se o dialog está aberto */
    open: boolean
    /** Callback para fechar o dialog */
    onOpenChange: (open: boolean) => void
    /** Callback após importar com sucesso */
    onSuccess?: () => void
}

/**
 * Dialog para importação de escalas via CSV
 * Permite upload, preview e importação em massa
 */
export function CsvImportDialog({
    open,
    onOpenChange,
    onSuccess,
}: CsvImportDialogProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [parseResult, setParseResult] = useState<CsvParseResult | null>(null)
    const [isImporting, setIsImporting] = useState(false)

    const { createScale } = useScaleMutations()

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        if (!selectedFile.name.endsWith('.csv')) {
            toast.error('Selecione um arquivo CSV')
            return
        }

        setFile(selectedFile)
        const result = await parseCsvFile(selectedFile)
        setParseResult(result)
    }

    const handleImport = async () => {
        if (!parseResult || parseResult.data.length === 0) return

        setIsImporting(true)
        let successCount = 0
        let errorCount = 0

        for (const scale of parseResult.data) {
            const success = await createScale(scale)
            if (success) {
                successCount++
            } else {
                errorCount++
            }
        }

        setIsImporting(false)

        if (errorCount === 0) {
            toast.success(`${successCount} escalas importadas com sucesso!`)
            onSuccess?.()
            handleClose()
        } else {
            toast.warning(`${successCount} importadas, ${errorCount} erros`)
        }
    }

    const handleClose = () => {
        setFile(null)
        setParseResult(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        onOpenChange(false)
    }

    const handleDownloadTemplate = () => {
        const csv = generateCsvTemplate()
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'escalas_template.csv'
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Importar Escalas via CSV</DialogTitle>
                    <DialogDescription>
                        Faça upload de um arquivo CSV com suas escalas.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Upload Area */}
                    <div
                        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:border-primary"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        {file ? (
                            <>
                                <FileText className="h-10 w-10 text-primary" />
                                <p className="mt-2 font-medium">{file.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    Clique para trocar o arquivo
                                </p>
                            </>
                        ) : (
                            <>
                                <Upload className="h-10 w-10 text-muted-foreground" />
                                <p className="mt-2 font-medium">Clique para selecionar</p>
                                <p className="text-sm text-muted-foreground">
                                    ou arraste um arquivo CSV
                                </p>
                            </>
                        )}
                    </div>

                    {/* Parse Result */}
                    {parseResult && (
                        <div className="space-y-3">
                            {/* Summary */}
                            <div className="flex items-center gap-4">
                                {parseResult.data.length > 0 && (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-sm">
                                            {parseResult.data.length} escalas válidas
                                        </span>
                                    </div>
                                )}
                                {parseResult.errors.length > 0 && (
                                    <div className="flex items-center gap-2 text-destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <span className="text-sm">
                                            {parseResult.errors.length} erros
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Errors */}
                            {parseResult.errors.length > 0 && (
                                <div className="max-h-32 overflow-y-auto rounded-lg bg-destructive/10 p-3">
                                    <ul className="space-y-1 text-sm text-destructive">
                                        {parseResult.errors.slice(0, 5).map((error, i) => (
                                            <li key={i}>• {error}</li>
                                        ))}
                                        {parseResult.errors.length > 5 && (
                                            <li>... e mais {parseResult.errors.length - 5} erros</li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            {/* Preview */}
                            {parseResult.data.length > 0 && (
                                <div className="rounded-lg border p-3">
                                    <p className="mb-2 text-sm font-medium">Preview:</p>
                                    <div className="max-h-32 space-y-1 overflow-y-auto text-sm">
                                        {parseResult.data.slice(0, 3).map((scale, i) => (
                                            <p key={i} className="text-muted-foreground">
                                                {scale.data} - {scale.tipo} - {scale.local} ({scale.horaInicio}h-{scale.horaFim}h)
                                            </p>
                                        ))}
                                        {parseResult.data.length > 3 && (
                                            <p className="text-muted-foreground">
                                                ... e mais {parseResult.data.length - 3} escalas
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Template Download */}
                    <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={handleDownloadTemplate}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Baixar template CSV de exemplo
                    </Button>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={isImporting}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!parseResult || parseResult.data.length === 0 || isImporting}
                    >
                        {isImporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importando...
                            </>
                        ) : parseResult?.data.length ? (
                            `Importar ${parseResult.data.length} escalas`
                        ) : (
                            'Importar'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
