import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControl, InputLabel, Select,
  MenuItem, CircularProgress, Alert
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { createProject } from '../../store/slices/projectsSlice';
import { useSnackbar } from 'notistack';

export default function CreateProjectModal({ open, onClose }) {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    visibility: 'PRIVATE',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Project name is required.'); return; }
    setLoading(true);
    const result = await dispatch(createProject(form));
    setLoading(false);
    if (createProject.fulfilled.match(result)) {
      enqueueSnackbar('Project created successfully!', { variant: 'success' });
      setForm({ name: '', description: '', visibility: 'PRIVATE' });
      onClose();
    } else {
      setError(result.payload || 'Failed to create project.');
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm({ name: '', description: '', visibility: 'PRIVATE' });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle fontWeight={700}>New Project</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          fullWidth
          label="Project Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          autoFocus
          sx={{ mb: 2 }}
          inputProps={{ maxLength: 255 }}
        />
        <TextField
          fullWidth
          label="Description (optional)"
          name="description"
          value={form.description}
          onChange={handleChange}
          multiline
          rows={3}
          sx={{ mb: 2 }}
          inputProps={{ maxLength: 5000 }}
        />
        <FormControl fullWidth>
          <InputLabel>Visibility</InputLabel>
          <Select
            name="visibility"
            value={form.visibility}
            label="Visibility"
            onChange={handleChange}
          >
            <MenuItem value="PRIVATE">Private — Only members can see</MenuItem>
            <MenuItem value="PUBLIC">Public — Visible to all users</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Create Project
        </Button>
      </DialogActions>
    </Dialog>
  );
}
