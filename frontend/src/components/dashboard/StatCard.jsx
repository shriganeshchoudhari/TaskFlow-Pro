import { Box, Card, CardContent, Typography, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export default function StatCard({ icon, label, value, loading, trend, trendLabel }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 1, display: 'flex' }}>
            {icon}
          </Box>
          {trend !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: trend >= 0 ? 'success.main' : 'error.main' }}>
              {trend >= 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
              <Typography variant="caption" fontWeight={600}>{Math.abs(trend)}%</Typography>
            </Box>
          )}
        </Box>
        {loading ? (
          <>
            <Skeleton width={60} height={40} />
            <Skeleton width={100} height={20} />
          </>
        ) : (
          <>
            <Typography variant="h4" fontWeight={700} mt={0.5}>
              {value ?? '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.25}>
              {label}
            </Typography>
            {trendLabel && (
              <Typography variant="caption" color="text.secondary">{trendLabel}</Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
