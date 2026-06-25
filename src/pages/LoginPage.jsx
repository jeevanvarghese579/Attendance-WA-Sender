import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { currentUser, isDemoMode, login, logout } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // If the user is already logged in, show a simple "logged in" panel so they
  // can either continue or log out.
  if (currentUser) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 60%, #128c7e 100%)',
        }}
      >
        <Card sx={{ maxWidth: 420, width: '100%' }} elevation={12}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <HowToRegIcon sx={{ fontSize: 56, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Already signed in
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {currentUser.email}
            </Typography>
            <Stack spacing={1.5}>
              <Button
                size="large"
                variant="contained"
                onClick={() => navigate('/')}
                fullWidth
              >
                Continue to Dashboard
              </Button>
              <Button
                size="medium"
                variant="outlined"
                color="error"
                onClick={() => logout()}
                startIcon={<LogoutIcon />}
                fullWidth
              >
                Logout
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err?.message || 'Failed to sign in. Check your credentials.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 60%, #128c7e 100%)',
      }}
    >
      <Box
        sx={{
          maxWidth: 920,
          width: '100%',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          alignItems: 'center',
        }}
      >
        {!isMobile && (
          <Box sx={{ color: '#fff', pr: 3 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, lineHeight: 1.15 }}>
              Absentee Whatsapp Messenger
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.92, fontWeight: 400, mb: 3 }}>
              Select absent students by roll number and instantly share the
              absentee list through WhatsApp.
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Developed by Jeevan Varghese
              <br />
              St. Gemma's Girls' HSS Malappuram
            </Typography>
          </Box>
        )}

        <Card elevation={12} sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {isMobile && (
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                Absentee Manager
              </Typography>
            )}
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Sign in with your email and password.
            </Typography>

            {isDemoMode && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                Firebase credentials not configured. You're in <strong>demo mode</strong> —
                use any valid email & password (4+ chars) to explore.
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                label="Email ID"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                autoComplete="email"
                autoFocus
                sx={{ mb: 2 }}
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                required
                autoComplete="current-password"
                sx={{ mb: 2 }}
              />
              <Button
                type="submit"
                size="large"
                variant="contained"
                color="primary"
                fullWidth
                disabled={busy}
                startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}
                sx={{ py: 1.2, mb: 2 }}
              >
                {busy ? 'Signing in…' : 'Login'}
              </Button>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <MuiLink component={Link} to="/forgot-password" variant="body2">
                Forgot password?
              </MuiLink>
              <Typography variant="body2" color="text.secondary">
                Absentee Manager
              </Typography>
            </Box>

            {!isDemoMode && (
              <>
                <Divider sx={{ my: 2 }}>or</Divider>
                <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Don't have an account? Ask your administrator to create one
                    in Firebase Authentication.
                  </Typography>
                </Paper>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}