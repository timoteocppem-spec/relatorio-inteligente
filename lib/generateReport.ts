export interface ReportInput {
  name: string
  date: string
  sector: string
  role: string
  activities: string[]
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const AI_KEYWORDS = ['ia', 'inteligência artificial', 'chatgpt', 'claude', 'gpt', 'copilot', 'ai']

function isAiActivity(text: string): boolean {
  return AI_KEYWORDS.some(k => text.toLowerCase().includes(k))
}

function buildBullets(items: string[]): string {
  return items.map(t => `• ${capitalize(t.replace(/^[-•]\s*/, '').trim())}`).join('\n')
}

export function generateLocalReport(data: ReportInput): string {
  const { name, date, sector, role, activities } = data

  const aiActivities = activities.filter(isAiActivity)
  const formattedDate = formatDate(date)
  const line = '─'.repeat(52)
  const title = '═'.repeat(52)

  const aiSection = aiActivities.length > 0
    ? `\n${line}\nUSO DE INTELIGÊNCIA ARTIFICIAL\n${line}\n${buildBullets(aiActivities)}\n`
    : ''

  return `RELATÓRIO DIÁRIO DE ATIVIDADES
${title}

Nome:    ${name || '—'}
Data:    ${formattedDate}
Setor:   ${sector || '—'}
Função:  ${role || '—'}

${line}
ATIVIDADES EXECUTADAS
${line}
${buildBullets(activities)}

${line}
RESULTADOS ENTREGUES
${line}
• Execução das atividades planejadas para a jornada.
• Manutenção da rotina operacional do setor ${sector || ''}.
• Demandas do dia atendidas conforme prioridade.
${aiSection}
${line}
OBSERVAÇÕES GERAIS
${line}
• Atividades concluídas dentro do período de trabalho.
• Disponível para alinhamentos adicionais quando necessário.

${title}
Gerado por: Relatório Inteligente de Atividades · CPPEM
Data/Hora: ${new Date().toLocaleString('pt-BR')}
`.trim()
}
