'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/* ─── TIPOS ─── */
interface FormData { name: string; date: string; sector: string; role: string }
interface Activity  { id: string; text: string }
type NotionStatus = 'idle' | 'sending' | 'success' | 'error'

/* ─── SETORES ─── */
const SECTORS = [
  { id: 1, emoji: '💼', short: 'Comercial / Vendas',          name: 'Comercial / Vendas e Atendimento',         desc: 'Vendas, atendimento de leads, follow-up, negociação, matrículas e relacionamento com clientes.' },
  { id: 2, emoji: '📣', short: 'Marketing / Tráfego',         name: 'Marketing / Conteúdo e Tráfego',            desc: 'Redes sociais, criativos, vídeos, campanhas, anúncios, tráfego pago, copywriting e divulgação.' },
  { id: 3, emoji: '📚', short: 'Pedagógico / Mentoria',       name: 'Pedagógico / Aulas, Materiais e Mentoria',  desc: 'Aulas, materiais, simulados, correções, mentorias, acompanhamento de alunos e coordenação pedagógica.' },
  { id: 4, emoji: '🏫', short: 'Colégio CPPEM',               name: 'Colégio CPPEM / Rotina Escolar',            desc: 'Rotina escolar, atendimento aos pais, secretaria, coordenação, alunos e demandas internas do colégio.' },
  { id: 5, emoji: '👥', short: 'RH / Pessoas',                name: 'Recursos Humanos / Contratação e Pessoas',  desc: 'Seleção, contratação, treinamento, integração, equipe, cultura e gestão de pessoas.' },
  { id: 6, emoji: '⚙️', short: 'Tecnologia / Sistemas',       name: 'Tecnologia / Sistemas, Sites e Automações', desc: 'Sistemas, sites, landing pages, automações, integrações, suporte técnico, ferramentas digitais e IA.' },
  { id: 7, emoji: '💰', short: 'Financeiro / Cobrança',       name: 'Financeiro / Cobrança e Controle',          desc: 'Pagamentos, cobranças, inadimplência, notas, controle financeiro, conciliações e relatórios financeiros.' },
  { id: 8, emoji: '🔧', short: 'Serviços Gerais / Apoio',     name: 'Serviços Gerais / Operacional e Apoio',     desc: 'Organização, manutenção, limpeza, estrutura física, apoio interno e demandas operacionais.' },
]

const EXAMPLES = [
  'Atendi leads no WhatsApp',
  'Fiz follow-up com clientes em negociação',
  'Usei IA para criar mensagens comerciais',
  'Organizei a planilha de acompanhamento',
  'Participei de reunião de alinhamento',
]

const STORAGE_KEY = 'ri-draft-v1'
function today() { return new Date().toISOString().split('T')[0] }

