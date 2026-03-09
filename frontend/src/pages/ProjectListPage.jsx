// ProjectListPage — Phase 2 placeholder
import { Box, Typography, Paper } from '@mui/material';
import { FolderOpen } from '@mui/icons-material';

export default function ProjectListPage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>Projects</Typography>
      <Paper sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
        <FolderOpen sx={{ fontSize: 64, mb: 2, opacity: 0.4 }} />
        <Typography variant="h6">Projects coming in Phase 2</Typography>
      </Paper>
    </Box>
  );
}
