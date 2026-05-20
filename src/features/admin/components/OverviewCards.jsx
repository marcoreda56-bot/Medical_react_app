import { Grid, Card, CardContent, Typography } from '@mui/material';

export const OverviewCards = ({ stats }) => {
  const items = [
    { title: 'Users', value: stats.totalUsers, color: '#388e3c' },
    { title: 'Doctors', value: stats.totalDoctors, color: '#1976d2' },
    { title: 'Pending Approvals', value: stats.pendingDoctors, color: '#f57c00' },
    { title: 'Appointments', value: stats.totalAppointments, color: '#7b1fa2' },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {items.map((item) => (
        <Grid item xs={12} sm={6} md={3} key={item.title}>
          <Card sx={{ borderLeft: `5px solid ${item.color}`, minHeight: 140, display: 'flex', alignItems: 'center' }}>
            <CardContent sx={{ width: '100%' }}>
              <Typography variant="subtitle2" sx={{ color: item.color, fontWeight: 'bold' }}>
                {item.title}
              </Typography>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
                {item.value}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
