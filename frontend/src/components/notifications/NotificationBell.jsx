import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  IconButton, Badge, Tooltip, Popover, Box, Typography, List,
  ListItem, ListItemText, Button, Divider, CircularProgress, Avatar
} from '@mui/material';
import { Notifications, Circle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  fetchNotifications, markNotificationRead, markAllNotificationsRead,
  selectNotifications, selectUnreadCount, selectNotificationsLoading
} from '../../store/slices/notificationsSlice';
import useWebSocket from '../../hooks/useWebSocket';

export default function NotificationBell() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const notifications = useSelector(selectNotifications);
  const unreadCount   = useSelector(selectUnreadCount);
  const loading       = useSelector(selectNotificationsLoading);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const { isConnected, subscribe } = useWebSocket();

  const load = () => dispatch(fetchNotifications({}));

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (isConnected) {
      const subscription = subscribe('/user/queue/notifications', (notification) => {
        // When a real-time notification arrives, we can append it directly to the 
        // redux store, or simply trigger a fresh fetch to ensure order is correct.
        // Doing a quick refresh is safest.
        load();
      });

      return () => {
        if (subscription) subscription.unsubscribe();
      };
    }
  }, [isConnected, subscribe]);

  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
    load(); // Refresh on open
  };

  const handleClose = () => setAnchorEl(null);

  const handleClick = async (notification) => {
    if (!notification.isRead) {
      dispatch(markNotificationRead(notification.id));
    }
    handleClose();
    if (notification.taskId) {
      navigate(`/tasks/${notification.taskId}`);
    }
  };

  const handleMarkAllRead = () => dispatch(markAllNotificationsRead());

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleOpen}
          aria-label={`${unreadCount} unread notifications`}
          aria-haspopup="true"
          aria-expanded={open}
        >
          <Badge badgeContent={unreadCount} color="error" max={99} aria-live="polite">
            <Notifications />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: { xs: '100vw', sm: 380 },
            maxHeight: 480,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />

        {/* List */}
        <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
          {loading && notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <Notifications sx={{ fontSize: 40, opacity: 0.3 }} />
              <Typography variant="body2">No notifications</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {notifications.map((n, idx) => (
                <Box key={n.id}>
                  <ListItem
                    button
                    onClick={() => handleClick(n)}
                    sx={{
                      bgcolor: n.isRead ? 'transparent' : 'primary.50',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    alignItems="flex-start"
                  >
                    <Box sx={{ display: 'flex', width: '100%', gap: 1, alignItems: 'flex-start' }}>
                      {!n.isRead && (
                        <Circle sx={{ fontSize: 8, color: 'primary.main', mt: 0.8, flexShrink: 0 }} />
                      )}
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={n.isRead ? 400 : 600}>
                            {n.message}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {n.createdAt ? format(new Date(n.createdAt), 'MMM d, h:mm a') : ''}
                          </Typography>
                        }
                        sx={{ m: 0 }}
                      />
                    </Box>
                  </ListItem>
                  {idx < notifications.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
}
