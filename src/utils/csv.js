import Papa from 'papaparse'

// Expected CSV format: rollNo,name
// Example:
// 1,Akhila
// 2,Anjana
// 3,Fathima

export function parseStudentsCsv(csvString) {
  const { data, errors } = Papa.parse(csvString, {
    skipEmptyLines: true,
  })
  if (errors && errors.length) {
    throw new Error(errors[0].message || 'Invalid CSV format')
  }
  const students = []
  data.forEach((row) => {
    if (!Array.isArray(row) || row.length < 2) return
    const rollNo = parseInt(row[0], 10)
    const name = String(row[1] || '').trim()
    if (Number.isNaN(rollNo) || !name) return
    students.push({ rollNo, name })
  })
  return students
}

export function toStudentsCsv(students) {
  const sorted = [...students].sort((a, b) => a.rollNo - b.rollNo)
  const rows = sorted.map((s) => [s.rollNo, s.name])
  return Papa.unparse(rows, { columns: ['rollNo', 'name'] })
}

export function triggerDownload(filename, content, mime = 'text/csv') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function pickCsvFile(accept = '.csv') {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = (e) => {
      const file = e.target.files?.[0]
      if (!file) {
        reject(new Error('No file selected'))
        return
      }
      const reader = new FileReader()
      reader.onload = (ev) => resolve(String(ev.target.result || ''))
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    }
    input.click()
  })
}
