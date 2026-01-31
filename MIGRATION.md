# Status da Migração GSV Calendar Web

Este documento rastreia o progresso da migração do App Expo para Web (Next.js).

## 📅 Fases da Migração

### Fase 1: Setup do Projeto (Concluída ✅)
- [x] Criar projeto Next.js 15
- [x] Configurar TailwindCSS 4 (Instalado: `tailwindcss ^4`)
- [x] Instalar shadcn/ui (Componentes base instalados)
- [x] Configurar ESLint + Prettier
- [x] Criar estrutura de pastas + tipos + validators

### Fase 2: Supabase + Auth (Concluída ✅)
- [x] Criar projeto Supabase
- [x] Configurar Supabase Auth (Email/Password)
- [x] Criar middleware de proteção de rotas
- [x] Implementar páginas Login/Register

### Fase 3: Database (Concluída ✅)
- [x] Criar tabela scales no Supabase
- [x] Configurar Row Level Security (RLS)
- [x] Criar hooks de CRUD (`useScaleMutations`)

### Fase 4: UI Principal (Concluída ✅)
- [x] Layout com sidebar/header
- [x] Página de Escalas (Listagem e Cards)
- [x] Página de Relatórios (Gráficos e Totais)
- [x] Página de Perfil
- [x] Componentes Core (ScaleCard, Modal, etc)
- [x] Dark mode (`ThemeToggle` e `next-themes`)

### Fase 5: Features (Em Progresso 🚧)
- [x] Importação CSV (Com parser local de data)
- [x] Filtros básicos (por mês na listagem)
- [x] **Bugfix**: Correção de datas e Fuso Horário
- [x] **UX**: Presets de horário (24h/12h) no formulário
- [ ] Exportação CSV (Futuro)
- [ ] Filtros avançados por tipo (Futuro)

### Fase 6: Google Calendar (Pendente ⏳)
- [ ] OAuth via API Route
- [ ] Sincronização com calendário "GSV"

### Fase 7: Deploy (Pendente ⏳)
- [ ] Deploy na Vercel
- [ ] Configurar variáveis de ambiente de produção

## 📝 Notas de Versão
- **Current**: Foco em estabilização de bugs da Fase 5 e preparação para novas features.
