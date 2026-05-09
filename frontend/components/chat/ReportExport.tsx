'use client'
import { useState } from 'react'
import type { Message, QueryResponse } from '@/types'

interface Props {
  messages: Message[]
  messageData: Record<string, QueryResponse['data']>
  projectName: string
  fileName: string
  rowCount: number
}

export function ReportExport({ messages, messageData, projectName, fileName, rowCount }: Props) {
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      // Capture charts already rendered in the DOM as data URLs
      const chartImages: Record<string, string> = {}
      for (const msgId of Object.keys(messageData)) {
        const el = document.querySelector(`[data-message-id="${msgId}"] canvas`)
        if (el instanceof HTMLCanvasElement) {
          chartImages[msgId] = el.toDataURL('image/png')
        }
      }

      // Build the report element (off-screen)
      const report = document.createElement('div')
      report.style.cssText = [
        'position:fixed', 'top:-9999px', 'left:-9999px',
        'width:794px', 'background:white', 'padding:56px',
        "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        'color:#18181b', 'font-size:14px', 'line-height:1.6',
      ].join(';')

      // ── Cover ──────────────────────────────────────────────────────────────
      const cover = document.createElement('div')
      cover.style.cssText = 'border-bottom:2px solid #e4e4e7;padding-bottom:28px;margin-bottom:40px'
      cover.innerHTML = `
        <div style="font-size:11px;font-weight:700;color:#3b82f6;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px">AskMyData</div>
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#09090b">${projectName}</h1>
        <p style="margin:0;font-size:13px;color:#71717a">
          ${fileName} &nbsp;·&nbsp; ${rowCount.toLocaleString('pt-BR')} linhas
          &nbsp;·&nbsp; Gerado em ${new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' })}
        </p>
      `
      report.appendChild(cover)

      // ── Q&A blocks ─────────────────────────────────────────────────────────
      let i = 0
      while (i < messages.length) {
        const msg = messages[i]
        if (msg.role !== 'user') { i++; continue }

        const next = messages[i + 1]
        const block = document.createElement('div')
        block.style.cssText = 'margin-bottom:32px'

        // Question
        const q = document.createElement('div')
        q.style.cssText = 'background:#eff6ff;border-radius:10px;padding:12px 16px;font-weight:500;color:#1d4ed8;margin-bottom:10px'
        q.textContent = msg.content
        block.appendChild(q)

        // Answer
        if (next && next.role === 'assistant') {
          if (next.engine === 'error') {
            const err = document.createElement('div')
            err.style.cssText = 'background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;font-size:13px;color:#92400e'
            err.textContent = `⚠  ${next.content}`
            block.appendChild(err)
          } else {
            const ans = document.createElement('div')
            ans.style.cssText = 'color:#3f3f46;padding:0 4px'
            ans.innerHTML = next.content
              .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#09090b">$1</strong>')
              .replace(/\n/g, '<br>')
            block.appendChild(ans)

            if (chartImages[next.id]) {
              const img = document.createElement('img')
              img.src = chartImages[next.id]
              img.style.cssText = 'width:100%;margin-top:14px;border-radius:8px;border:1px solid #e4e4e7'
              block.appendChild(img)
            }
          }
          i += 2
        } else {
          i++
        }

        // Divider between blocks
        const divider = document.createElement('div')
        divider.style.cssText = 'border-bottom:1px solid #f4f4f5;margin-top:32px'
        block.appendChild(divider)
        report.appendChild(block)
      }

      // ── Footer ─────────────────────────────────────────────────────────────
      const footer = document.createElement('div')
      footer.style.cssText = 'margin-top:40px;padding-top:16px;border-top:1px solid #e4e4e7;font-size:11px;color:#a1a1aa;text-align:center'
      footer.textContent = `Relatório gerado por AskMyData · ${new Date().toLocaleDateString('pt-BR')}`
      report.appendChild(footer)

      document.body.appendChild(report)

      const canvas = await html2canvas(report, { scale: 2, useCORS: true, logging: false })
      document.body.removeChild(report)

      // ── Split canvas into A4 pages ─────────────────────────────────────────
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgW  = pageW
      const imgH  = (canvas.height * imgW) / canvas.width
      const imgData = canvas.toDataURL('image/png')

      let offsetY = 0
      let remaining = imgH
      while (remaining > 0) {
        if (offsetY > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -offsetY, imgW, imgH)
        offsetY  += pageH
        remaining -= pageH
      }

      pdf.save(`${projectName.replace(/\s+/g, '-').toLowerCase()}-relatorio.pdf`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition disabled:opacity-50"
    >
      {loading ? (
        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      {loading ? 'Gerando…' : 'Exportar PDF'}
    </button>
  )
}
