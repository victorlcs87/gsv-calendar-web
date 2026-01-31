# GSV Calendar Web

Versão Web do aplicativo de gerenciamento de escalas para bombeiros. Desenvolvido com **Next.js 15**, **Supabase** e **TailwindCSS 4**.

Este projeto visa oferecer uma experiência desktop e mobile responsiva para gestão de serviços voluntários, com funcionalidades de importação, relatórios financeiros e backup em nuvem.

## 🚀 Funcionalidades

- **Autenticação Segura**: Login e Cadastro via Email/Senha (Supabase Auth).
- **Gestão de Escalas**:
  - ✨ **Dashboard**: Visão geral com totais e lista filtrável.
  - 📝 **CRUD Completo**: Adicionar, editar e excluir serviços.
  - 📥 **Importação CSV**: Leitura automática de arquivos do Sigmanet.
  - 📤 **Exportação CSV**: Download compatível com Outlook/Google Calendar.
- **Financeiro**: Cálculo automático de valores Bruto e Líquido.
- **Interface Moderna**:
  - 🌓 Dark Mode nativo.
  - 📱 Layout 100% responsivo.
  - ⚡ Atalhos rápidos para preenchimento de horas (24h/12h).

## 🛠️ Stack Tecnológica

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Linguagem**: TypeScript
- **Estilização**: TailwindCSS v4 + [shadcn/ui](https://ui.shadcn.com/)
- **Backend/Banco**: Supabase (PostgreSQL + RLS)
- **Ícones**: Lucide React
- **Datas**: date-fns (com parser local para evitar issues de timezone)

## 🏃‍♂️ Como Rodar o Projeto

### Pré-requisitos
- Node.js 20+ (LTS)
- npm ou yarn
- Conta no [Supabase](https://supabase.com/) (para backend)

### Configuração do Ambiente

1. Clone o repositório:
```bash
git clone https://github.com/victorlcs87/gsv-calendar-web.git
cd gsv-calendar-web
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env.local` na raiz com suas chaves do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key_aqui
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## 📂 Estrutura de Pastas

- `src/app`: Rotas e páginas (App Router).
  - `(auth)`: Rotas públicas (Login/Register).
  - `(dashboard)`: Rotas protegidas (Home, Relatórios, Perfil).
- `src/components`: Componentes reutilizáveis (UI) e de negócio (Scales).
- `src/lib`: Utilitários (Formatadores, Parsers CSV, Exportação).
- `src/hooks`: Hooks customizados (Gestão de estado com Supabase).
- `src/types`: Definições globais de TypeScript.

## 📚 Documentação do Projeto

- [MIGRATION.md](./MIGRATION.md): Status da migração do app Mobile para Web.

## 🤝 Contribuição

Projeto interno para gestão de escalas. Pull Requests são bem-vindos para correções de bugs e melhorias de performance.
