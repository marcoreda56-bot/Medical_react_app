import { Box, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Typography, Paper } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export const ConfigPanel = ({ configs, configForm, onConfigChange, onSubmit, editingConfig, onEdit, onCancel, onDelete }) => {
  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        System Configuration
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <TextField
          label="Config Key"
          value={configForm.key}
          onChange={(e) => onConfigChange((prev) => ({ ...prev, key: e.target.value }))}
          sx={{ minWidth: 220 }}
        />
        <TextField
          label="Config Value"
          value={configForm.value}
          onChange={(e) => onConfigChange((prev) => ({ ...prev, value: e.target.value }))}
          sx={{ minWidth: 320 }}
        />
        <Button variant="contained" startIcon={<EditIcon />} onClick={onSubmit}>
          {editingConfig ? 'Save Config' : 'Add Config'}
        </Button>
        {editingConfig && (
          <Button variant="outlined" color="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </Box>
      <TableContainer>
        <Table>
          <TableHead sx={{ bgcolor: '#f1f8e9' }}>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {configs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  No system configuration entries yet.
                </TableCell>
              </TableRow>
            ) : (
              configs.map((config) => (
                <TableRow key={config.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                  <TableCell>{config.key}</TableCell>
                  <TableCell>{config.value}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => onEdit(config)} size="small" color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => onDelete(config.id)} size="small" color="error">
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
