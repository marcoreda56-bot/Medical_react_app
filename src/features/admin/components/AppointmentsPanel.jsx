import { Box, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Typography, Paper } from '@mui/material';

const statusColor = (status) => {
  if (!status) return 'warning';
  const normalized = status.toLowerCase();
  if (normalized === 'approved') return 'success';
  if (normalized === 'cancelled') return 'error';
  return 'warning';
};

const formatDateValue = (value) => {
  if (!value) return '—';
  if (typeof value === 'string') return value;
  if (value?.toDate instanceof Function) return value.toDate().toLocaleString();
  if (typeof value === 'object' && value.seconds != null && value.nanoseconds != null) {
    return new Date(value.seconds * 1000).toLocaleString();
  }
  return String(value);
};

export const AppointmentsPanel = ({ appointments, onRefresh, loading, error }) => {
  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Appointments Overview
        </Typography>
        <Button variant="outlined" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <TableContainer>
        <Table>
          <TableHead sx={{ bgcolor: '#e0f7fa' }}>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Date / Slot</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  No appointments found.
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((appointment) => (
                <TableRow key={appointment.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                  <TableCell>{appointment.patientName || appointment.patientId || 'Unknown'}</TableCell>
                  <TableCell>{appointment.doctorName || appointment.doctorId || 'Unknown'}</TableCell>
                  <TableCell>{appointment.day ? `${appointment.day} ${appointment.time || ''}` : formatDateValue(appointment.date)}</TableCell>
                  <TableCell>
                    <Chip label={appointment.status || 'Pending'} color={statusColor(appointment.status)} size="small" />
                  </TableCell>
                  <TableCell>{appointment.notes || appointment.reason || '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
