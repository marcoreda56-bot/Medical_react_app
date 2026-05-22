import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Box, Typography, Paper, TablePagination } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';

const labelCase = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown');

export const UsersPanel = ({ usersList, onStatusChange }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const visibleUsers = useMemo(
    () => usersList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [usersList, page, rowsPerPage]
  );

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        All Users
      </Typography>
      <TableContainer>
        <Table>
          <TableHead sx={{ bgcolor: '#e8f5e9' }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usersList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  No doctors or patients available.
                </TableCell>
              </TableRow>
            ) : (
              visibleUsers.map((user) => (
                <TableRow key={user.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                  <TableCell>{user.name || 'Unknown'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{labelCase(user.role)}</TableCell>
                  <TableCell>
                    <Chip
                      label={labelCase(user.status)}
                      color={user.status === 'approved' ? 'success' : user.status === 'blocked' ? 'error' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {user.status !== 'approved' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => onStatusChange(user.id, 'approved')}
                        >
                          Approve
                        </Button>
                      )}
                      {user.status !== 'blocked' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<BlockIcon />}
                          onClick={() => onStatusChange(user.id, 'blocked')}
                        >
                          Block
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={usersList.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(event, newPage) => setPage(newPage)}
        rowsPerPageOptions={[5, 10, 25]}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </Paper>
  );
};