/* ─── COMPONENTE PRINCIPAL ─── */
export default function Home() {
  const [form, setForm]               = useState<FormData>({ name: '', date: today(), sector: '', role: '' })
  const [activities, setActivities]   = useState<Activity[]>([])
  const [input, setInput]             = useState('')
  const [report, setReport]           = useState('')
  const [aiUsed, setAiUsed]           = useState(false)
  const [loading, setLoading]         = useState(false)
  const [copied, setCopied]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [sectorOpen, setSectorOpen]   = useState(false)
  const [notionStatus, setNotionStatus] = useState<NotionStatus>('idle')

  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  /* localStorage restore */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const { form: f, activities: a } = JSON.parse(raw)
      if (f) setForm(f)
      if (a) setActivities(a)
    } catch {}
  }, [])

  /* auto-scroll chat */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activities])

  /* close sector dropdown on outside click */
  useEffect(() => {
    const close = () => setSectorOpen(false)
    if (sectorOpen) document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [sectorOpen])

  /* ─── AÇÕES ─── */
  const addActivity = useCallback(() => {
    const text = input.trim().replace(/^[-•]\s*/, '')
    if (!text) return
    const next: Activity = { id: `${Date.now()}-${Math.random()}`, text }
    setActivities(prev => {
      const updated = [...prev, next]
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ form, activities: updated }))
      return updated
    })
    setInput('')
    inputRef.current?.focus()
  }, [input, form])

  const removeActivity = (id: string) =>
    setActivities(prev => {
      const updated = prev.filter(a => a.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ form, activities: updated }))
      return updated
    })

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addActivity() }
  }

  const generateReport = async () => {
    if (activities.length === 0) return
    setLoading(true)
    setReport('')
    try {
      const res  = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, activities: activities.map(a => a.text) }),
      })
      const data = await res.json()
      setReport(data.report)
      setAiUsed(data.aiUsed ?? false)
    } catch {
      setReport('Erro ao gerar relatório. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const copyReport = async () => {
    if (!report) return
    await navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const saveDraft = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ form, activities }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const downloadReport = () => {
    if (!report) return
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `relatorio-${(form.name || 'sem-nome').replace(/\s+/g, '-')}-${form.date}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearAll = () => {
    if (!confirm('Limpar todos os campos e atividades?')) return
    setForm({ name: '', date: today(), sector: '', role: '' })
    setActivities([])
    setReport('')
    setInput('')
    localStorage.removeItem(STORAGE_KEY)
  }

  const sendToNotion = async () => {
    setNotionStatus('sending')
    try {
      const res = await fetch('/api/notion/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, activities: activities.map(a => a.text), report, aiUsed }),
      })
      setNotionStatus(res.ok ? 'success' : 'error')
    } catch {
      setNotionStatus('error')
    }
    setTimeout(() => setNotionStatus('idle'), 6000)
  }

  /* ─── HELPERS ─── */
  const selectedSector = SECTORS.find(s => s.name === form.sector)

  /* ─── RENDER ─── */
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">

      {/* ════════ HEADER ════════ */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050505]/95 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-5 py-0">
          <div className="flex items-center justify-between h-16">

            {/* Logo + título */}
            <div className="flex items-center gap-4">
              {/*
                LOGO CPPEM
                Troque o src abaixo pelo link RAW da logo real:
                Ex: src="https://raw.githubusercontent.com/SEU_USER/SEU_REPO/main/logo.png"
                Ou coloque o arquivo em /public/img/logo-cppem.png
              */}
              <img
                src="/img/logo-cppem.svg"
                alt="CPPEM"
                className="h-8 w-auto object-contain hidden sm:block"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
              <div className="w-px h-8 bg-white/5 hidden sm:block" />
              <div>
                <p className="text-[#00ff66] font-black text-sm tracking-widest uppercase leading-none">
                  Relatório Inteligente CPPEM
                </p>
                <p className="text-gray-500 text-[10px] tracking-wide mt-0.5">
                  Registro diário de atividades com apoio de IA
                </p>
              </div>
            </div>

            {/* Data + status */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600 hidden md:block">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <div className="flex items-center gap-1.5 bg-[#111827] border border-[#00ff66]/20 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 bg-[#00ff66] rounded-full animate-pulse" />
                <span className="text-[#00ff66] text-[10px] font-black tracking-widest">ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ════════ MAIN ════════ */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-5 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">

          {/* ══ PAINEL ESQUERDO ══ */}
          <aside className="space-y-4">

            {/* Identificação */}
            <div className="bg-[#111827] rounded-2xl border border-white/5 p-5">
              <p className="text-[#00ff66] text-[10px] font-black tracking-widest uppercase mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-[#00ff66] rounded-full" />
                Identificação
              </p>
              <div className="space-y-3">

                {/* Nome */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block tracking-wider uppercase">Nome completo</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Seu nome"
                    className="w-full bg-[#1f2937] border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00ff66]/40 transition-all"
                  />
                </div>

                {/* Data */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block tracking-wider uppercase">Data</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full bg-[#1f2937] border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00ff66]/40 transition-all"
                  />
                </div>

                {/* Setor — seletor em cards */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block tracking-wider uppercase">Setor</label>

                  {/* Trigger */}
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setSectorOpen(o => !o) }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all flex items-center justify-between bg-[#1f2937]
                      ${sectorOpen ? 'border-[#00ff66]/40' : 'border-white/5 hover:border-white/10'}
                      ${form.sector ? 'text-white' : 'text-gray-600'}`}
                  >
                    <span>
                      {selectedSector
                        ? `${selectedSector.emoji}  ${selectedSector.short}`
                        : 'Selecione seu setor...'}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform duration-200 ${sectorOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Cards dropdown */}
                  {sectorOpen && (
                    <div
                      className="mt-2 space-y-1.5 max-h-72 overflow-y-auto pr-0.5"
                      onClick={e => e.stopPropagation()}
                    >
                      {SECTORS.map(s => {
                        const sel = form.sector === s.name
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => { setForm(f => ({ ...f, sector: s.name })); setSectorOpen(false) }}
                            className={`w-full text-left p-3 rounded-xl border transition-all group
                              ${sel
                                ? 'bg-[#00ff66]/10 border-[#00ff66]/40 shadow-[0_0_12px_#00ff6610]'
                                : 'bg-[#1f2937] border-white/5 hover:border-[#00ff66]/25 hover:bg-[#252f3e]'}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base leading-none">{s.emoji}</span>
                              <span className={`text-xs font-bold leading-snug ${sel ? 'text-[#00ff66]' : 'text-gray-200 group-hover:text-white'}`}>
                                {s.short}
                              </span>
                              {sel && <span className="ml-auto text-[#00ff66] text-xs font-black">✓</span>}
                            </div>
                            <p className={`text-[10px] mt-1 leading-relaxed pl-6 ${sel ? 'text-[#00ff66]/60' : 'text-gray-600'}`}>
                              {s.desc}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Cargo */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block tracking-wider uppercase">Cargo / Função</label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    placeholder="Ex: Consultor de Vendas..."
                    className="w-full bg-[#1f2937] border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00ff66]/40 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Contador */}
            <div className="bg-[#111827] rounded-2xl border border-white/5 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1f2937] rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-[#00ff66]">{activities.length}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">atividades</p>
                </div>
                <div className="bg-[#1f2937] rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-white">{report ? '✓' : '—'}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">relatório</p>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-2">
              <button
                onClick={generateReport}
                disabled={loading || activities.length === 0}
                className="w-full py-3.5 rounded-xl font-black text-sm tracking-wide transition-all flex items-center justify-center gap-2
                  bg-[#00ff66] text-black hover:bg-[#00e55c] hover:shadow-[0_0_24px_#00ff6640]
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none glow"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Gerando...
                  </>
                ) : '⚡ Gerar Relatório com IA'}
              </button>

              {report && (
                <>
                  <button
                    onClick={copyReport}
                    className="w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all border
                      bg-[#1f2937] text-white border-[#00ff66]/20 hover:border-[#00ff66]/50 hover:text-[#00ff66]"
                  >
                    {copied ? '✓  Copiado!' : '📋  Copiar Relatório'}
                  </button>

                  <button
                    onClick={sendToNotion}
                    disabled={notionStatus === 'sending'}
                    className="w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all border flex items-center justify-center gap-2
                      bg-[#1f2937] text-purple-300 border-purple-500/20 hover:border-purple-400/40 hover:bg-purple-950/20
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {notionStatus === 'sending' ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : '📤 Enviar para o Notion'}
                  </button>
                </>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={saveDraft}
                  className="py-2.5 rounded-xl text-xs font-bold text-gray-400 bg-[#111827] border border-white/5 hover:border-white/10 hover:text-white transition-all"
                >
                  {saved ? '✓ Salvo' : '💾 Rascunho'}
                </button>
                <button
                  onClick={downloadReport}
                  disabled={!report}
                  className="py-2.5 rounded-xl text-xs font-bold text-gray-400 bg-[#111827] border border-white/5 hover:border-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ⬇ Baixar .txt
                </button>
              </div>

              <button
                onClick={clearAll}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-red-500 bg-[#111827] border border-white/5 hover:bg-red-950/40 hover:border-red-500/20 transition-all"
              >
                🗑 Limpar Tudo
              </button>
            </div>
          </aside>

          {/* ══ PAINEL DIREITO ══ */}
          <section className="space-y-4">

            {/* Chat de atividades */}
            <div className="bg-[#111827] rounded-2xl border border-white/5 flex flex-col min-h-[480px]">

              {/* Header chat */}
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[#00ff66] text-[10px] font-black tracking-widest uppercase flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#00ff66] rounded-full" />
                    Atividades do Dia
                  </p>
                  <p className="text-gray-600 text-[10px] mt-0.5">Não precisa escrever bonito — a IA organiza para você.</p>
                </div>
                {activities.length > 0 && (
                  <span className="text-[10px] font-bold text-[#00ff66] bg-[#00ff66]/10 border border-[#00ff66]/20 px-2.5 py-1 rounded-full">
                    {activities.length} registradas
                  </span>
                )}
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-5 space-y-2.5 min-h-[280px] max-h-[380px]">
                {activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                    <div className="w-14 h-14 bg-[#1f2937] rounded-2xl flex items-center justify-center text-3xl mb-4">📋</div>
                    <p className="text-gray-400 font-semibold text-sm">Nenhuma atividade ainda</p>
                    <p className="text-gray-600 text-xs mt-1 mb-6">Digite abaixo e pressione Enter para adicionar</p>
                    <div className="bg-[#1f2937]/60 rounded-xl p-4 text-left w-full max-w-sm border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Exemplos rápidos:</p>
                      {EXAMPLES.map(ex => (
                        <button
                          key={ex}
                          onClick={() => { setInput(ex); inputRef.current?.focus() }}
                          className="flex items-center gap-2 w-full text-left py-1.5 group"
                        >
                          <span className="text-[#00ff66]/40 group-hover:text-[#00ff66] transition-colors text-xs">—</span>
                          <span className="text-gray-500 group-hover:text-gray-300 transition-colors text-xs">{ex}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  activities.map((act, i) => (
                    <div key={act.id} className="flex items-start gap-3 group animate-in">
                      <div className="w-7 h-7 rounded-lg bg-[#00ff66]/10 border border-[#00ff66]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[#00ff66] text-[10px] font-black">{String(i + 1).padStart(2, '0')}</span>
                      </div>
                      <div className="flex-1 bg-[#1f2937] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-gray-200 leading-relaxed">
                        {act.text}
                      </div>
                      <button
                        onClick={() => removeActivity(act.id)}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-red-950/60 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-900/60 transition-all flex-shrink-0 mt-0.5 text-sm"
                        title="Remover"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/5">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="- Digite uma atividade e pressione Enter..."
                    rows={2}
                    className="flex-1 bg-[#1f2937] border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00ff66]/30 transition-all resize-none"
                  />
                  <button
                    onClick={addActivity}
                    disabled={!input.trim()}
                    className="w-11 h-11 bg-[#00ff66] text-black rounded-xl flex items-center justify-center text-xl font-black hover:bg-[#00e55c] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Adicionar atividade"
                  >
                    +
                  </button>
                </div>
                <p className="text-[10px] text-gray-700 mt-2 px-1">
                  ↵ Enter para adicionar · Shift+Enter para nova linha · Clique nos exemplos acima para testar
                </p>
              </div>
            </div>

            {/* Relatório gerado */}
            {report && (
              <div className="bg-[#111827] rounded-2xl border border-[#00ff66]/20 overflow-hidden animate-in">
                <div className="px-5 py-4 border-b border-[#00ff66]/10 bg-[#00ff66]/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-[#00ff66] rounded-full animate-pulse" />
                    <p className="text-[#00ff66] text-[10px] font-black tracking-widest uppercase">Relatório Gerado</p>
                    {aiUsed && (
                      <span className="text-[10px] font-bold text-[#00ff66] bg-[#00ff66]/10 border border-[#00ff66]/20 px-2 py-0.5 rounded-full">
                        via IA
                      </span>
                    )}
                  </div>
                  <button
                    onClick={copyReport}
                    className="text-xs text-gray-500 hover:text-[#00ff66] transition-colors font-medium"
                  >
                    {copied ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
                <pre className="p-6 text-sm text-gray-300 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[480px] overflow-y-auto">
                  {report}
                </pre>
              </div>
            )}

            {/* Feedback Notion */}
            {notionStatus === 'success' && (
              <div className="flex items-center gap-3 p-4 bg-[#00ff66]/10 border border-[#00ff66]/30 rounded-xl animate-in">
                <span className="text-[#00ff66] text-lg">✓</span>
                <p className="text-[#00ff66] text-sm font-semibold">Relatório enviado para o Notion com sucesso.</p>
              </div>
            )}

            {notionStatus === 'error' && (
              <div className="flex items-center gap-3 p-4 bg-red-950/40 border border-red-500/20 rounded-xl animate-in">
                <span className="text-red-400 text-lg">⚠</span>
                <p className="text-red-400 text-sm">Não foi possível enviar para o Notion. Verifique a configuração da integração.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ════════ FOOTER ════════ */}
      <footer className="border-t border-white/5 py-4 text-center">
        <p className="text-[10px] text-gray-700 tracking-wider">
          RELATÓRIO INTELIGENTE · CPPEM · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  )
}
