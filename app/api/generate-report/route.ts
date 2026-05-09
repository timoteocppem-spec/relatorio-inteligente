import { NextRequest, NextResponse } from 'next/server'
import { generateLocalReport, ReportInput } from '@/lib/generateReport'

const SYSTEM_PROMPT = `Você é especialista em criar relatórios profissionais de atividades diárias em português brasileiro.

Regras:
- NÃO invente informações que o usuário não forneceu
- Melhore apenas a escrita e organização do que foi informado
- Use linguagem institucional, clara e objetiva
- Mantenha exatamente o formato solicitado`

function buildUserPrompt(data: ReportInput): string {
  return `Transforme as atividades abaixo em um relatório profissional com exatamente este formato:

RELATÓRIO DIÁRIO DE ATIVIDADES
════════════════════════════════════════════════════

Nome:    ${data.name}
Data:    ${data.date}
Setor:   ${data.sector}
Função:  ${data.role}

────────────────────────────────────────────────────
ATIVIDADES EXECUTADAS
────────────────────────────────────────────────────
[lista melhorada]

────────────────────────────────────────────────────
RESULTADOS ENTREGUES
────────────────────────────────────────────────────
[inferidos das atividades, sem inventar]

[Se houve uso de IA, adicione a seção abaixo — caso contrário omita:]
────────────────────────────────────────────────────
USO DE INTELIGÊNCIA ARTIFICIAL
────────────────────────────────────────────────────
[atividades com IA]

────────────────────────────────────────────────────
OBSERVAÇÕES GERAIS
────────────────────────────────────────────────────
[observações pertinentes]

════════════════════════════════════════════════════
Gerado por: Relatório Inteligente de Atividades · CPPEM

ATIVIDADES INFORMADAS:
${data.activities.map(a => `- ${a}`).join('\n')}`
}

export async function POST(req: NextRequest) {
  const data: ReportInput = await req.json()

  // Tenta OpenAI se a chave estiver configurada
  const openaiKey = process.env.OPENAI_API_KEY
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildUserPrompt(data) },
          ],
          max_tokens: 1200,
          temperature: 0.3,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        return NextResponse.json({
          report: json.choices[0].message.content.trim(),
          aiUsed: true,
        })
      }
    } catch {
      // Cai no fallback local abaixo
    }
  }

  // Tenta Anthropic se a chave estiver configurada
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1200,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: buildUserPrompt(data) }],
        }),
      })

      if (res.ok) {
        const json = await res.json()
        return NextResponse.json({
          report: json.content[0].text.trim(),
          aiUsed: true,
        })
      }
    } catch {
      // Cai no fallback local abaixo
    }
  }

  // Fallback: geração local sem IA
  return NextResponse.json({
    report: generateLocalReport(data),
    aiUsed: false,
  })
}
