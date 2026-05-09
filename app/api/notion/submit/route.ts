import { NextRequest, NextResponse } from 'next/server'
import { NOTION_FIELDS } from '@/lib/notionFields'

interface SubmitPayload {
  name:       string
  date:       string
  sector:     string
  role:       string
  activities: string[]
  report:     string
  aiUsed:     boolean
}

type NotionPropertyType = string

// Busca o schema do database e retorna um mapa nome → tipo
async function fetchSchema(
  token: string,
  databaseId: string,
): Promise<Record<string, NotionPropertyType> | null> {
  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
    headers: { Authorization: `Bearer ${token}`, 'Notion-Version': '2022-06-28' },
  })
  if (!res.ok) return null
  const data = await res.json()
  const schema: Record<string, NotionPropertyType> = {}
  for (const [key, val] of Object.entries(data.properties as Record<string, { type: string }>)) {
    schema[key] = val.type
  }
  return schema
}

// Constrói o valor correto para cada tipo de campo do Notion
function buildValue(type: NotionPropertyType, raw: string | boolean) {
  const str = String(raw).slice(0, 2000)
  switch (type) {
    case 'title':
      return { title: [{ text: { content: str } }] }
    case 'rich_text':
      return { rich_text: [{ text: { content: str } }] }
    case 'date':
      return { date: { start: str } }
    case 'checkbox':
      return { checkbox: Boolean(raw) }
    case 'select':
      return { select: { name: str } }
    case 'multi_select':
      return { multi_select: [{ name: str }] }
    case 'number':
      return { number: Number(raw) }
    case 'url':
      return { url: str }
    case 'email':
      return { email: str }
    case 'phone_number':
      return { phone_number: str }
    default:
      // fallback seguro para tipos não mapeados
      return { rich_text: [{ text: { content: str } }] }
  }
}

export async function POST(req: NextRequest) {
  const token      = process.env.NOTION_TOKEN
  const databaseId = process.env.NOTION_DATABASE_ID

  if (!token || !databaseId) {
    return NextResponse.json(
      { error: 'Notion não configurado. Adicione NOTION_TOKEN e NOTION_DATABASE_ID nas variáveis de ambiente.' },
      { status: 503 },
    )
  }

  let data: SubmitPayload
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  // Busca os tipos reais do database para montar os campos corretamente
  const schema = await fetchSchema(token, databaseId)

  if (!schema) {
    return NextResponse.json(
      { error: 'Não foi possível ler o database do Notion. Verifique o NOTION_DATABASE_ID e se a integração tem acesso ao database.' },
      { status: 502 },
    )
  }

  const activitiesText = data.activities.map(a => `• ${a}`).join('\n')

  // Mapa de campo → valor bruto
  const fieldValues: Record<string, string | boolean> = {
    [NOTION_FIELDS.nome]:       data.name       || 'Sem nome',
    [NOTION_FIELDS.data]:       data.date        || new Date().toISOString().split('T')[0],
    [NOTION_FIELDS.setor]:      data.sector      || '',
    [NOTION_FIELDS.cargo]:      data.role        || '',
    [NOTION_FIELDS.atividades]: activitiesText,
    [NOTION_FIELDS.relatorio]:  data.report      || '',
    [NOTION_FIELDS.usoIA]:      data.aiUsed      ?? false,
    [NOTION_FIELDS.criadoEm]:   new Date().toISOString(),
    [NOTION_FIELDS.observacoes]: '',
  }

  // Monta properties apenas com campos que existem no database
  const properties: Record<string, unknown> = {}
  for (const [fieldName, rawValue] of Object.entries(fieldValues)) {
    if (!fieldName) continue                    // campo vazio no notionFields.ts
    const type = schema[fieldName]
    if (!type) continue                         // campo não existe no database → ignora
    properties[fieldName] = buildValue(type, rawValue)
  }

  if (Object.keys(properties).length === 0) {
    return NextResponse.json(
      {
        error: 'Nenhum campo do notionFields.ts foi encontrado no database.',
        dica:  'Acesse /api/notion/test para ver os nomes reais dos campos e atualize lib/notionFields.ts.',
        camposConfigurados: Object.keys(fieldValues),
        camposNoDatabase:   Object.keys(schema),
      },
      { status: 422 },
    )
  }

  // Envia para o Notion
  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json(
      {
        error:         'Notion rejeitou a requisição.',
        notionMessage: (err as { message?: string }).message ?? '',
        notionCode:    (err as { code?: string }).code    ?? '',
        camposEnviados: Object.keys(properties),
        dica: 'Acesse /api/notion/test para conferir os nomes e tipos dos campos.',
      },
      { status: res.status },
    )
  }

  return NextResponse.json({ success: true, camposEnviados: Object.keys(properties) })
}
