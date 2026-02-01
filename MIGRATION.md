# Status da Migração GSV Calendar Web

Este documento rastreia o progresso da migração do App Expo para Web (Next.js).
O objetivo é garantir paridade de recursos com o projeto mobile original (`gsv-calendar-gemini`) mantendo as melhores práticas de desenvolvimento web.

## 📅 Fases da Migração

### Fase 1: Setup do Projeto (Concluída ✅)
- [x] Criar projeto Next.js 15
- [x] Configurar TailwindCSS 4 (Instalado: `tailwindcss ^4`)
- [x] Instalar shadcn/ui (Componentes base instalados)
- [x] Configurar ESLint + Prettier
- [x] Criar estrutura de pastas + tipos + validators
- [x] **Segurança**: Configurar variáveis de ambiente seguras

### Fase 2: Supabase + Auth (Concluída ✅)
- [x] Criar projeto Supabase
- [x] Configurar Supabase Auth (Email/Password)
- [x] **Segurança**: Middleware para proteção de rotas (Redirecionamento server-side)
- [x] Implementar páginas Login/Register (Com validação e feedback visual)

### Fase 3: Database (Concluída ✅)
- [x] Criar tabela scales no Supabase
- [x] **Segurança**: Configurar Row Level Security (RLS) - Dados isolados por usuário
- [x] Criar hooks de CRUD (`useScaleMutations`) com tratamento de erro sanitizado
- [x] **Clean Code**: Separação de responsabilidades (Hooks vs UI)

### Fase 4: UI Principal (Concluída ✅)
- [x] Layout Responsivo (Sidebar/Header adaptáveis)
- [x] Página de Escalas (Listagem com Cards detalhados)
- [x] Página de Relatórios (Gráficos e Totais calculados em tempo real)
- [x] Página de Perfil (Visualização segura de dados)
- [x] Componentes Core (ScaleCard, Modal, etc) com acessibilidade (Radix UI)
- [x] Dark mode (`ThemeToggle`)

### Fase 5: Features de Dados (Em Progresso 🚧)
- [x] Importação CSV (Com parser local de data `parseLocalDate`)
### Fase 5: Features de Dados (Concluída ✅)
- [x] Importação CSV (Com parser local de data `parseLocalDate`)
    - *Suporte*: Formato manual e nativo do Sigmanet (`datIniVagas`, `nomTurno`).
- [x] Filtros básicos (por mês na listagem)
- [x] **Bugfix**: Correção de datas e Fuso Horário (Local Time vs UTC)
- [x] **UX**: Presets de horário (24h/12h) no formulário
- [x] **Exportação CSV** (Concluída ✅)
    - *Features*: Download via Blob, formato compatível (Subject/Location/etc), Codificação UTF-8 com BOM.
- [x] **Filtros Avançados**: Filtragem combinada por Tipo (Ordinária/Extra) e Local.
- [x] **Deduplicação Inteligente**: Ignora escalas duplicadas na importação.
    - *Correção*: Sincronização de estado consertada para permitir reimportação após exclusão.
- [x] **Refinamentos de Operação (Pós-MVP)**:
    - [x] **Campo "Operação"**: Input dedicado no formulário (Label + Parser Automático).
    - [x] **Display**: Badge de Operação destacado no Card da Escala.
    - [x] **Lógica de Pernoite**: Formulário aceita hora fim < inicio como "virada de dia".
    - [x] **Analytics**: Novo gráfico "Ranking por Operação" substituindo o ranking genérico por Tipo.

### Fase 6: Integração de Calendário (Concluída ✅)
- [x] **Configuração GCP**: Credenciais OAuth criadas e configuradas.
- [x] **Autenticação**: Login com Google via Supabase Auth funcional.
- [x] **UI**: Botão de Sincronização implementado.
- [x] **Sincronização**:
    - [x] Permitir nome personalizado para o calendário (Padrão: "GSV Calendar").
    - [x] Lógica para criar eventos no Google Calendar.
    - [x] Atualizar status de sincronização no banco de dados.

### Fase 7: Deploy e Finalização (Pendente ⏳)

- [ ] OAuth com Google (NextAuth ou Supabase Auth Provider)
- [ ] Sincronização Bidirecional ou Unidirecional (Push para GCal)

### Fase 7: Deploy e CI/CD (Pendente ⏳)
- [ ] Configuração do Vercel
- [ ] Variáveis de Ambiente de Produção
- [ ] Pipeline de verificação (Lint/Build no PR)

## � Comparativo Mobile vs Web

| Feature | Mobile (Expo) | Web (Next.js) | Status Web |
|---------|---------------|---------------|------------|
| **Auth** | Supabase/Context | Supabase/Middleware | ✅ Igual |
| **Banco** | Supabase | Supabase + RLS | ✅ Melhor (RLS) |
| **Import** | CSV (Expo FS) | CSV (DOM File API) | ✅ Igual |
| **Export** | CSV (Sharing) | CSV (Blob Download) | ⏳ A Fazer |
| **Calendar** | Nativo (iOS/Android) | OAuth/API (Google) | ⏳ A Fazer |
| **Relatórios** | Cards + Charts | Cards + Charts Interativos | ✅ Melhor |
| **Filtros** | Custom Hooks | Server/Client State | 🚧 Parcial |

## 📝 Padrões Implementados

- **Arquitetura**: Next.js App Router (React Server Components por padrão).
- **Estilização**: Tailwind v4 + Variáveis CSS otimizadas.
- **Gerenciamento de Estado**: React Query (via Supabase Hooks) ou Server Actions.
- **Tipagem**: TypeScript estrito em todo o projeto.
