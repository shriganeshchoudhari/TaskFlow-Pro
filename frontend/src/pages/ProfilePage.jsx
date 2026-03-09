// ProfilePage — Phase 5 placeholder
import { Box, Typography, Paper } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';

export default function ProfilePage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Profile</Typography>
      <Paper sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
        <AccountCircle sx={{ fontSize: 64, mb: 2, opacity: 0.4 }} />
        <Typography variant="h6">Profile settings coming in Phase 5</Typography>
      </Paper>
    </Box>
  );
}
