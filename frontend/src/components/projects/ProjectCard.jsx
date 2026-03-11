import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, CardContent, CardActionArea, Typography, Box, Chip,
  LinearProgress, AvatarGroup, Avatar, IconButton, Menu, MenuItem,
  Tooltip
} from '@mui/material';
import { MoreVert, People, CheckCircle } from '@mui/icons-material';

const STATUS_COLOR = { ACTIVE: 'success', ON_HOLD: 'warning', COMPLETED: 'info', ARCHIVED: 'default' };

export default function ProjectCard({ project, onArchive }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const completionPct = project.taskCount > 0
    ? Math.round((project.completedTaskCount / project.taskCount) * 100)
    : 0;

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleArchive = (e) => {
    e.stopPropagation();
    setAnchorEl(null);
    onArchive?.(project.id);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 3 },
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/projects/${project.id}`)}
        sx={{ flexGrow: 1, alignItems: 'flex-start', display: 'flex', flexDirection: 'column' }}
      >
        <CardContent sx={{ width: '100%', pb: 1 }}>
          {/* Header row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ flexGrow: 1, mr: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {project.name}
              </Typography>
              <Chip
                label={project.status}
                color={STATUS_COLOR[project.status] || 'default'}
                size="small"
                sx={{ mt: 0.5, textTransform: 'capitalize', fontSize: '0.7rem' }}
              />
            </Box>
            <IconButton size="small" onClick={handleMenuClick} aria-label="project options">
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>

          {/* Description */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.5em',
              mb: 2,
            }}
          >
            {project.description || 'No description provided.'}
          </Typography>

          {/* Progress bar */}
          <Box sx={{ mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" fontWeight={600}>
                {completionPct}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={completionPct}
              sx={{ borderRadius: 1, height: 6 }}
              color={completionPct === 100 ? 'success' : 'primary'}
            />
          </Box>

          {/* Footer row */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircle fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {project.completedTaskCount}/{project.taskCount} tasks
              </Typography>
            </Box>
            <Tooltip title={`${project.memberCount} members`}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <People fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {project.memberCount}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </CardContent>
      </CardActionArea>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setAnchorEl(null); navigate(`/projects/${project.id}`); }}>
          View Details
        </MenuItem>
        <MenuItem onClick={handleArchive} sx={{ color: 'warning.main' }}>
          Archive Project
        </MenuItem>
      </Menu>
    </Card>
  );
}
