import { useNavigate } from 'react-router-dom';
import {
  Card, CardActionArea, CardContent, Typography, Box, Chip,
  Avatar, Tooltip, Badge
} from '@mui/material';
import { Comment, CalendarToday } from '@mui/icons-material';
import { format, isPast, isToday } from 'date-fns';

const PRIORITY_COLOR = { CRITICAL: '#c62828', HIGH: '#e65100', MEDIUM: '#1976d2', LOW: '#2e7d32' };
const PRIORITY_BORDER = { CRITICAL: '#c62828', HIGH: '#e65100', MEDIUM: '#1976d2', LOW: '#2e7d32' };

export default function TaskCard({ task }) {
  const navigate = useNavigate();

  const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue  = dueDateObj && isPast(dueDateObj) && task.status !== 'DONE';
  const isDueToday = dueDateObj && isToday(dueDateObj);

  return (
    <Card
      variant="outlined"
      data-testid={`task-card-${task.id}`}
      data-priority={task.priority}
      sx={{
        mb: 1.5,
        borderLeft: `4px solid ${PRIORITY_BORDER[task.priority] || '#1976d2'}`,
        transition: 'box-shadow 0.15s',
        '&:hover': { boxShadow: 2 },
      }}
    >
      <CardActionArea onClick={() => navigate(`/tasks/${task.id}`)}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          {/* Tags (up to 3) */}
          {task.tags?.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.75 }}>
              {task.tags.slice(0, 3).map((tag) => (
                <Chip key={tag} label={tag} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
              ))}
              {task.tags.length > 3 && (
                <Chip label={`+${task.tags.length - 3}`} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
              )}
            </Box>
          )}

          {/* Title */}
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 1,
            }}
          >
            {task.title}
          </Typography>

          {/* Footer */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Due date */}
              {dueDateObj && (
                <Box
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.3,
                    color: isOverdue ? 'error.main' : isDueToday ? 'warning.main' : 'text.secondary',
                  }}
                >
                  <CalendarToday sx={{ fontSize: 12 }} />
                  <Typography variant="caption">
                    {format(dueDateObj, 'MMM d')}
                  </Typography>
                </Box>
              )}

              {/* Comment count */}
              {task.commentCount > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: 'text.secondary' }}>
                  <Comment sx={{ fontSize: 12 }} />
                  <Typography variant="caption">{task.commentCount}</Typography>
                </Box>
              )}
            </Box>

            {/* Assignee avatar */}
            {task.assignee && (
              <Tooltip title={task.assignee.fullName}>
                <Avatar
                  src={task.assignee.avatarUrl}
                  sx={{ width: 24, height: 24, fontSize: '0.7rem' }}
                >
                  {task.assignee.fullName?.[0]?.toUpperCase()}
                </Avatar>
              </Tooltip>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
