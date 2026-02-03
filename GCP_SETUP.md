# ☁️ Guia de Produção: Google Cloud & OAuth

Como seu aplicativo usa o **Google Calendar API** com um escopo sensível (`.../auth/calendar`), o Google exige algumas etapas para que ele funcione sem limitações de "App Não Verificado" para outros usuários.

## 1. Status do App: "Testing" vs "Production"

Atualmente, seu app deve estar em modo **Testing** (Teste).
*   **Testing**: Apenas usuários pré-cadastrados (Test Users) na aba *OAuth Consent Screen* conseguem fazer login. O token expira em 7 dias.
*   **Production**: Qualquer usuário com conta Google pode tentar logar. Porém, se não verificado, verão uma tela de "Google hasn't verified this app".

Para migrar para produção:

## 2. Configurando a Tela de Consentimento (OAuth Consent Screen)

1.  Acesse o [Google Cloud Console](https://console.cloud.google.com/apis/credentials/consent).
2.  Clique em **PUBLISH APP** (Publicar App) para mudar o status de "Testing" para "In Production".
3.  O Google fará perguntas sobre o app.
    *   **App Verification**: Como você usa um escopo sensível (Calendar), o Google pedirá verificação para remover a tela de aviso.

### Se o uso for Pessoal ou Restrito (Uso Interno/Limitado)
Se você não quer passar pelo processo longo de verificação do Google (que exige vídeo demo, política de privacidade em URL real, domínio verificado), você tem duas opções:

*   **Opção A (Recomendada para uso próprio/pequeno time):** Mantenha em **Testing Mode**.
    *   Adicione os emails de quem vai usar em "Test Users".
    *   Desvantagem: O refresh token expira a cada 7 dias, exigindo re-login.

*   **Opção B (Publicar sem verificar):**
    *   Clique em "Publish App".
    *   Seus usuários verão a tela **"Google hasn't verified this app"**.
    *   Eles podem clicar em **Advanced > Go to GSV Calendar (unsafe)** para usar.
    *   Limite: 100 usuários.

## 3. Lista de Verificação para Produção Real (Validada)

Se decidir validar oficialmente (para remover avisos):

1.  **Domínios Autorizados**:
    *   Vá em *APIs & Services > Credentials*.
    *   No seu "OAuth 2.0 Client ID", adicione a URI de produção da Vercel (ex: `https://gsv-calendar.vercel.app`) em **Authorized JavaScript origins** e **Authorized redirect URIs** (com `/auth/callback` no final).
    *   Vá em *OAuth consent screen* e adicione `vercel.app` (ou seu domínio customizado) em **Authorized domains**.

2.  **Política de Privacidade**:
    *   Você precisa de uma URL pública com a Política de Privacidade.
    *   Pode criar uma página simples `/privacy` no seu app Next.js ou hospedar um TXT/PDF.

3.  **Vídeo de Demonstração no YouTube**:
    *   O Google exige um vídeo não-listado mostrando:
        *   O processo de login.
        *   O URL do navegador visível.
        *   Como o usuário concede permissão ao Calendário.
        *   Como o app cria/edita o evento (provando que você usa o escopo honestamente).

## 4. Variáveis de Ambiente na Vercel

Certifique-se de que na Vercel (Settings > Environment Variables) as chaves de **Produção** estejam corretas:

*   `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase.
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave pública.
*   `SUPABASE_SERVICE_ROLE_KEY`: (Se usar edge functions ou admin server-side).

*Lembre-se: O `PROVIDER_TOKEN` do Google é gerenciado pelo Supabase Auth, então a configuração principal é no painel do Supabase > Authentication > Providers > Google.*
