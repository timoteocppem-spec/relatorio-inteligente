# Relatório Inteligente de Atividades — CPPEM

Sistema interno para registro de atividades diárias com geração de relatórios profissionais via IA.

## Rodando localmente

```bash
cd relatorio-inteligente
npm install
npm run dev
```

Acesse: http://localhost:3000

## Configurando a IA (opcional)

Crie um arquivo `.env.local` na raiz:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# OU Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...
```

Sem chave, o sistema usa geração local com formatação básica.

## Deploy na Vercel

```bash
npx vercel --prod
```

Ou conecte o repositório GitHub no painel da Vercel em vercel.com.

## Extensão Chrome

1. Abra `chrome://extensions`
2. Ative "Modo do desenvolvedor"
3. Clique "Carregar sem compactação"
4. Selecione a pasta `extension/`
5. Edite `extension/popup.js` e troque `SEU-PROJETO.vercel.app` pela URL real

## Estrutura

```
app/
  page.tsx                   — Página principal (chat + relatório)
  layout.tsx                 — Layout raiz
  globals.css                — Estilos globais
  api/generate-report/
    route.ts                 — API de geração (OpenAI / Anthropic / local)
lib/
  generateReport.ts          — Gerador local de relatório (sem IA)
extension/
  manifest.json              — Manifesto V3
  popup.html / .css / .js    — Interface do popup
```
