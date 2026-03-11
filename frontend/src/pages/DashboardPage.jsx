import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Grid, Skeleton, Alert, Chip
} from '@mui/material';
import {
  Assignment, Schedule, FolderOpen, Notifications as NotifIcon
} from '@mui/icons-material';
import api from '../services/api';
import StatCard from '../components/dashboard/StatCard';
import { fetchMyTasks, selectMyTasks } from '../store/slices/tasksSlice';
import { selectProjects } from '../store/slices/projectsSlice';
import { fetchProjects } from '../store/slices/projectsSlice';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardActionArea, LinearProgress } from '@mui/material';
import { format } from 'date-fns';
import ActivityFeed from '../components/shared/ActivityFeed';
import { selectCurrentUser } from '../store/slices/authSlice';

const PRIORITY_COLOR = { CRITICAL: 'error', HIGH: 'warning', MEDIUM: 'primary', LOW: 'success' };

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const myTasks = useSelector(selectMyTasks);
  const projects = useSelector(selectProjects);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchMyTasks({ page: 0, size: 5 }));
    dispatch(fetchProjects({ status: 'ACTIVE' }));
    api.get('/dashboard/summary')
      .then((r) => setSummary(r.data))
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, [dispatch]);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={0.5}>
        Good {getGreeting()}, {currentUser?.fullName?.split(' ')[0] || 'there'}!
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Here's an overview of your work.
      </Typography>

      {/* Stat cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Assignment sx={{ color: 'primary.main' }} />}
            label="Active Tasks"
            value={summary?.myActiveTasks}
            loading={summaryLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Schedule sx={{ color: 'warning.main' }} />}
            label="Due This Week"
            value={summary?.dueThisWeek}
            loading={summaryLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<FolderOpen sx={{ color: 'success.main' }} />}
            label="Active Projects"
            value={summary?.activeProjects}
            loading={summaryLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<NotifIcon sx={{ color: 'secondary.main' }} />}
            label="Unread Notifications"
            value={summary?.unreadNotifications}
            loading={summaryLoading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* My Tasks widget */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" fontWeight={700} mb={1.5}>My Tasks</Typography>
          {myTasks.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No tasks assigned to you.</Typography>
          ) : (
            myTasks.slice(0, 5).map((task) => (
              <Card key={task.id} variant="outlined" sx={{ mb: 1, cursor: 'pointer' }}>
                <CardActionArea onClick={() => navigate(`/tasks/${task.id}`)}>
                  <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ flexGrow: 1, mr: 1 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{task.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{task.projectName}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={task.priority}
                          size="small"
                          color={PRIORITY_COLOR[task.priority] || 'default'}
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                        <Chip
                          label={task.status?.replace('_', ' ')}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      </Box>
                    </Box>
                    {task.dueDate && (
                      <Typography variant="caption" color={new Date(task.dueDate) < new Date() ? 'error' : 'text.secondary'}>
                        Due {format(new Date(task.dueDate), 'MMM d')}
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            ))
          )}
        </Grid>

        {/* My Projects widget */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" fontWeight={700} mb={1.5}>My Projects</Typography>
          <Grid container spacing={1.5}>
            {projects.slice(0, 6).map((project) => {
              const pct = project.taskCount > 0
                ? Math.round((project.completedTaskCount / project.taskCount) * 100)
                : 0;
              return (
                <Grid item xs={12} sm={6} key={project.id}>
                  <Card variant="outlined" sx={{ cursor: 'pointer' }}>
                    <CardActionArea onClick={() => navigate(`/projects/${project.id}`)}>
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{project.name}</Typography>
                        <Box sx={{ mt: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">Progress</Typography>
                            <Typography variant="caption" fontWeight={600}>{pct}%</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{ borderRadius: 1, height: 5 }}
                          />
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
