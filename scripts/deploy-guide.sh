#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Guia de Deploy GSV Calendar Web ===${NC}"
echo "Este script irá verificar se seu ambiente está pronto para deploy."

# 1. Verificar Node.js
echo -e "\n${YELLOW}[1/5] Verificando ambiente...${NC}"
if command -v node >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Node.js instalado: $(node -v)${NC}"
else
    echo -e "${RED}✗ Node.js não encontrado!${NC}"
    exit 1
fi

# 2. Verificar Lint e Build
echo -e "\n${YELLOW}[2/5] Executando verificações de qualidade (Lint & Build)...${NC}"
echo "Isso garante que não há erros bloqueantes."
npm run lint
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Lint passou!${NC}"
else
    echo -e "${RED}✗ Erro no Lint. Corrija antes de prosseguir.${NC}"
    exit 1
fi

npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build passou!${NC}"
else
    echo -e "${RED}✗ Erro no Build. Corrija antes de prosseguir.${NC}"
    exit 1
fi

# 3. Verificar Vercel CLI
echo -e "\n${YELLOW}[3/5] Verificando Vercel CLI...${NC}"
if command -v vercel >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Vercel CLI detectado!${NC}"
else
    echo -e "${YELLOW}⚠ Vercel CLI não encontrado.${NC}"
    echo "Você pode instalar globalmente com: npm i -g vercel"
    echo "Ou apenas fazer git push se já conectou o repositório no dashboard da Vercel."
fi

# 4. Checklist de Variáveis
echo -e "\n${YELLOW}[4/5] Checklist de Variáveis de Ambiente${NC}"
echo "Certifique-se de configurar as seguintes variáveis no painel da Vercel:"
echo "---------------------------------------------------"
cat .env.production.example
echo "---------------------------------------------------"
read -p "Pressione Enter quando tiver confirmado que tem essas chaves..."

# 5. Instruções Finais
echo -e "\n${GREEN}[5/5] Pronto para Deploy!${NC}"
echo "Opção A (Recomendada):"
echo "  1. Faça push para o GitHub: git push origin main"
echo "  2. A Vercel detectará automaticamente e iniciará o deploy."
echo ""
echo "Opção B (Manual via CLI):"
echo "  Execute: vercel deploy --prod"
echo ""
echo -e "${GREEN}Boa sorte! 🚀${NC}"
