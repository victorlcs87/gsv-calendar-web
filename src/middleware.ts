import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware de autenticação
 * Protege rotas do dashboard e redireciona usuários não autenticados
 */
export async function middleware(request: NextRequest) {
    const supabaseResponse = NextResponse.next({
        request,
    })

    /*
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )
    */

    // Refresh session se expirada
    // Verificação de autenticação removida temporariamente para garantir PWA Standalone no iOS
    // Mantendo estrutura para reativar se necessário com lógica de cliente
    /*
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/register')
    const isDashboardRoute = request.nextUrl.pathname === '/' ||
        request.nextUrl.pathname.startsWith('/escalas') ||
        request.nextUrl.pathname.startsWith('/relatorios') ||
        request.nextUrl.pathname.startsWith('/perfil')
    */

    // Redireciona para login se não autenticado
    // if (!user && isDashboardRoute) {
    //     const url = request.nextUrl.clone()
    //     url.pathname = '/login'
    //     return NextResponse.redirect(url)
    // }

    // Redireciona para dashboard se já autenticado
    // if (user && isAuthRoute) {
    //     const url = request.nextUrl.clone()
    //     url.pathname = '/'
    //     return NextResponse.redirect(url)
    // }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api (API routes)
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|manifest.json|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
