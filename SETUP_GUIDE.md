# 🔄 Guia de Restauração de Ambiente (Disaster Recovery)

Este documento explica passo a passo como colocar o projeto **GSV Calendar Web** para rodar em uma máquina totalmente nova (recém-formatada ou outro computador).

---

## ⚠️ MUITO IMPORTANTE: Backup das Chaves
O arquivo `.env.local` contém as senhas de acesso ao banco de dados e **NÃO É SALVO NO GITHUB** por segurança.

**Antes de formatar seu computador atual, você DEVE salvar o conteúdo deste arquivo em um local seguro** (Gerenciador de Senhas, Google Drive seguro, Pen drive, etc).

As chaves que você precisa salvar são:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
*(Se você perder essas chaves, poderá encontrá-las novamente apenas logando no painel do Supabase.com > Project Settings > API).*

> **Nota sobre Google Cloud:**
> As credenciais do Google (Client ID e Secret) ficam configuradas **dentro do painel do Supabase** (Authentication > Providers > Google).
> O código do site não precisa delas no `.env.local` para rodar, pois o Supabase gerencia o login.
> 
> **Recomendação:** Mesmo assim, **faça um backup** desses dados do Google Cloud Console em suas notas seguras, caso precise reconfigurar o projeto do zero no futuro.

---

## 🛠️ Passo a Passo na Nova Máquina

### 1. Instalar Pré-requisitos
Antes de baixar o projeto, instale os softwares básicos:

1.  **Node.js (LTS)**:
    *   Baixe e instale a versão "LTS" (Long Term Support) do site oficial: [nodejs.org](https://nodejs.org/).
    *   Para verificar se instalou, abra o terminal e digite: `node -v` (deve aparecer v20 ou superior).
2.  **Git**:
    *   Baixe e instale o Git: [git-scm.com](https://git-scm.com/).
3.  **VS Code** (Opcional, mas recomendado):
    *   Editor de código: [code.visualstudio.com](https://code.visualstudio.com/).

### 2. Baixar o Projeto (Clone)
Abra o terminal (ou Prompt de Comando) na pasta onde deseja salvar o projeto e digite:

```bash
git clone https://github.com/victorlcs87/gsv-calendar-web.git
cd gsv-calendar-web
```

### 3. Instalar Dependências
Agora, vamos baixar as bibliotecas do projeto (a pasta `node_modules` que não vai para o Git):

```bash
npm install
```
*(Isso pode levar alguns minutos dependendo da internet).*

### 4. Restaurar os Segredos (.env.local)
1.  Na raiz do projeto, crie um arquivo novo chamado `.env.local`.
2.  Cole dentro dele as chaves que você salvou no passo de Backup (início deste guia).
    
    Exemplo do conteúdo:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6Ikqc...
    ```

### 5. Rodar o Projeto
No terminal, execute:

```bash
npm run dev
```

Se tudo estiver certo, o terminal mostrará:
> Ready in ...
> - Local: http://localhost:3000

Abra **http://localhost:3000** no navegador e use o app! 🚀

---

## ❓ Problemas Comuns

*   **Erro "Command not found: npm"**: Você esqueceu de instalar o Node.js.
*   **App carrega mas não faz login**: O arquivo `.env.local` está faltando ou as chaves estão incorretas.
*   **Erro de Permissão no Git**: Você precisa logar no GitHub na nova máquina (`git config --global user.email "seu@email.com"`).
