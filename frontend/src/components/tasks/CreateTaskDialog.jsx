import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Box, Chip
} from '@mui/material';
import { createTask } from '../../store/slices/tasksSlice';
import { selectProjectMembers } from '../../store/slices/projectsSlice';
import { useSnackbar } from 'notistack';

export default function CreateTaskDialog({ open, onClose, projectId }) {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const members = useSelector(selectProjectMembers(projectId));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigneeId: '',
    dueDate: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleAddTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (!form.tags.includes(tag) && form.tags.length < 10) {
        setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Task title is required.'); return; }
    setLoading(true);
    const payload = {
      ...form,
      assigneeId: form.assigneeId || null,
      dueDate: form.dueDate || null,
    };
    const result = await dispatch(createTask({ projectId, data: payload }));
    setLoading(false);
    if (createTask.fulfilled.match(result)) {
      enqueueSnackbar('Task created!', { variant: 'success' });
      setForm({ title: '', description: '', priority: 'MEDIUM', assigneeId: '', dueDate: '', tags: [] });
      onClose();
    } else {
      setError(result.payload || 'Failed to create task.');
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm({ title: '', description: '', priority: 'MEDIUM', assigneeId: '', dueDate: '', tags: [] });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle fontWeight={700}>New Task</DialogTitle>
      <DialogContent sx={{ pt: '16px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Task Title"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          autoFocus
          fullWidth
          inputProps={{ maxLength: 500 }}
        />

        <TextField
          label="Description (optional)"
          name="description"
          value={form.description}
          onChange={handleChange}
          multiline
          rows={3}
          fullWidth
        />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ flex: 1, minWidth: 130 }}>
            <InputLabel>Priority</InputLabel>
            <Select name="priority" value={form.priority} label="Priority" onChange={handleChange}>
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ flex: 1, minWidth: 160 }}>
            <InputLabel>Assignee</InputLabel>
            <Select name="assigneeId" value={form.assigneeId} label="Assignee" onChange={handleChange}>
              <MenuItem value="">Unassigned</MenuItem>
              {members.map((m) => (
                <MenuItem key={m.userId} value={m.userId}>{m.fullName}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TextField
          label="Due Date (optional)"
          name="dueDate"
          type="date"
          value={form.dueDate}
          onChange={handleChange}
          fullWidth
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: new Date().toISOString().split('T')[0] }}
        />

        {/* Tags */}
        <Box>
          <TextField
            label="Tags (press Enter to add)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            fullWidth
            placeholder="e.g. frontend, bug, urgent"
            size="small"
          />
          {form.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {form.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" onDelete={() => handleRemoveTag(tag)} />
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Create Task
        </Button>
      </DialogActions>
    </Dialog>
  );
}
