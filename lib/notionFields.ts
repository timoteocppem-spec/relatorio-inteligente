// ================================================
// CONFIGURAÇÃO DOS CAMPOS DO NOTION
// Altere os valores (lado direito) para corresponder
// exatamente aos nomes das colunas no seu database.
// Os nomes são case-sensitive!
// ================================================

export const NOTION_FIELDS = {
  // Tipo: title (obrigatório — é o campo principal do Notion)
  nome: 'Nome',

  // Tipo: date
  data: 'Data',

  // Tipo: select ou rich_text
  setor: 'Setor',

  // Tipo: rich_text
  cargo: 'Cargo',

  // Tipo: rich_text
  atividades: 'Atividades do Dia',

  // Tipo: rich_text
  relatorio: 'Relatório Gerado',

  // Tipo: checkbox
  usoIA: 'Uso de IA',

  // Tipo: rich_text
  observacoes: 'Observações',

  // Tipo: date
  criadoEm: 'Criado em',
} as const
