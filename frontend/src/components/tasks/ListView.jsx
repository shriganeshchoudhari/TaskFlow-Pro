import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TableSortLabel,
  TablePagination, Box, Chip, Typography, Avatar, Tooltip, Paper,
  Skeleton, TableContainer
} from '@mui/material';
import { useState } from 'react';
import { format } from 'date-fns';
import { selectAllTasks, selectTasksLoading } from '../../store/slices/tasksSlice';

const PRIORITY_COLOR = { CRITICAL: 'error', HIGH: 'warning', MEDIUM: 'primary', LOW: 'success' };
const STATUS_COLOR   = { TODO: 'default', IN_PROGRESS: 'primary', REVIEW: 'secondary', DONE: 'success' };

function descendingComparator(a, b, orderBy) {
  if (!b[orderBy]) return -1;
  if (!a[orderBy]) return 1;
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

const COLUMNS = [
  { id: 'priority', label: 'Priority', width: 110 },
  { id: 'title', label: 'Title', width: 'auto' },
  { id: 'status', label: 'Status', width: 130 },
  { id: 'assignee', label: 'Assignee', width: 160 },
  { id: 'dueDate', label: 'Due Date', width: 110 },
];

export default function ListView() {
  const navigate   = useNavigate();
  const tasks      = useSelector(selectAllTasks);
  const loading    = useSelector(selectTasksLoading);
  const [order, setOrder]     = useState('asc');
  const [orderBy, setOrderBy] = useState('priority');
  const [page, setPage]       = useState(0);
  const [rowsPerPage]         = useState(20);

  const handleSort = (col) => {
    const isAsc = orderBy === col && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(col);
  };

  const sorted = [...tasks].sort(getComparator(order, orderBy));
  const paged  = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2 }}>
      <TableContainer>
        <Table size="small" aria-label="tasks list">
          <TableHead>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableCell
                  key={col.id}
                  sx={{ width: col.width, fontWeight: 700, bgcolor: 'grey.50' }}
                >
                  {['priority', 'title', 'dueDate'].includes(col.id) ? (
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : 'asc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {COLUMNS.map((col) => (
                    <TableCell key={col.id}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  No tasks
                </TableCell>
              </TableRow>
            ) : (
              paged.map((task) => (
                <TableRow
                  key={task.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <TableCell>
                    <Chip label={task.priority} size="small" color={PRIORITY_COLOR[task.priority] || 'default'} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 320 }}>
                      {task.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.status?.replace('_', ' ')}
                      size="small"
                      color={STATUS_COLOR[task.status] || 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Avatar src={task.assignee.avatarUrl} sx={{ width: 22, height: 22, fontSize: '0.7rem' }}>
                          {task.assignee.fullName?.[0]?.toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                          {task.assignee.fullName}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">Unassigned</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <Typography
                        variant="body2"
                        color={new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'error' : 'inherit'}
                      >
                        {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </Typography>
                    ) : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={tasks.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[20]}
      />
    </Paper>
  );
}
