'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { loginSchema } from '@/lib/validators'
import { toast } from 'sonner'

/**
 * Página de Login
 * Autenticação via Supabase Auth
 */
export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    useEffect(() => {
        const checkUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                router.replace('/')
            }
        }
        checkUser()
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        // Validação com Zod
        const validation = loginSchema.safeParse({ email, password })
        if (!validation.success) {
            toast.error(validation.error.issues[0].message)
            setIsLoading(false)
            return
        }

        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                toast.error(error.message)
                return
            }

            toast.success('Login realizado com sucesso!')
            router.push('/')
        } catch {
            toast.error('Erro ao fazer login. Tente novamente.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-accent to-background p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center">
                        <Image
                            src="/gsv-logo.png"
                            alt="GSV Logo"
                            width={96}
                            height={96}
                            className="object-contain" // Garante que o logo não distorça
                            priority
                        />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-primary">GSV Calendar</CardTitle>
                        <CardDescription>Entre para gerenciar suas escalas</CardDescription>
                    </div>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                'Entrar'
                            )}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                            Não tem conta?{' '}
                            <Link href="/register" className="font-medium text-primary hover:underline">
                                Cadastre-se
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
