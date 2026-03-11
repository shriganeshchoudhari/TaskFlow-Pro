import { useSelector } from 'react-redux';
import { Box, Typography, Divider, Button, Skeleton } from '@mui/material';
import { Add } from '@mui/icons-material';
import TaskCard from './TaskCard';
import { selectTasksByStatus, selectTasksLoading } from '../../store/slices/tasksSlice';

const COLUMNS = [
  { key: 'TODO',        label: 'To Do',       color: '#9e9e9e' },
  { key: 'IN_PROGRESS', label: 'In Progress',  color: '#1976d2' },
  { key: 'REVIEW',      label: 'In Review',    color: '#7b1fa2' },
  { key: 'DONE',        label: 'Done',         color: '#2e7d32' },
];

function Column({ column, onAddTask }) {
  const tasks = useSelector(selectTasksByStatus(column.key));
  const loading = useSelector(selectTasksLoading);

  return (
    <Box
      sx={{
        minWidth: 280,
        maxWidth: 320,
        flexShrink: 0,
        bgcolor: 'grey.100',
        borderRadius: 2,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Column header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: column.color }} />
          <Typography variant="subtitle2" fontWeight={700}>
            {column.label}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              bgcolor: 'grey.300',
              borderRadius: 10,
              px: 0.75,
              py: 0.15,
              fontWeight: 600,
            }}
          >
            {tasks.length}
          </Typography>
        </Box>
        {column.key === 'TODO' && onAddTask && (
          <Button
            size="small"
            startIcon={<Add />}
            onClick={onAddTask}
            sx={{ minWidth: 0, px: 1 }}
            aria-label="add task"
          >
            Add
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      {/* Task cards */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 1.5, borderRadius: 1 }} />
          ))
        ) : tasks.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              color: 'text.disabled',
              border: '2px dashed',
              borderColor: 'grey.300',
              borderRadius: 1,
            }}
          >
            <Typography variant="caption">No tasks</Typography>
          </Box>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </Box>
    </Box>
  );
}

export default function BoardView({ projectId, onAddTask }) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        overflowX: 'auto',
        pb: 2,
        // Horizontal scroll on mobile
        '& ::-webkit-scrollbar': { height: 6 },
      }}
    >
      {COLUMNS.map((col) => (
        <Column key={col.key} column={col} onAddTask={col.key === 'TODO' ? onAddTask : undefined} />
      ))}
    </Box>
  );
}
