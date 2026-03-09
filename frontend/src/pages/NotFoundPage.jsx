import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { SentimentDissatisfied } from '@mui/icons-material';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50',
      }}
    >
      <SentimentDissatisfied sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h3" fontWeight={700} color="text.secondary">404</Typography>
      <Typography variant="h6" color="text.secondary" mb={3}>Page not found</Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard')}>
        Go to Dashboard
      </Button>
    </Box>
  );
}
