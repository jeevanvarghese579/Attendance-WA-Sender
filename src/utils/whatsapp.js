export function formatTodayDDMMYYYY(date = new Date()) {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

// Build the WhatsApp message text:
//
// TODAY'S ABSENTEES (DD/MM/YYYY)
// Class Name
//
// 1. Student Name (Roll No: XX)
// 2. Student Name (Roll No: XX)
// 3. Student Name (Roll No: XX)
export function buildAbsenteesMessage(absenteeStudents, className = '') {
  const dateStr = formatTodayDDMMYYYY()
  const header = `TODAY'S ABSENTEES (${dateStr})`
  const parts = [header]
  if (className) parts.push(className)
  parts.push('')
  const lines = absenteeStudents.map((s, i) => `${i + 1}. ${s.name} (Roll No: ${s.rollNo})`)
  return [...parts, ...lines].join('\n')
}

const WHATSAPP_BASE = 'https://wa.me/?text='

export function buildWhatsAppUrl(message) {
  return `${WHATSAPP_BASE}${encodeURIComponent(message)}`
}

export function openWhatsAppShare(message) {
  const url = buildWhatsAppUrl(message)
  // Opens WhatsApp share screen in a new tab / app handler.
  window.open(url, '_blank', 'noopener,noreferrer')
}
