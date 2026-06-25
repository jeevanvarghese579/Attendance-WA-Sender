import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from './context/AuthContext'
import { DataContextProvider } from './context/DataContext'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'))
const SelectAbsenteesPage = lazy(() => import('./pages/SelectAbsenteesPage'))
const AddStudentsPage = lazy(() => import('./pages/AddStudentsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

function FullScreenLoader() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress size={48} />
    </Box>
  )
}

function RequireAuth({ children }) {
  const { currentUser, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  if (!currentUser) return <Navigate to="/login" replace />
  return <DataContextProvider>{children}</DataContextProvider>
}

export default function App() {
  const { loading } = useAuth()
  if (loading) {
    return <FullScreenLoader />
  }
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/absentees" replace />} />
          <Route path="absentees" element={<SelectAbsenteesPage />} />
          <Route path="students" element={<AddStudentsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
