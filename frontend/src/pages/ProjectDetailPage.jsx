import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Tabs, Tab, Chip, Button, AvatarGroup, Avatar,
  Skeleton, Alert, Breadcrumbs, Link
} from '@mui/material';
import { Add, FolderOpen } from '@mui/icons-material';
import { fetchProject, selectSelectedProject, selectProjectsLoading } from '../store/slices/projectsSlice';
import { fetchProjectTasks } from '../store/slices/tasksSlice';
import BoardView from '../components/tasks/BoardView';
import ListView from '../components/tasks/ListView';
import ProjectMembersPanel from '../components/projects/ProjectMembersPanel';
import CreateTaskDialog from '../components/tasks/CreateTaskDialog';
import ActivityFeed from '../components/shared/ActivityFeed';

const STATUS_COLOR = { ACTIVE: 'success', ON_HOLD: 'warning', COMPLETED: 'info', ARCHIVED: 'default' };

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const project = useSelector(selectSelectedProject);
  const loading = useSelector(selectProjectsLoading);
  const [tab, setTab] = useState(0);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProject(projectId));
    dispatch(fetchProjectTasks({ projectId, params: {} }));
  }, [dispatch, projectId]);

  if (loading && !project) {
    return (
      <Box>
        <Skeleton height={40} width={300} sx={{ mb: 2 }} />
        <Skeleton height={400} />
      </Box>
    );
  }

  if (!project) {
    return <Alert severity="error">Project not found.</Alert>;
  }

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link underline="hover" color="inherit" sx={{ cursor: 'pointer' }} onClick={() => navigate('/projects')}>
          Projects
        </Link>
        <Typography color="text.primary">{project.name}</Typography>
      </Breadcrumbs>

      {/* Sticky header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="h4" fontWeight={700}>{project.name}</Typography>
            <Chip
              label={project.status}
              color={STATUS_COLOR[project.status] || 'default'}
              size="small"
            />
            {project.visibility === 'PUBLIC' && (
              <Chip label="Public" variant="outlined" size="small" />
            )}
          </Box>
          {project.description && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {project.description}
            </Typography>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.75rem' } }}>
              {(project.memberCount > 0 ? Array.from({ length: Math.min(project.memberCount, 5) }) : []).map((_, i) => (
                <Avatar key={i} sx={{ bgcolor: 'primary.main' }}>?</Avatar>
              ))}
            </AvatarGroup>
            <Typography variant="caption" color="text.secondary">
              {project.memberCount} member{project.memberCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateTaskOpen(true)}
        >
          Add Task
        </Button>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Board" />
        <Tab label="List" />
        <Tab label="Members" />
        <Tab label="Activity" />
      </Tabs>

      {tab === 0 && <BoardView projectId={projectId} onAddTask={() => setCreateTaskOpen(true)} />}
      {tab === 1 && <ListView />}
      {tab === 2 && <ProjectMembersPanel projectId={projectId} />}
      {tab === 3 && <ActivityFeed entityType="project" entityId={projectId} />}

      <CreateTaskDialog
        open={createTaskOpen}
        onClose={() => setCreateTaskOpen(false)}
        projectId={projectId}
      />
    </Box>
  );
}
