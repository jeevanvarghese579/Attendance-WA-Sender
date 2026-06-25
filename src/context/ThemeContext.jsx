import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { createTheme, ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material'

const ThemeContext = createContext(null)

export function useThemeMode() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeMode must be used within ThemeContextProvider')
  return ctx
}

function getInitialMode() {
  try {
    const stored = localStorage.getItem('absenteeManager:themeMode')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // ignore
  }
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function ThemeContextProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode)

  useEffect(() => {
    try {
      localStorage.setItem('absenteeManager:themeMode', mode)
    } catch {
      // ignore
    }
  }, [mode])

  const toggleColorMode = () => setMode((m) => (m === 'light' ? 'dark' : 'light'))

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#2e7d32',
            light: '#4caf50',
            dark: '#1b5e20',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#00897b',
            contrastText: '#ffffff',
          },
          success: {
            main: '#2e7d32',
          },
          warning: {
            main: '#ed6c02',
          },
          error: {
            main: '#d32f2f',
          },
          whatsapp: {
            main: '#25d366',
            dark: '#128c7e',
            contrastText: '#ffffff',
          },
          background: {
            default: mode === 'dark' ? '#0f1410' : '#f4f7f5',
            paper: mode === 'dark' ? '#1a221c' : '#ffffff',
          },
        },
        shape: { borderRadius: 14 },
        typography: {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          h4: { fontWeight: 700 },
          h5: { fontWeight: 700 },
          h6: { fontWeight: 600 },
          button: { textTransform: 'none', fontWeight: 600 },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: { borderRadius: 12, transition: 'all 0.2s ease' },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 18,
                transition: 'box-shadow 0.25s ease, transform 0.25s ease',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              rounded: { borderRadius: 14 },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                transition: 'background-color 0.3s ease',
              },
            },
          },
        },
      }),
    [mode]
  )

  const value = useMemo(
    () => ({ mode, toggleColorMode }),
    [mode]
  )

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}
