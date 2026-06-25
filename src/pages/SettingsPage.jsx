import React, { useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  useTheme,
  alpha,
} from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'
import RestoreIcon from '@mui/icons-material/Restore'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import PublicIcon from '@mui/icons-material/Public'
import InfoIcon from '@mui/icons-material/Info'
import SaveIcon from '@mui/icons-material/Save'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import ConfirmDialog from '../components/ConfirmDialog'
import ErrorBanner from '../components/ErrorBanner'
import { triggerDownload } from '../utils/csv'
import { formatTodayDDMMYYYY } from '../utils/whatsapp'

const REGIONS = [
  'India',
  'UAE',
  'Saudi Arabia',
  'Qatar',
  'Oman',
  'Bahrain',
  'Kuwait',
  'Other',
]

export default function SettingsPage() {
  const theme = useTheme()
  const { settings, persistSettings, wipeAll, restoreFromBackup, students, classes } = useData()
  const { currentUser } = useAuth()
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const [region, setRegion] = useState(settings?.region || 'India')
  const [confirmReset, setConfirmReset] = useState(false)

  const restoreInputRef = useRef(null)

  // Keep region in sync as settings load.
  React.useEffect(() => {
    setRegion(settings?.region || 'India')
  }, [settings?.region]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveRegion = async () => {
    setBusy(true)
    setError('')
    setInfo('')
    try {
      await persistSettings({ region })
      setInfo('Region saved.')
    } catch (e) {
      setError(e?.message || 'Failed to save region.')
    } finally {
      setBusy(false)
    }
  }

  const handleBackup = () => {
    setError('')
    setInfo('')
    const payload = {
      app: 'Attendance Whatsapp Messenger',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      classes,
      students,
    }
    const safeName = (classes[0]?.name || 'class').replace(/[^a-zA-Z0-9]+/g, '_')
    triggerDownload(
      `backup_${safeName}_${formatTodayDDMMYYYY().replace(/\//g, '-')}.json`,
      JSON.stringify(payload, null, 2),
      'application/json'
    )
    setInfo('Backup downloaded.')
  }

  const handleRestoreClick = () => {
    setError('')
    setInfo('')
    restoreInputRef.current?.click()
  }

  const handleRestoreFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data || (typeof data !== 'object')) {
        throw new Error('Invalid backup file.')
      }
      await restoreFromBackup(data)
      setInfo('Backup restored successfully.')
    } catch (err) {
      setError(err?.message || 'Failed to restore backup.')
    } finally {
      setBusy(false)
      if (restoreInputRef.current) restoreInputRef.current.value = ''
    }
  }

  const handleReset = async () => {
    setBusy(true)
    setError('')
    try {
      await wipeAll()
      setRegion('India')
      setInfo('Application reset.')
    } catch (e) {
      setError(e?.message || 'Failed to reset application.')
    } finally {
      setBusy(false)
      setConfirmReset(false)
    }
  }

  const cardProps = { elevation: 2, sx: { borderRadius: 4, height: '100%' } }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
        Settings
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Manage backups, region, and your application data.
      </Typography>

      <ErrorBanner message={error} onDismiss={() => setError('')} />
      {info && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setInfo('')}>
          {info}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Universal Backup */}
        <Grid item xs={12} md={6}>
          <Card {...cardProps}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader
                icon={<CloudUploadIcon color="primary" />}
                title="Universal Backup"
                subtitle="Export or restore all your data (classes, students, settings)."
              />
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<CloudDownloadIcon />}
                  onClick={handleBackup}
                  disabled={busy}
                  sx={{ flex: '1 1 auto' }}
                >
                  Backup All Data
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<RestoreIcon />}
                  onClick={handleRestoreClick}
                  disabled={busy}
                  sx={{ flex: '1 1 auto' }}
                >
                  Restore Backup
                </Button>
                <input
                  ref={restoreInputRef}
                  type="file"
                  accept="application/json,.json"
                  hidden
                  onChange={handleRestoreFile}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                Backups are stored as JSON and include classes, students, and settings.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Region */}
        <Grid item xs={12} md={6}>
          <Card {...cardProps}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader
                icon={<PublicIcon color="primary" />}
                title="Set Region"
                subtitle="Choose your region. Saved to your account automatically."
              />
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-end' }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="region-label">Region</InputLabel>
                  <Select
                    labelId="region-label"
                    label="Region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    disabled={busy}
                    sx={{ borderRadius: 2 }}
                  >
                    {REGIONS.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveRegion}
                  disabled={busy}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Save
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
                Current region: <strong>{settings?.region || 'India'}</strong>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* About */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={3}
            sx={{
              borderRadius: 4,
              height: '100%',
              background: (t) =>
                `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.12)} 0%, ${alpha(
                  t.palette.secondary.main,
                  0.08
                )} 100%)`,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <SectionHeader
                icon={<InfoIcon color="primary" />}
                title="About"
                subtitle=""
              />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Absentee Whatsapp Messenger v1.6 <p/>Developed by Jeevan Varghese
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  St. Gemma's Girls' HSS Malappuram
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="body2" color="text.secondary">
                  Visit:
                  <Button
                    component="a"
                    href="https://itsjeevanvarghese.web.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{ ml: 1, textTransform: 'none', fontWeight: 600 }}
                  >
                    itsjeevanvarghese.web.app
                  </Button>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  for more school related softwares.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Reset */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={2}
            sx={{
              borderRadius: 4,
              height: '100%',
              border: (t) => `1px solid ${alpha(t.palette.error.main, 0.25)}`,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <SectionHeader
                icon={<DeleteForeverIcon color="error" />}
                title="Reset Entire Application"
                subtitle="Deletes all students, settings, and classes. This cannot be undone."
                titleColor="error.main"
              />
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteForeverIcon />}
                onClick={() => setConfirmReset(true)}
                disabled={busy}
              >
                Reset Entire Application
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Account footer */}
      <Paper
        variant="outlined"
        sx={{ mt: 3, p: 2.5, borderRadius: 3 }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Signed in as
            </Typography>
            <Typography sx={{ fontWeight: 600 }}>{currentUser?.email}</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Absentee Manager v1.0 → Attendance WhatsApp Messenger v1.0 · Multi-user data isolated per account
          </Typography>
        </Stack>
      </Paper>

      {/* Reset confirmation */}
      <ConfirmDialog
        open={confirmReset}
        title="Reset entire application?"
        message="This will permanently delete all students, settings, and classes. This action cannot be undone."
        confirmText="Yes, reset everything"
        confirmColor="error"
        onConfirm={handleReset}
        onClose={() => setConfirmReset(false)}
      />
    </Box>
  )
}

function SectionHeader({ icon, title, subtitle, titleColor }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
      {icon}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: titleColor }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  )
}