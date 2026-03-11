import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Button, Grid, Chip, Stack, TextField,
  InputAdornment, Skeleton, Alert
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import {
  fetchProjects, archiveProject,
  selectProjects, selectProjectsLoading, selectProjectsError
} from '../store/slices/projectsSlice';
import ProjectCard from '../components/projects/ProjectCard';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import { useSnackbar } from 'notistack';

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'];

export default function ProjectListPage() {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const projects = useSelector(selectProjects);
  const loading  = useSelector(selectProjectsLoading);
  const error    = useSelector(selectProjectsError);

  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects(statusFilter !== 'ALL' ? { status: statusFilter } : {}));
  }, [dispatch, statusFilter]);

  const handleArchive = async (projectId) => {
    const result = await dispatch(archiveProject(projectId));
    if (archiveProject.fulfilled.match(result)) {
      enqueueSnackbar('Project archived.', { variant: 'info' });
    }
  };

  const filtered = search.trim()
    ? projects.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      )
    : projects;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Projects</Typography>
          <Typography variant="body2" color="text.secondary">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateOpen(true)}
          data-testid="new-project-btn"
        >
          New Project
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {STATUS_FILTERS.map((s) => (
            <Chip
              key={s}
              label={s.replace('_', ' ')}
              onClick={() => setStatusFilter(s)}
              variant={statusFilter === s ? 'filled' : 'outlined'}
              color={statusFilter === s ? 'primary' : 'default'}
              size="small"
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Stack>
        <TextField
          size="small"
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ ml: 'auto', minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
          <Typography variant="h6">No projects found</Typography>
          <Typography variant="body2" mt={1}>
            {search ? 'Try adjusting your search.' : 'Create your first project to get started.'}
          </Typography>
          {!search && (
            <Button variant="contained" startIcon={<Add />} sx={{ mt: 2 }} onClick={() => setCreateOpen(true)}>
              New Project
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filtered.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <ProjectCard project={project} onArchive={handleArchive} />
            </Grid>
          ))}
        </Grid>
      )}

      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </Box>
  );
}
