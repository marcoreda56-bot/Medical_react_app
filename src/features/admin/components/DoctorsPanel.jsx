import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, FormControl, InputLabel, Select, MenuItem, Button, Typography, Paper } from '@mui/material';

export const DoctorsPanel = ({ doctors, getDoctorDraft, onDoctorDraftChange, onUpdateDoctor }) => {
  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Doctors Management
      </Typography>
      <TableContainer>
        <Table>
          <TableHead sx={{ bgcolor: '#e3f2fd' }}>
            <TableRow>
              <TableCell>Doctor Name</TableCell>
              <TableCell>Specialty</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Notes / Bio</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {doctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  No doctor records found.
                </TableCell>
              </TableRow>
            ) : (
              doctors.map((doctor) => {
                const draft = getDoctorDraft(doctor);
                return (
                  <TableRow key={doctor.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                    <TableCell>{doctor.name || doctor.email || 'Doctor'}</TableCell>
                    <TableCell>
                      <TextField
                        value={draft.specialty}
                        onChange={(e) => onDoctorDraftChange(doctor.id, 'specialty', e.target.value)}
                        size="small"
                        placeholder="Specialty"
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                          label="Status"
                          value={draft.status}
                          onChange={(e) => onDoctorDraftChange(doctor.id, 'status', e.target.value)}
                        >
                          <MenuItem value="approved">Approved</MenuItem>
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="blocked">Blocked</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={draft.bio}
                        onChange={(e) => onDoctorDraftChange(doctor.id, 'bio', e.target.value)}
                        size="small"
                        placeholder="Bio or notes"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="contained" size="small" onClick={() => onUpdateDoctor(doctor)}>
                        Save
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
