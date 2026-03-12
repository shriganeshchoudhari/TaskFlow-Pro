import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Chip, Select, MenuItem, FormControl,
  Breadcrumbs, Link, Avatar, Grid, Skeleton, Alert, Divider,
  TextField, Button, IconButton, Tooltip
} from '@mui/material';
import { Edit, Save, Cancel, CalendarToday, Person, Flag } from '@mui/icons-material';
import { format } from 'date-fns';
import {
  fetchTask, updateTask, updateTaskStatus, deleteTask,
  selectSelectedTask, selectTasksLoading
} from '../store/slices/tasksSlice';
import { attachmentService } from '../services/taskService';
import CommentSection from '../components/tasks/CommentSection';
import ActivityFeed from '../components/shared/ActivityFeed';
import FileUploadZone from '../components/tasks/FileUploadZone';
import SubtaskList from '../components/tasks/SubtaskList';
import TimeTracker from '../components/tasks/TimeTracker';
import { useSnackbar } from 'notistack';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
const STATUS_COLOR = { TODO: 'default', IN_PROGRESS: 'primary', REVIEW: 'secondary', DONE: 'success' };
const PRIORITY_COLOR = { CRITICAL: 'error', HIGH: 'warning', MEDIUM: 'primary', LOW: 'success' };

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const task = useSelector(selectSelectedTask);
  const loading = useSelector(selectTasksLoading);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    dispatch(fetchTask(taskId));
    fetchAttachments();
  }, [dispatch, taskId]);

  const fetchAttachments = async () => {
    try {
      const data = await attachmentService.getAttachments(taskId);
      setAttachments(data);
    } catch (err) {
      console.error('Failed to load attachments', err);
    }
  };

  const handleFileUpload = async (file) => {
    try {
      setUploading(true);
      await attachmentService.uploadAttachment(taskId, file);
      enqueueSnackbar('File uploaded successfully', { variant: 'success' });
      fetchAttachments();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to upload file', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadAttachment = async (attachment) => {
    try {
      const blob = await attachmentService.downloadAttachment(attachment.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      enqueueSnackbar('Failed to download attachment', { variant: 'error' });
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;
    try {
      await attachmentService.deleteAttachment(attachmentId);
      enqueueSnackbar('Attachment deleted', { variant: 'success' });
      fetchAttachments();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete attachment', { variant: 'error' });
    }
  };

  useEffect(() => {
    if (task) setTitleValue(task.title);
  }, [task?.id]);

  if (loading && !task) {
    return (
      <Box>
        <Skeleton width={300} height={30} sx={{ mb: 1 }} />
        <Skeleton height={500} />
      </Box>
    );
  }

  if (!task) return <Alert severity="error">Task not found.</Alert>;

  const handleStatusChange = async (newStatus) => {
    const result = await dispatch(updateTaskStatus({ taskId: task.id, status: newStatus, optimisticTask: task }));
    if (updateTaskStatus.rejected.match(result)) {
      enqueueSnackbar(result.payload?.message || 'Invalid status transition.', { variant: 'error' });
    } else {
      enqueueSnackbar('Status updated.', { variant: 'success' });
    }
  };

  const handleTitleSave = async () => {
    if (!titleValue.trim() || titleValue === task.title) { setEditingTitle(false); return; }
    await dispatch(updateTask({ taskId: task.id, data: { title: titleValue } }));
    setEditingTitle(false);
    enqueueSnackbar('Task updated.', { variant: 'success' });
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    await dispatch(deleteTask(task.id));
    enqueueSnackbar('Task deleted.', { variant: 'info' });
    navigate(-1);
  };

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link underline="hover" color="inherit" sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/projects')}>Projects</Link>
        <Link underline="hover" color="inherit" sx={{ cursor: 'pointer' }}
          onClick={() => navigate(`/projects/${task.projectId}`)}>
          {task.projectName || 'Project'}
        </Link>
        <Typography color="text.primary" noWrap sx={{ maxWidth: 200 }}>
          {task.title}
        </Typography>
      </Breadcrumbs>

      <Grid container spacing={3}>
        {/* Left — main content (70%) */}
        <Grid item xs={12} md={8}>
          {/* Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            {editingTitle ? (
              <>
                <TextField
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={{ flexGrow: 1 }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave();
                    if (e.key === 'Escape') { setEditingTitle(false); setTitleValue(task.title); }
                  }}
                />
                <IconButton size="small" onClick={handleTitleSave} aria-label="save title">
                  <Save />
                </IconButton>
                <IconButton size="small" onClick={() => { setEditingTitle(false); setTitleValue(task.title); }}
                  aria-label="cancel edit">
                  <Cancel />
                </IconButton>
              </>
            ) : (
              <>
                <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>
                  {task.title}
                </Typography>
                <Tooltip title="Edit title">
                  <IconButton size="small" onClick={() => setEditingTitle(true)} aria-label="edit title">
                    <Edit />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>

          {/* Priority + Status row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
            <Chip
              icon={<Flag />}
              label={task.priority}
              color={PRIORITY_COLOR[task.priority] || 'default'}
              size="small"
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                aria-label="task status"
              >
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Description */}
          <Typography variant="subtitle2" fontWeight={700} mb={1}>Description</Typography>
          <Typography variant="body2" color={task.description ? 'text.primary' : 'text.secondary'}
            sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
            {task.description || 'No description provided.'}
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {/* Subtasks */}
          <SubtaskList 
            taskId={taskId} 
            subtasks={task.subtasks} 
            onUpdate={() => dispatch(fetchTask(taskId))} 
          />

          <Divider sx={{ my: 3 }} />

          {/* Attachments */}
          <Typography variant="subtitle2" fontWeight={700} mb={1}>Attachments</Typography>
          <Box sx={{ mb: 2 }}>
            <FileUploadZone onFileUpload={handleFileUpload} isUploading={uploading} />
          </Box>
          {attachments.length > 0 && (
            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {attachments.map((att) => (
                <Box key={att.id} sx={{ display: 'flex', alignItems: 'center', p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <InsertDriveFileIcon color="action" sx={{ mr: 1 }} />
                  <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <Typography variant="body2" noWrap title={att.fileName}>{att.fileName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(att.fileSize / 1024).toFixed(1)} KB • {format(new Date(att.createdAt), 'MMM d, p')}
                    </Typography>
                  </Box>
                  <Tooltip title="Download">
                    <IconButton size="small" onClick={() => handleDownloadAttachment(att)}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => handleDeleteAttachment(att.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          )}

          <Divider sx={{ mb: 3 }} />

          {/* Comments */}
          <CommentSection taskId={taskId} />

          <Divider sx={{ my: 3 }} />

          {/* Activity */}
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Activity</Typography>
          <ActivityFeed entityType="task" entityId={taskId} />
        </Grid>

        {/* Right sidebar (30%) */}
        <Grid item xs={12} md={4}>
          <Box
            sx={{
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
            }}
          >
            <Typography variant="subtitle2" fontWeight={700} mb={2}>Details</Typography>

            {/* Assignee */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Assignee
              </Typography>
              {task.assignee ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar src={task.assignee.avatarUrl} sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                    {task.assignee.fullName?.[0]?.toUpperCase()}
                  </Avatar>
                  <Typography variant="body2">{task.assignee.fullName}</Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">Unassigned</Typography>
              )}
            </Box>

            {/* Reporter */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Reporter
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={task.reporter?.avatarUrl} sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>
                  {task.reporter?.fullName?.[0]?.toUpperCase()}
                </Avatar>
                <Typography variant="body2">{task.reporter?.fullName}</Typography>
              </Box>
            </Box>

            {/* Due date */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Due Date
              </Typography>
              <Typography variant="body2" color={task.dueDate && new Date(task.dueDate) < new Date() ? 'error' : 'inherit'}>
                {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '—'}
              </Typography>
            </Box>

            {/* Tags */}
            {task.tags?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {task.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Box>
              </Box>
            )}

            {/* Created */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Created
              </Typography>
              <Typography variant="body2">
                {task.createdAt ? format(new Date(task.createdAt), 'MMM d, yyyy') : '—'}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Time Tracker */}
            <TimeTracker 
              taskId={taskId} 
              estimatedHours={task.estimatedHours} 
              loggedHours={task.loggedHours} 
              onUpdate={() => dispatch(fetchTask(taskId))} 
            />

            <Divider sx={{ my: 2 }} />
            
            <Button
              variant="outlined"
              color="error"
              fullWidth
              size="small"
              onClick={handleDelete}
            >
              Delete Task
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
