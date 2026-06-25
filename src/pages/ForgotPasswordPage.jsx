import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link as MuiLink,
  Alert,
  TextField,
  Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead'
import { useAuth } from '../context/AuthContext'

export default function ForgotPasswordPage() {
  const { resetPassword, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(err?.message || 'Failed to send reset email. Check the address.')
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
      <Card sx={{ maxWidth: 440, width: '100%' }} elevation={12}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {!sent ? (
            <>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Reset your password
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your email and we'll send you a password reset link.
              </Typography>
              {isDemoMode && (
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                  Demo mode — no real email will be sent.
                </Alert>
              )}
              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  required
                  autoFocus
                  sx={{ mb: 2 }}
                />
                <Button
                  type="submit"
                  size="large"
                  variant="contained"
                  fullWidth
                  disabled={busy}
                  startIcon={busy ? <CircularProgress size={18} color="inherit" /> : null}
                  sx={{ py: 1.2, mb: 2 }}
                >
                  {busy ? 'Sending…' : 'Send reset link'}
                </Button>
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <MarkEmailReadIcon sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Check your inbox
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isDemoMode
                  ? 'Demo mode: password reset simulated. Log in with any credentials.'
                  : `If an account exists for ${email}, a reset link is on its way.`}
              </Typography>
            </Box>
          )}

          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/login')}
            fullWidth
            sx={{ mt: 1 }}
          >
            Back to login
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <MuiLink component={Link} to="/login" variant="body2">
              Return to sign in
            </MuiLink>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}