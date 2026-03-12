import React, { useState } from 'react';
import { Box, Typography, Checkbox, IconButton, TextField, Button, List, ListItem, ListItemIcon, ListItemText, LinearProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { taskService } from '../../services/taskService';
import { useSnackbar } from 'notistack';

export default function SubtaskList({ taskId, subtasks = [], onUpdate }) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      setLoading(true);
      await taskService.addSubtask(taskId, newTaskTitle);
      setNewTaskTitle('');
      onUpdate();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to add subtask', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (subtaskId) => {
    try {
      await taskService.toggleSubtask(subtaskId);
      onUpdate();
    } catch (err) {
      enqueueSnackbar('Failed to update subtask', { variant: 'error' });
    }
  };

  const handleDelete = async (subtaskId) => {
    try {
      await taskService.deleteSubtask(subtaskId);
      onUpdate();
    } catch (err) {
      enqueueSnackbar('Failed to delete subtask', { variant: 'error' });
    }
  };

  const completedCount = subtasks.filter(s => s.isCompleted).length;
  const progress = subtasks.length === 0 ? 0 : (completedCount / subtasks.length) * 100;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={700}>Checklist</Typography>
        <Typography variant="caption" color="text.secondary">
          {completedCount} / {subtasks.length}
        </Typography>
      </Box>
      
      {subtasks.length > 0 && (
        <LinearProgress variant="determinate" value={progress} sx={{ mb: 2, height: 6, borderRadius: 3 }} />
      )}

      <List dense sx={{ mb: 1 }}>
        {subtasks.map((subtask) => (
          <ListItem
            key={subtask.id}
            secondaryAction={
              <IconButton edge="end" aria-label="delete" size="small" onClick={() => handleDelete(subtask.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            }
            disablePadding
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Checkbox
                edge="start"
                checked={subtask.isCompleted}
                onChange={() => handleToggle(subtask.id)}
                size="small"
              />
            </ListItemIcon>
            <ListItemText 
              primary={subtask.title} 
              sx={{ textDecoration: subtask.isCompleted ? 'line-through' : 'none', color: subtask.isCompleted ? 'text.secondary' : 'text.primary' }} 
            />
          </ListItem>
        ))}
      </List>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px' }}>
        <TextField
          size="small"
          placeholder="Add an item"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          fullWidth
          disabled={loading}
        />
        <Button 
          type="submit" 
          variant="contained" 
          disabled={!newTaskTitle.trim() || loading}
          size="small"
          sx={{ minWidth: 40, p: 0 }}
        >
          <AddIcon />
        </Button>
      </form>
    </Box>
  );
}
