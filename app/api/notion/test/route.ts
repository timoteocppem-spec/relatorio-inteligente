import { NextResponse } from 'next/server'

// GET /api/notion/test
// Retorna o schema real do database para diagnóstico
// Acesse via browser: /api/notion/test
export async function GET() {
  const token      = process.env.NOTION_TOKEN
  const databaseId = process.env.NOTION_DATABASE_ID

  if (!token || !databaseId) {
    return NextResponse.json({
      ok: false,
      problema: 'Variáveis de ambiente ausentes',
      NOTION_TOKEN:       token      ? '✓ configurado' : '✗ FALTANDO',
      NOTION_DATABASE_ID: databaseId ? '✓ configurado' : '✗ FALTANDO',
    }, { status: 503 })
  }

  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
    },
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json({
      ok: false,
      httpStatus: res.status,
      notionCode:    data.code,
      notionMessage: data.message,
      dica: data.code === 'object_not_found'
        ? 'Database não encontrado. Verifique o NOTION_DATABASE_ID e certifique-se de que a integração foi convidada para o database.'
        : data.code === 'unauthorized'
        ? 'Token inválido. Verifique o NOTION_TOKEN.'
        : '',
    }, { status: res.status })
  }

  // Retorna os campos reais do database — use para ajustar lib/notionFields.ts
  const campos = Object.entries(data.properties as Record<string, { type: string }>)
    .map(([nome, prop]) => ({ nome, tipo: prop.type }))
    .sort((a, b) => a.nome.localeCompare(b.nome))

  return NextResponse.json({
    ok: true,
    titulo: data.title?.[0]?.plain_text ?? '(sem título)',
    totalCampos: campos.length,
    campos,
    instrucao: 'Copie os nomes da coluna "nome" para lib/notionFields.ts e os tipos para o submit route.',
  })
}
