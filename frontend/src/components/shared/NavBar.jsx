import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppBar, Toolbar, Typography, IconButton, Avatar, Menu,
  MenuItem, Box, Badge, Tooltip, Divider
} from '@mui/material';
import {
  Menu as MenuIcon, TaskAlt, AccountCircle, Logout, Settings
} from '@mui/icons-material';
import { logoutUser, selectCurrentUser } from '../../store/slices/authSlice';
import NotificationBell from '../notifications/NotificationBell';

export default function NavBar({ drawerWidth, onMenuClick }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <AppBar
      position="fixed"
      data-testid="nav-bar"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        bgcolor: 'white',
        color: 'text.primary',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { md: 'none' } }}
          data-testid="hamburger-menu"
          aria-label="open navigation"
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', mr: 2 }}>
          <TaskAlt color="primary" />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Menu */}
        <Tooltip title={user?.fullName || 'Account'}>
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            data-testid="user-menu"
            aria-label="user menu"
          >
            {user?.avatarUrl ? (
              <Avatar src={user.avatarUrl} sx={{ width: 32, height: 32 }} />
            ) : (
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {user?.fullName?.[0]?.toUpperCase()}
              </Avatar>
            )}
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem disabled>
            <Box>
              <Typography variant="subtitle2">{user?.fullName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }}>
            <Settings fontSize="small" sx={{ mr: 1 }} /> Profile Settings
          </MenuItem>
          <MenuItem onClick={handleLogout} data-testid="logout-button">
            <Logout fontSize="small" sx={{ mr: 1 }} /> Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
