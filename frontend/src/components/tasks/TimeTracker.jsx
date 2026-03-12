import React, { useState } from 'react';
import { Box, Typography, TextField, Button, LinearProgress } from '@mui/material';
import { taskService } from '../../services/taskService';
import { useSnackbar } from 'notistack';

export default function TimeTracker({ taskId, estimatedHours, loggedHours, onUpdate }) {
  const [logHours, setLogHours] = useState('');
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleLogTime = async (e) => {
    e.preventDefault();
    const hours = parseFloat(logHours);
    if (isNaN(hours) || hours <= 0) return;
    
    try {
      setLoading(true);
      await taskService.logTime(taskId, hours);
      setLogHours('');
      onUpdate();
      enqueueSnackbar('Time logged successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to log time', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const currentLogged = loggedHours || 0;
  const currentEstimate = estimatedHours || 0;
  
  // Calculate progress safely
  let progress = 0;
  if (currentEstimate > 0) {
    progress = Math.min((currentLogged / currentEstimate) * 100, 100);
  } else if (currentLogged > 0) {
    progress = 100; // Over budget with no estimate
  }

  const isOverTime = currentEstimate > 0 && currentLogged > currentEstimate;

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} mb={1}>Time Tracking</Typography>
      
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2">{currentLogged.toFixed(1)}h logged</Typography>
          <Typography variant="body2" color="text.secondary">
            {currentEstimate ? `${currentEstimate}h estimated` : 'No estimate'}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          color={isOverTime ? "error" : "primary"}
          sx={{ height: 8, borderRadius: 4 }} 
        />
      </Box>

      <form onSubmit={handleLogTime} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <TextField
          size="small"
          type="number"
          inputProps={{ min: 0.1, step: 0.1 }}
          placeholder="Hours (e.g., 2.5)"
          value={logHours}
          onChange={(e) => setLogHours(e.target.value)}
          fullWidth
          disabled={loading}
        />
        <Button 
          type="submit" 
          variant="outlined" 
          disabled={!logHours || loading}
          size="small"
          sx={{ height: 40 }}
        >
          Log
        </Button>
      </form>
    </Box>
  );
}
