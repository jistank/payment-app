import i18n from '../i18n/config'
import { formatFullDate, transactionDetails } from './formatters'

export async function downloadTransactionPdf(transaction, currentUser) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const details = transactionDetails(transaction, currentUser)

  doc.setProperties({ title: i18n.t('transactions:pdf.title') })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(i18n.t('transactions:pdf.title'), 40, 56)

  doc.setDrawColor(203, 213, 225)
  doc.line(40, 70, 555, 70)

  let y = 96
  details.forEach(({ key, value }) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(71, 85, 105)
    doc.text(`${i18n.t(`transactions:fields.${key}`)}:`, 40, y)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(15, 23, 42)
    const valueLines = doc.splitTextToSize(String(value), 360)
    doc.text(valueLines, 165, y)
    y += Math.max(valueLines.length, 1) * 17 + 7
  })

  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(
    i18n.t('transactions:pdf.generatedOn', {
      date: formatFullDate(new Date().toISOString()),
    }),
    40,
    800,
  )

  doc.save(`transaction-${transaction.id}.pdf`)
}
