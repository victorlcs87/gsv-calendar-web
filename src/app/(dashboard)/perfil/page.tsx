'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Calendar, Shield, LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/layout'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { User as UserType } from '@supabase/supabase-js'

/**
 * Página de Perfil do Usuário
 * Exibe informações da conta e permite edição
 */
export default function PerfilPage() {
    const [user, setUser] = useState<UserType | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [nome, setNome] = useState('')

    useEffect(() => {
        async function loadUser() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                setNome(user.user_metadata?.nome || '')
            }
            setIsLoading(false)
        }
        loadUser()
    }, [])

    const handleSave = async () => {
        if (!user) return
        setIsSaving(true)

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({
                data: { nome },
            })

            if (error) {
                toast.error(error.message)
                return
            }

            toast.success('Perfil atualizado com sucesso!')
        } catch {
            toast.error('Erro ao atualizar perfil')
        } finally {
            setIsSaving(false)
        }
    }

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    if (isLoading) {
        return (
            <div className="flex min-h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
                    <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
                </div>
                <ThemeToggle />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Informações do Usuário */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Informações Pessoais
                        </CardTitle>
                        <CardDescription>Atualize seus dados de perfil</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nome">Nome</Label>
                            <Input
                                id="nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Seu nome"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={user?.email || ''}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
                        </div>

                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                'Salvar Alterações'
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Informações da Conta */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Conta
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                <Mail className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{user?.email}</p>
                                <p className="text-xs text-muted-foreground">Email verificado</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Membro desde</p>
                                <p className="text-xs text-muted-foreground">
                                    {user?.created_at
                                        ? new Date(user.created_at).toLocaleDateString('pt-BR')
                                        : 'N/A'}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <Button
                            variant="outline"
                            className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair da Conta
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
