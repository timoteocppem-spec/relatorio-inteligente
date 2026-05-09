import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Relatório Inteligente · CPPEM',
  description: 'Registre suas atividades e gere relatórios profissionais com IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
