import { jsPDF } from 'jspdf'
import type { ForecastResult } from '../types'
import { buildDeploymentBrief } from './deploymentBrief'

export function downloadAnalysisPdf(form: Record<string, string>, result: ForecastResult) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const margin = 14
  const pageWidth = doc.internal.pageSize.getWidth()
  const maxWidth = pageWidth - margin * 2
  let y = margin

  const addLine = (text: string, size = 10, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    const lines = doc.splitTextToSize(text, maxWidth)
    for (const line of lines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += size * 0.45 + 2
    }
  }

  addLine('Namma Trust — Event Analysis Report', 16, true)
  addLine(`Generated: ${new Date().toLocaleString('en-IN')}`, 9)
  y += 4

  const brief = buildDeploymentBrief(form, result)
  brief.split('\n').forEach((line) => addLine(line, 9, line.startsWith('NAMMA') || line === 'EVENT' || line === 'FORECAST'))

  const filename = `namma-trust-analysis-${form.corridor.replace(/\s+/g, '-')}-${form.hour}h.pdf`
  doc.save(filename)
}
