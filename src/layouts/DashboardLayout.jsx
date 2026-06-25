import React, { useMemo, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Chip,
  useMediaQuery,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  FormControl,
  InputLabel,
  Stack,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import GroupIcon from '@mui/icons-material/Group'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import DashboardIcon from '@mui/icons-material/Dashboard'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SchoolIcon from '@mui/icons-material/School'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

const DRAWER_WIDTH = 270

const NAV_ITEMS = [
  { label: 'Select Absentees', to: '/absentees', icon: <HowToRegIcon /> },
  { label: 'Add Students', to: '/students', icon: <GroupIcon /> },
  { label: 'Settings', to: '/settings', icon: <SettingsIcon /> },
]

export default function DashboardLayout() {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const { currentUser, logout, profile, isDemoMode } = useAuth()
  const {
    classes,
    activeClassId,
    activeClass,
    setActiveClassId,
    addClassEntry,
    renameClass,
    deleteClassEntry,
    students,
  } = useData()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)

  // Class dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const drawerWidth = collapsed && isDesktop ? 72 : DRAWER_WIDTH
  const open = isDesktop || mobileOpen

  const handleDrawerToggle = () => setMobileOpen((o) => !o)
  const handleCollapse = () => setCollapsed((c) => !c)
  const handleMenu = (e) => setAnchorEl(e.currentTarget)
  const handleMenuClose = () => setAnchorEl(null)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const displayName = profile?.email || currentUser?.email || 'Teacher'
  const initials = useMemo(() => {
    const [a, b] = (profile?.email || currentUser?.email || 'T').split('@')[0].split(/[\.\-_]/)
    return (a?.[0] || 'T') + (b?.[0] || '')
  }, [profile, currentUser])

  const currentPage = useMemo(() => {
    return NAV_ITEMS.find((n) => location.pathname.startsWith(n.to))?.label || 'Dashboard'
  }, [location.pathname])

  const handleAddClass = () => {
    const trimmed = newClassName.trim()
    if (!trimmed) return
    addClassEntry(trimmed)
    setNewClassName('')
    setAddDialogOpen(false)
  }

  const handleRenameClass = () => {
    const trimmed = renameValue.trim()
    if (!trimmed || !activeClassId) return
    renameClass(activeClassId, trimmed)
    setRenameDialogOpen(false)
  }

  const handleDeleteClass = () => {
    if (!activeClassId) return
    deleteClassEntry(activeClassId)
    setDeleteDialogOpen(false)
  }

  const collapsedNow = collapsed && isDesktop

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, #14241a 0%, #0f1410 100%)'
          : 'linear-gradient(180deg, #ffffff 0%, #f4f7f5 100%)',
      }}
    >
      {/* Brand header */}
      <Toolbar
        sx={{
          gap: 1.5,
          minHeight: 64,
          px: collapsedNow ? 1.5 : 2.5,
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg, #2e7d32, #128c7e)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(46,125,50,0.4)',
            }}
          >
            <DashboardIcon fontSize="small" />
          </Box>
          {!collapsedNow && (
            <Box sx={{ overflow: 'hidden' }}>
              <Typography sx={{ fontWeight: 700, lineHeight: 1.1 }} noWrap>
                Attendance
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ lineHeight: 1, display: 'block' }}
                noWrap
              >
                WA Messenger
              </Typography>
            </Box>
          )}
        </Box>
        {isDesktop && (
          <IconButton
            onClick={handleCollapse}
            sx={{ display: { md: collapsedNow ? 'none' : 'inline-flex' } }}
            size="small"
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
        {!isDesktop && (
          <IconButton onClick={handleDrawerToggle} size="small">
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />

      {/* Class selector */}
      {!collapsedNow && (
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
            <SchoolIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
            <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1, fontSize: 10 }}>
              Class
            </Typography>
          </Stack>

          {classes.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              No classes yet
            </Typography>
          ) : (
            <FormControl fullWidth size="small" sx={{ mb: 1 }}>
              <Select
                value={activeClassId || ''}
                onChange={(e) => setActiveClassId(e.target.value)}
                displayEmpty
                sx={{ borderRadius: 2, fontWeight: 600, fontSize: 14 }}
              >
                {classes.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {activeClassId && (
            <Chip
              size="small"
              label={`${students.length} students`}
              sx={{ mr: 0.5, mb: 0.5, height: 22, fontSize: 11 }}
              color="primary"
              variant="outlined"
            />
          )}

          <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
            <Tooltip title="Add class">
              <IconButton
                size="small"
                color="primary"
                onClick={() => { setNewClassName(''); setAddDialogOpen(true) }}
                sx={{ borderRadius: 1.5 }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {activeClassId && (
              <>
                <Tooltip title="Rename class">
                  <IconButton
                    size="small"
                    onClick={() => { setRenameValue(activeClass?.name || ''); setRenameDialogOpen(true) }}
                    sx={{ borderRadius: 1.5 }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete class">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteDialogOpen(true)}
                    sx={{ borderRadius: 1.5 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Stack>
        </Box>
      )}

      {collapsedNow && activeClassId && (
        <Tooltip title={activeClass?.name || 'Class'} placement="right">
          <Box
            sx={{
              mx: 1,
              mt: 1,
              mb: 0.5,
              display: 'grid',
              placeItems: 'center',
              height: 40,
              borderRadius: 2,
              background: (t) => alpha(t.palette.primary.main, 0.1),
            }}
          >
            <SchoolIcon color="primary" fontSize="small" />
          </Box>
        </Tooltip>
      )}

      <Divider />

      {/* Nav */}
      <List sx={{ flex: 1, px: 1.5, py: 1 }}>
        {NAV_ITEMS.map((item) => (
          <ListItem key={item.to} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={NavLink}
              to={item.to}
              onClick={() => !isDesktop && setMobileOpen(false)}
              sx={{
                borderRadius: 2,
                minHeight: 48,
                px: collapsedNow ? 1.5 : 2,
                justifyContent: collapsedNow ? 'center' : 'flex-start',
                gap: 1.5,
                color: 'text.primary',
                transition: 'all 0.2s ease',
                '&.active': {
                  backgroundColor: (t) => alpha(t.palette.primary.main, 0.13),
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                  boxShadow: 'inset 3px 0 0 currentColor',
                },
                '&:hover': {
                  backgroundColor: (t) => alpha(t.palette.primary.main, 0.08),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, color: 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              {!collapsedNow && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Expand button when collapsed */}
      {isDesktop && collapsed && (
        <Box sx={{ px: 1.5, pb: 1 }}>
          <ListItemButton
            onClick={handleCollapse}
            sx={{ borderRadius: 2, justifyContent: 'center', minHeight: 44 }}
          >
            <MenuIcon />
          </ListItemButton>
        </Box>
      )}

      <Divider />
      {isDemoMode && !collapsedNow && (
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Chip
            size="small"
            label="Demo mode"
            color="warning"
            variant="filled"
            sx={{ fontSize: 11, height: 22 }}
          />
        </Box>
      )}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      {/* App bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          transition: 'width 0.25s ease, margin 0.25s ease',
          backgroundColor: (t) =>
            t.palette.mode === 'dark'
              ? alpha(t.palette.background.paper, 0.92)
              : alpha('#1b5e20', 0.96),
          color: '#fff',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          {!isDesktop && (
            <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 1.5 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }} noWrap>
            {currentPage}
          </Typography>
          <ThemeToggle />
          <Tooltip title={displayName}>
            <IconButton onClick={handleMenu} color="inherit" sx={{ ml: 0.5 }}>
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: 'rgba(255,255,255,0.18)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {initials.toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{ sx: { mt: 1.5, minWidth: 220, borderRadius: 3 } }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem sx={{ pointerEvents: 'none' }}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <Box sx={{ overflow: 'hidden' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  Signed in as
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {displayName}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => { handleMenuClose(); handleLogout() }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 }, transition: 'width 0.25s ease' }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none', boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open={open}
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              border: 'none',
              boxSizing: 'border-box',
              transition: 'width 0.25s ease',
              overflowX: 'hidden',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          transition: 'width 0.25s ease',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: 'auto', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Box>
      </Box>

      {/* Add class dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Class</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Class Name"
            fullWidth
            size="small"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setAddDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleAddClass} variant="contained" disabled={!newClassName.trim()}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Rename class dialog */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Rename Class</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Class Name"
            fullWidth
            size="small"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameClass()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setRenameDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleRenameClass} variant="contained" disabled={!renameValue.trim()}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete class dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete class?</DialogTitle>
        <DialogContent>
          <Typography>
            Deleting <strong>{activeClass?.name}</strong> will permanently remove all its students. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteClass} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
