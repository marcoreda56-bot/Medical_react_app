import { Grid, Paper, Typography, Box, List, ListItem, ListItemText } from '@mui/material';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const buildItems = (counts) =>
  Object.entries(counts).map(([key, value]) => ({
    name: `${key.replace(/([A-Z])/g, ' $1').replace(/\b\w/g, (c) => c.toUpperCase())}`,
    value,
  }));

const COLORS = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#0288d1', '#9c27b0'];

export const AnalyticsPanel = ({ stats, userStatusCounts, appointmentStatusCounts, specialtyCounts, totalConfigs }) => {
  const userItems = buildItems(userStatusCounts);
  const appointmentItems = buildItems(appointmentStatusCounts);
  const specialtyItems = Object.entries(specialtyCounts || {}).map(([name, value]) => ({ name, value }));

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
        System Analytics
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }} elevation={3}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              Appointment Status Chart
            </Typography>
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={appointmentItems} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {appointmentItems.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }} elevation={3}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              User Status Distribution
            </Typography>
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={userItems} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }} elevation={3}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
              Doctors by Specialty
            </Typography>
            <List disablePadding>
              {specialtyItems.length === 0 ? (
                <Typography color="text.secondary">No specialty data available.</Typography>
              ) : (
                specialtyItems.map((item, index) => (
                  <ListItem key={item.name} sx={{ py: 1, px: 0 }}>
                    <ListItemText primary={item.name} />
                    <Typography variant="subtitle2">{item.value}</Typography>
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
