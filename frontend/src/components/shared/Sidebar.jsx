import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Typography, Divider
} from '@mui/material';
import {
  Dashboard, FolderOpen, AssignmentTurnedIn, Person, TaskAlt
} from '@mui/icons-material';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <Dashboard />,         path: '/dashboard' },
  { label: 'Projects',  icon: <FolderOpen />,         path: '/projects'  },
  { label: 'My Tasks',  icon: <AssignmentTurnedIn />, path: '/my-tasks'  },
  { label: 'Profile',   icon: <Person />,             path: '/profile'   },
];

function SidebarContent({ onClose }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Toolbar sx={{ px: 2 }}>
        <TaskAlt color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" fontWeight={700} color="primary">
          TaskFlow Pro
        </Typography>
      </Toolbar>
      <Divider />

      {/* Nav links */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {NAV_ITEMS.map(({ label, icon, path }) => {
          const active = location.pathname.startsWith(path);
          return (
            <ListItem key={path} disablePadding>
              <ListItemButton
                selected={active}
                onClick={() => handleNav(path)}
                aria-current={active ? 'page' : undefined}
                sx={{
                  mx: 1, borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
                <ListItemText primary={label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

export default function Sidebar({ drawerWidth, open, onClose }) {
  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <SidebarContent onClose={onClose} />
      </Drawer>

      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth, boxSizing: 'border-box',
            borderRight: '1px solid', borderColor: 'divider',
          },
        }}
        open
      >
        <SidebarContent />
      </Drawer>
    </>
  );
}
