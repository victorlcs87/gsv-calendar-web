import { DashboardLayout } from '@/components/layout'

/**
 * Layout do grupo de rotas do dashboard
 * Aplica sidebar e estrutura comum a todas as páginas autenticadas
 */
export default function DashboardGroupLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <DashboardLayout>{children}</DashboardLayout>
}
