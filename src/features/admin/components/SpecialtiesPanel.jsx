import { Box, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Typography, Paper } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export const SpecialtiesPanel = ({
  specialties,
  specialtyForm,
  onSpecialtyChange,
  onSubmit,
  editingSpecialty,
  onEdit,
  onCancel,
  onDelete,
}) => {
  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Specialties Management
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <TextField
          label="Specialty"
          value={specialtyForm.name}
          onChange={(e) => onSpecialtyChange((prev) => ({ ...prev, name: e.target.value }))}
          sx={{ minWidth: 240 }}
        />
        <TextField
          label="Description"
          value={specialtyForm.description}
          onChange={(e) => onSpecialtyChange((prev) => ({ ...prev, description: e.target.value }))}
          sx={{ minWidth: 360 }}
        />
        <Button variant="contained" startIcon={<EditIcon />} onClick={onSubmit}>
          {editingSpecialty ? 'Save Specialty' : 'Add Specialty'}
        </Button>
        {editingSpecialty && (
          <Button variant="outlined" color="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </Box>
      <TableContainer>
        <Table>
          <TableHead sx={{ bgcolor: '#f3e5f5' }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {specialties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  No specialties configured yet.
                </TableCell>
              </TableRow>
            ) : (
              specialties.map((specialty) => (
                <TableRow key={specialty.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                  <TableCell>{specialty.name}</TableCell>
                  <TableCell>{specialty.description || '—'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => onEdit(specialty)} size="small" color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => onDelete(specialty.id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
