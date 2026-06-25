import React from 'react'
import { Alert, Box } from '@mui/material'

export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null
  return (
    <Box sx={{ mb: 2 }} className="fade-in">
      <Alert severity="error" onClose={onDismiss} variant="filled" sx={{ borderRadius: 2 }}>
        {message}
      </Alert>
    </Box>
  )
}
