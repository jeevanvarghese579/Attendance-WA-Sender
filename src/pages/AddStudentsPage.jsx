import React, { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material'
import UploadIcon from '@mui/icons-material/Upload'
import DownloadIcon from '@mui/icons-material/Download'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import SaveIcon from '@mui/icons-material/Save'
import SchoolIcon from '@mui/icons-material/School'
import { useData } from '../context/DataContext'
import {
  pickCsvFile,
  parseStudentsCsv,
  toStudentsCsv,
  triggerDownload,
} from '../utils/csv'
import { formatTodayDDMMYYYY } from '../utils/whatsapp'

const emptyForm = { id: null, rollNo: '', name: '' }

export default function AddStudentsPage() {
  const {
    students,
    activeClass,
    addStudentRow,
    updateStudentRow,
    deleteStudentRow,
    importStudents,
  } = useData()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const sorted = useMemo(
    () => [...students].sort((a, b) => a.rollNo - b.rollNo),
    [students]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter(
      (s) =>
        String(s.rollNo).includes(q) ||
        String(s.name || '').toLowerCase().includes(q)
    )
  }, [sorted, search])

  const resetForm = () => {
    setForm(emptyForm)
    setEditing(false)
    setError('')
  }

  const validateForm = () => {
    const rollNo = parseInt(form.rollNo, 10)
    if (Number.isNaN(rollNo) || rollNo < 1) {
      setError('Enter a valid roll number (positive integer).')
      return false
    }
    if (!form.name.trim()) {
      setError('Student name is required.')
      return false
    }
    return true
  }

  const handleAddStudent = async () => {
    if (!activeClass) { setError('Select a class first.'); return }
    setError('')
    if (!validateForm()) return
    const rollNo = Number(form.rollNo)
    if (students.some((s) => Number(s.rollNo) === rollNo)) {
      setError(`Roll number ${rollNo} already exists. Use Update instead.`)
      return
    }
    setBusy(true)
    try {
      await addStudentRow({ rollNo, name: form.name.trim() })
      resetForm()
    } catch (e) {
      setError(e?.message || 'Failed to add student.')
    } finally {
      setBusy(false)
    }
  }

  const handleEdit = (student) => {
    setForm({ id: student.id, rollNo: String(student.rollNo), name: student.name })
    setEditing(true)
    setError('')
    if (isMobile) {
      document.getElementById('student-form')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleUpdateStudent = async () => {
    setError('')
    if (!form.id) return
    if (!validateForm()) return
    const rollNo = Number(form.rollNo)
    const conflict = students.find(
      (s) => s.id !== form.id && Number(s.rollNo) === rollNo
    )
    if (conflict) {
      setError(`Roll number ${rollNo} is already used by another student.`)
      return
    }
    setBusy(true)
    try {
      await updateStudentRow(form.id, { rollNo, name: form.name.trim() })
      resetForm()
    } catch (e) {
      setError(e?.message || 'Failed to update student.')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteStudent = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await deleteStudentRow(deleteTarget.id)
      if (form.id === deleteTarget.id) resetForm()
    } catch (e) {
      setError(e?.message || 'Failed to delete student.')
    } finally {
      setBusy(false)
      setDeleteTarget(null)
    }
  }

  const handleExportCsv = () => {
    if (!students.length) { setError('No students to export.'); return }
    const csv = toStudentsCsv(students)
    const safeClass = (activeClass?.name || 'class').replace(/[^a-zA-Z0-9]+/g, '_')
    triggerDownload(`students_${safeClass}_${formatTodayDDMMYYYY().replace(/\//g, '-')}.csv`, csv)
  }

  const handleImportCsv = async () => {
    if (!activeClass) { setError('Select a class first.'); return }
    setError('')
    setBusy(true)
    try {
      const csvText = await pickCsvFile('.csv')
      const incoming = parseStudentsCsv(csvText)
      if (!incoming.length) { setError('No valid rows found. CSV format: rollNo,name'); return }
      await importStudents(incoming)
    } catch (e) {
      setError(e?.message || 'Failed to import CSV.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Add Students
        </Typography>
        {activeClass && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1.5,
              py: 0.5,
              borderRadius: 20,
              background: (t) => alpha(t.palette.primary.main, 0.12),
            }}
          >
            <SchoolIcon sx={{ fontSize: 15, color: 'primary.main' }} />
            <Typography sx={{ fontWeight: 700, fontSize: 13, color: 'primary.main' }}>
              {activeClass.name}
            </Typography>
          </Box>
        )}
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {activeClass
          ? `Manage the student roster for ${activeClass.name}.`
          : 'Add a class from the sidebar to get started.'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {!activeClass ? (
        <Card elevation={2} sx={{ borderRadius: 4, py: 6, textAlign: 'center' }}>
          <CardContent>
            <SchoolIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h6" gutterBottom>No class selected</Typography>
            <Typography color="text.secondary">
              Use the sidebar to add or select a class first.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* CSV controls */}
          <Card elevation={2} sx={{ mb: 3, borderRadius: 4 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ flex: '1 1 auto' }}>
                Import or export the student roster for <strong>{activeClass.name}</strong>.
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" color="primary" startIcon={<UploadIcon />} onClick={handleImportCsv} disabled={busy}>
                  Import CSV
                </Button>
                <Button variant="outlined" color="primary" startIcon={<DownloadIcon />} onClick={handleExportCsv} disabled={busy || !students.length}>
                  Export CSV
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Form + Table */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card id="student-form" elevation={2} sx={{ borderRadius: 4, position: 'sticky', top: 80 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    {editing ? 'Edit Student' : 'Add Student'}
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Roll Number"
                      type="number"
                      value={form.rollNo}
                      onChange={(e) => setForm({ ...form, rollNo: e.target.value })}
                      size="small"
                      fullWidth
                      disabled={busy}
                    />
                    <TextField
                      label="Student Name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      size="small"
                      fullWidth
                      disabled={busy}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !busy) {
                          editing ? handleUpdateStudent() : handleAddStudent()
                        }
                      }}
                    />
                    <Stack direction="column" spacing={1}>
                      <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAddStudent} disabled={busy || editing} fullWidth>
                        Add
                      </Button>
                      <Button variant="contained" color="warning" startIcon={<SaveIcon />} onClick={handleUpdateStudent} disabled={busy || !editing} fullWidth>
                        Update
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => { if (form.id) setDeleteTarget({ id: form.id, name: form.name }) }}
                        disabled={busy || !editing}
                        fullWidth
                      >
                        Delete
                      </Button>
                    </Stack>
                    {editing && (
                      <Button size="small" onClick={resetForm} sx={{ textTransform: 'none' }}>
                        Cancel edit
                      </Button>
                    )}
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        CSV format: <code>rollNo,name</code>
                        <br />
                        Example: <code>1,Akhila</code>
                      </Typography>
                    </Paper>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card elevation={2} sx={{ borderRadius: 4 }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, px: 0.5, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Students
                    </Typography>
                    <TextField
                      placeholder="Search by name or roll number"
                      size="small"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      sx={{ width: { xs: '100%', sm: 280 } }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Stack>

                  {!filtered.length ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography color="text.secondary">
                        {students.length ? 'No students match your search.' : 'No students added yet.'}
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Box} sx={{ maxHeight: '60vh' }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Roll No</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, width: 110 }}>Edit</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, width: 110 }}>Delete</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filtered.map((s) => (
                            <TableRow
                              key={s.id || s.rollNo}
                              hover
                              sx={{ transition: 'background-color 0.15s ease', '&:last-child td': { border: 0 } }}
                            >
                              <TableCell sx={{ fontWeight: 700 }}>{s.rollNo}</TableCell>
                              <TableCell>{s.name}</TableCell>
                              <TableCell align="center">
                                <Tooltip title="Edit">
                                  <IconButton size="small" color="primary" onClick={() => handleEdit(s)} disabled={busy}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => setDeleteTarget({ id: s.id, name: s.name, rollNo: s.rollNo })}
                                    disabled={busy}
                                    sx={{ '&:hover': { background: (t) => alpha(t.palette.error.main, 0.12) } }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                  <Box sx={{ px: 1, py: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {filtered.length} of {students.length} students · sorted by roll number
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => !busy && setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete student?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget?.name ? (
              <>Are you sure you want to delete <strong>{deleteTarget.name}</strong>{deleteTarget.rollNo ? ` (Roll No: ${deleteTarget.rollNo})` : ''}? This cannot be undone.</>
            ) : (
              'Are you sure you want to delete this student? This cannot be undone.'
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit" variant="text">Cancel</Button>
          <Button onClick={handleDeleteStudent} color="error" variant="contained" disabled={busy}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}