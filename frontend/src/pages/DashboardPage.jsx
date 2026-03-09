// DashboardPage — Phase 5 placeholder
// Full implementation in Phase 5 (Week 9–10)
import { Box, Typography, Paper } from '@mui/material';
import { Dashboard as DashboardIcon } from '@mui/icons-material';

export default function DashboardPage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Dashboard</Typography>
      <Paper sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
        <DashboardIcon sx={{ fontSize: 64, mb: 2, opacity: 0.4 }} />
        <Typography variant="h6">Dashboard coming in Phase 5</Typography>
        <Typography variant="body2" mt={1}>
          Stats, My Tasks widget, Recent Activity and My Projects grid will be built here.
        </Typography>
      </Paper>
    </Box>
  );
}
