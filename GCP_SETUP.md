## 1. Ativação da API (Erro 403 "API disabled")

Se você ver um erro dizendo que a **Google Calendar API** está desativada, clique no link abaixo para ativá-la no seu projeto:

👉 [ATIVAR GOOGLE CALENDAR API](https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=34421392891)

Clique em **ENABLE** (Ativar) e aguarde alguns instantes.

## 2. Configuração de Testadores (Erro "App não verificado")

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Selecione o projeto do **GSV Calendar**.
3. No menu lateral, vá em **APIs e Serviços** > **Tela de permissão OAuth** (OAuth consent screen).
4. Role a página até encontrar a seção **Usuários de teste** (Test users).
5. Clique no botão **+ ADD USERS** (Adicionar usuários).
6. Digite o endereço de e-mail da conta Google que você está tentando logar (ex: `seu_email@gmail.com`).
7. Clique em **Salvar**.

> [!NOTE]
> Você pode adicionar sua própria conta e a de outros bombeiros que forem testar o sistema nesta fase.

## Por que isso acontece?
Para proteger usuários contra apps maliciosos, o Google exige um processo de verificação para apps públicos. Enquanto desenvolvemos, usamos o modo "Teste", que é restrito mas gratuito e imediato.

Após adicionar seu email, **tente fazer o login no GSV Calendar novamente**. O erro deve desaparecer.
