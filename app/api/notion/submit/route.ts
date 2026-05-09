import { NextRequest, NextResponse } from 'next/server'
import { NOTION_FIELDS } from '@/lib/notionFields'

interface SubmitPayload {
  name: string
  date: string
  sector: string
  role: string
  activities: string[]
  report: string
  aiUsed: boolean
}

function richText(content: string) {
  // Notion limita rich_text a 2000 chars por bloco
  return [{ text: { content: content.slice(0, 2000) } }]
}

export async function POST(req: NextRequest) {
  const token = process.env.NOTION_TOKEN
  const databaseId = process.env.NOTION_DATABASE_ID

  if (!token || !databaseId) {
    return NextResponse.json(
      { error: 'Notion não configurado. Adicione NOTION_TOKEN e NOTION_DATABASE_ID no .env.local' },
      { status: 503 }
    )
  }

  let data: SubmitPayload
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const activitiesText = data.activities.map(a => `• ${a}`).join('\n')

  const properties: Record<string, unknown> = {
    [NOTION_FIELDS.nome]: {
      title: richText(data.name || 'Sem nome'),
    },
    [NOTION_FIELDS.data]: {
      date: { start: data.date || new Date().toISOString().split('T')[0] },
    },
    [NOTION_FIELDS.setor]: {
      // Se o campo for "select" no Notion, troque por: select: { name: data.sector }
      rich_text: richText(data.sector || ''),
    },
    [NOTION_FIELDS.cargo]: {
      rich_text: richText(data.role || ''),
    },
    [NOTION_FIELDS.atividades]: {
      rich_text: richText(activitiesText),
    },
    [NOTION_FIELDS.relatorio]: {
      rich_text: richText(data.report || ''),
    },
    [NOTION_FIELDS.usoIA]: {
      checkbox: data.aiUsed ?? false,
    },
    [NOTION_FIELDS.criadoEm]: {
      date: { start: new Date().toISOString() },
    },
  }

  try {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[Notion] Erro:', err)
      return NextResponse.json(
        { error: 'Erro ao criar página no Notion', details: err },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[Notion] Falha de conexão:', e)
    return NextResponse.json({ error: 'Falha de conexão com o Notion' }, { status: 500 })
  }
}
