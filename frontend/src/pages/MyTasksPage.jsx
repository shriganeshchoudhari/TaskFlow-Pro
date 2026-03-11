import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { useState } from 'react';
import { fetchMyTasks, selectMyTasks, selectTasksLoading } from '../store/slices/tasksSlice';
import BoardView from '../components/tasks/BoardView';
import ListView from '../components/tasks/ListView';
import { useSelector as useReduxSelector } from 'react-redux';

export default function MyTasksPage() {
  const dispatch = useDispatch();
  const [tab, setTab] = useState(0);

  useEffect(() => {
    dispatch(fetchMyTasks({}));
  }, [dispatch]);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={1}>My Tasks</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        All tasks assigned to you across all projects.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Board" />
        <Tab label="List" />
      </Tabs>

      {tab === 0 && <BoardView />}
      {tab === 1 && <ListView />}
    </Box>
  );
}
