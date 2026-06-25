import React, { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import SchoolIcon from '@mui/icons-material/School'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import GridViewIcon from '@mui/icons-material/GridView'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import { useData } from '../context/DataContext'
import { buildAbsenteesMessage, openWhatsAppShare } from '../utils/whatsapp'
import { formatDateLong, getTodayDateId } from '../utils/date'
import { saveAbsentees } from '../services/firestoreService'
import { useAuth } from '../context/AuthContext'
import { isFirebaseConfigured } from '../firebase/config'

const COLUMN_OPTIONS = [3, 4, 5, 6, 7, 8]

export default function SelectAbsenteesPage() {
  const theme = useTheme()
  const { students, activeClass, columns, persistColumns, dataLoading, dataError } = useData()
  const { currentUser } = useAuth()
  const [selected, setSelected] = useState(() => new Set())
  const [saving, setSaving] = useState(false)
  const todayId = getTodayDateId()

  // Absentee selection is scoped per user + date + class
  const todayKey = `absenteeManager:absentees:${currentUser?.uid}:${todayId}:${activeClass?.id || 'none'}`
  useEffect(() => {
    try {
      const raw = localStorage.getItem(todayKey)
      setSelected(new Set(raw ? JSON.parse(raw) : []))
    } catch {
      setSelected(new Set())
    }
  }, [todayKey])

  const toggleStudent = (rollNo) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(rollNo)) next.delete(rollNo)
      else next.add(rollNo)
      try {
        localStorage.setItem(todayKey, JSON.stringify([...next]))
      } catch {
        // ignore
      }
      return next
    })
  }

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => a.rollNo - b.rollNo),
    [students]
  )

  const selectedStudents = useMemo(
    () => sortedStudents.filter((s) => selected.has(s.rollNo)),
    [sortedStudents, selected]
  )

  const handleSendWhatsApp = async () => {
    if (!selectedStudents.length) return
    setSaving(true)
    try {
      const message = buildAbsenteesMessage(selectedStudents, activeClass?.name || '')
      if (currentUser && isFirebaseConfigured) {
        try {
          await saveAbsentees(currentUser.uid, {
            date: todayId,
            className: activeClass?.name || '',
            selectedStudents: selectedStudents.map((s) => ({
              rollNo: s.rollNo,
              name: s.name,
            })),
          })
        } catch {
          // best-effort
        }
      }
      openWhatsAppShare(message)
    } finally {
      setSaving(false)
    }
  }

  const handleClear = () => {
    setSelected(new Set())
    try {
      localStorage.removeItem(todayKey)
    } catch {
      // ignore
    }
  }

  if (dataLoading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Loading students…</Typography>
        </Stack>
      </Box>
    )
  }

  return (
    <Box>
      {dataError && <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>{dataError}</Alert>}

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
        Select Absentees
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Tap a roll number to mark a student absent.
      </Typography>

      {/* Top controls card */}
      <Card elevation={2} sx={{ mb: 3, borderRadius: 4 }}>
        <CardContent
          sx={{
            p: { xs: 2, sm: 3 },
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: '1 1 220px' }}>
            <SchoolIcon color="primary" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Class
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
                {activeClass ? (
                  activeClass.name
                ) : (
                  <Typography component="span" color="text.secondary" sx={{ fontSize: 14 }}>
                    No class selected —{' '}
                    <RouterLink to="/students" style={{ marginLeft: 2 }}>
                      add one
                    </RouterLink>
                  </Typography>
                )}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: '1 1 200px' }}>
            <CalendarMonthIcon color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Current Date
              </Typography>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                {formatDateLong()}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: '0 0 auto' }}>
            <GridViewIcon color="action" />
            <FormControl size="small" sx={{ minWidth: 96 }}>
              <Select
                value={columns}
                onChange={(e) => persistColumns(Number(e.target.value))}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                {COLUMN_OPTIONS.map((n) => (
                  <MenuItem key={n} value={n}>
                    {n} cols
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {!activeClass ? (
        <Card elevation={2} sx={{ borderRadius: 4, py: 6, textAlign: 'center' }}>
          <CardContent>
            <SchoolIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h6" gutterBottom>No class selected</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Select or add a class using the sidebar.
            </Typography>
            <Button component={RouterLink} to="/students" variant="contained" startIcon={<GroupAddIcon />}>
              Manage Classes
            </Button>
          </CardContent>
        </Card>
      ) : sortedStudents.length === 0 ? (
        <Card elevation={2} sx={{ borderRadius: 4, py: 6, textAlign: 'center' }}>
          <CardContent>
            <GroupAddIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h6" gutterBottom>No students in {activeClass.name}</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Add students to start marking absences.
            </Typography>
            <Button component={RouterLink} to="/students" variant="contained" startIcon={<GroupAddIcon />}>
              Add Students
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, alignItems: 'center' }}>
            <Chip color="primary" variant="filled" label={`${selectedStudents.length} absent`} />
            <Chip variant="outlined" label={`${sortedStudents.length - selectedStudents.length} present`} />
            <Chip variant="outlined" label={`${columns} columns`} />
            {selectedStudents.length > 0 && (
              <Button size="small" onClick={handleClear} color="inherit" sx={{ textTransform: 'none' }}>
                Clear selection
              </Button>
            )}
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: `repeat(${Math.min(columns, 4)}, minmax(0, 1fr))`,
                sm: `repeat(${columns}, minmax(0, 1fr))`,
              },
              gap: { xs: 1, sm: 1.5 },
              mb: 3,
            }}
          >
            {sortedStudents.map((s) => {
              const isAbsent = selected.has(s.rollNo)
              return (
                <Tooltip title={s.name} arrow key={s.id || s.rollNo}>
                  <Box
                    onClick={() => toggleStudent(s.rollNo)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Roll ${s.rollNo} ${s.name}${isAbsent ? ', absent' : ', present'}`}
                    aria-pressed={isAbsent}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleStudent(s.rollNo)
                      }
                    }}
                    sx={{
                      aspectRatio: '1 / 1',
                      borderRadius: 3,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      userSelect: 'none',
                      overflow: 'hidden',
                      background: isAbsent
                        ? 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)'
                        : theme.palette.mode === 'dark'
                        ? '#3a3f3b'
                        : '#9e9e9e',
                      color: '#fff',
                      transition: 'all 0.2s ease',
                      transform: isAbsent ? 'scale(0.97)' : 'scale(1)',
                      boxShadow: isAbsent
                        ? `0 6px 16px ${alpha('#1b5e20', 0.5)}`
                        : '0 2px 6px rgba(0,0,0,0.18)',
                      '&:hover': {
                        transform: isAbsent ? 'scale(0.97)' : 'scale(1.03)',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.28)',
                      },
                      '&:active': { transform: 'scale(0.94)' },
                    }}
                  >
                    <Typography sx={{ fontSize: { xs: 22, sm: 28, md: 30 }, fontWeight: 800, lineHeight: 1 }}>
                      {s.rollNo}
                    </Typography>
                    {isAbsent && (
                      <Typography sx={{ fontSize: { xs: 11, sm: 12 }, color: '#ff5252', fontWeight: 800, mt: 0.5, letterSpacing: 0.5 }}>
                        Ab
                      </Typography>
                    )}
                  </Box>
                </Tooltip>
              )
            })}
          </Box>

          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              ml: -1, pl: 1, pr: 1, pb: 1, pt: 2,
              background: (t) =>
                `linear-gradient(${alpha(t.palette.background.default, 0)} 0%, ${t.palette.background.default} 55%)`,
            }}
          >
            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!selectedStudents.length || saving}
              onClick={handleSendWhatsApp}
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <WhatsAppIcon />}
              sx={{
                py: 1.6,
                borderRadius: 3,
                fontSize: 16,
                bgcolor: '#25d366',
                color: '#fff',
                boxShadow: '0 8px 24px rgba(37,211,102,0.45)',
                '&:hover': { bgcolor: '#1fb858' },
                '&.Mui-disabled': { bgcolor: (t) => alpha('#25d366', t.palette.action.disabledOpacity) },
              }}
            >
              {saving ? 'Opening WhatsApp…' : selectedStudents.length
                ? `Send via WhatsApp (${selectedStudents.length})`
                : 'Select absentees to share'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  )
}