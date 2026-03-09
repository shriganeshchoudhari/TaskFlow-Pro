// NotificationBell — Phase 4 placeholder
// Full implementation (dropdown, unread count, polling) in Phase 4 (Week 7–8).
import { IconButton, Badge, Tooltip } from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectUnreadCount } from '../../store/slices/notificationsSlice';

export default function NotificationBell() {
  const unreadCount = useSelector(selectUnreadCount);

  return (
    <Tooltip title="Notifications">
      <IconButton aria-label={`${unreadCount} unread notifications`} color="inherit">
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <Notifications />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}
