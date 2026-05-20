
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import {
  fetchAllUsers,
  fetchDoctors,
  fetchSpecialties,
  fetchAppointments,
  fetchConfigs,
  updateUserStatus,
  addSpecialty,
  updateSpecialty,
  deleteSpecialty,
  updateDoctorProfile,
  addConfig,
  updateConfig,
  deleteConfig,
} from '../store/adminSlice';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Swal from 'sweetalert2';

const statusLabel = (status) => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const AdminDashBoard = () => {
  const dispatch = useDispatch();
  const { currentUser } = useAuth();
  const {
    users,
    doctors,
    specialties,
    appointments,
    configs,
    status,
    error,
  } = useSelector((state) => state.admin);

  const [activeTab, setActiveTab] = useState(0);
  const [specialtyForm, setSpecialtyForm] = useState({ name: '', description: '' });
  const [editingSpecialty, setEditingSpecialty] = useState(null);
  const [configForm, setConfigForm] = useState({ key: '', value: '' });
  const [editingConfig, setEditingConfig] = useState(null);
  const [doctorDrafts, setDoctorDrafts] = useState({});

  useEffect(() => {
    if (!currentUser) return;
    dispatch(fetchAllUsers());
    dispatch(fetchDoctors());
    dispatch(fetchSpecialties());
    dispatch(fetchAppointments());
    dispatch(fetchConfigs());
  }, [currentUser, dispatch]);

  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalDoctors: doctors.length,
    pendingDoctors: users.filter((user) => user.role === 'doctor' && user.status === 'pending').length,
    totalAppointments: appointments.length,
  }), [users, doctors, appointments]);

  const getDoctorDraft = (doctor) => ({
    specialty: doctorDrafts[doctor.id]?.specialty ?? doctor.profile?.specialty ?? '',
    bio: doctorDrafts[doctor.id]?.bio ?? doctor.profile?.bio ?? '',
    status: doctorDrafts[doctor.id]?.status ?? doctor.status ?? 'pending',
  });

  const handleDoctorDraftChange = (doctorId, field, value) => {
    setDoctorDrafts((prev) => ({
      ...prev,
      [doctorId]: {
        ...prev[doctorId],
        [field]: value,
      },
    }));
  };

  const handleUpdateDoctor = async (doctor) => {
    const draft = getDoctorDraft(doctor);
    try {
      await dispatch(
        updateDoctorProfile({
          doctorId: doctor.id,
          specialty: draft.specialty,
          bio: draft.bio,
          status: draft.status,
        })
      ).unwrap();
      Swal.fire({ icon: 'success', title: 'Doctor updated', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed to update doctor', text: err.message || '' });
    }
  };

  const handleUserStatusChange = async (userId, targetStatus) => {
    try {
      await dispatch(updateUserStatus({ userId, status: targetStatus })).unwrap();
      Swal.fire({ icon: 'success', title: `User ${statusLabel(targetStatus)}`, timer: 1400, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Unable to change status', text: err.message || '' });
    }
  };

  const handleAddSpecialty = async () => {
    if (!specialtyForm.name.trim()) {
      Swal.fire({ icon: 'warning', title: 'Specialty name is required' });
      return;
    }
    try {
      await dispatch(addSpecialty({
        name: specialtyForm.name,
        description: specialtyForm.description,
      })).unwrap();
      setSpecialtyForm({ name: '', description: '' });
      Swal.fire({ icon: 'success', title: 'Specialty added', timer: 1400, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Unable to add specialty', text: err.message || '' });
    }
  };

  const handleEditSpecialty = (specialty) => {
    setEditingSpecialty(specialty);
    setSpecialtyForm({ name: specialty.name, description: specialty.description });
  };

  const handleSaveSpecialty = async () => {
    if (!editingSpecialty || !specialtyForm.name.trim()) return;
    try {
      await dispatch(
        updateSpecialty({
          specialtyId: editingSpecialty.id,
          name: specialtyForm.name,
          description: specialtyForm.description,
        })
      ).unwrap();
      setEditingSpecialty(null);
      setSpecialtyForm({ name: '', description: '' });
      Swal.fire({ icon: 'success', title: 'Specialty updated', timer: 1400, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Could not update specialty', text: err.message || '' });
    }
  };

  const handleDeleteSpecialty = async (specialtyId) => {
    const result = await Swal.fire({
      title: 'Delete specialty?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;

    try {
      await dispatch(deleteSpecialty({ specialtyId })).unwrap();
      Swal.fire({ icon: 'success', title: 'Deleted', timer: 1400, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Unable to delete', text: err.message || '' });
    }
  };

  const handleAddConfig = async () => {
    if (!configForm.key.trim() || !configForm.value.trim()) {
      Swal.fire({ icon: 'warning', title: 'Config key and value are required' });
      return;
    }
    try {
      await dispatch(addConfig({ configKey: configForm.key, configValue: configForm.value })).unwrap();
      setConfigForm({ key: '', value: '' });
      Swal.fire({ icon: 'success', title: 'Config saved', timer: 1400, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Unable to save config', text: err.message || '' });
    }
  };

  const handleEditConfig = (config) => {
    setEditingConfig(config);
    setConfigForm({ key: config.key, value: config.value });
  };

  const handleSaveConfig = async () => {
    if (!editingConfig || !configForm.key.trim()) return;
    try {
      await dispatch(
        updateConfig({
          configId: editingConfig.id,
          key: configForm.key,
          value: configForm.value,
        })
      ).unwrap();
      setEditingConfig(null);
      setConfigForm({ key: '', value: '' });
      Swal.fire({ icon: 'success', title: 'Config updated', timer: 1400, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Unable to update config', text: err.message || '' });
    }
  };

  const handleDeleteConfig = async (configId) => {
    const result = await Swal.fire({
      title: 'Delete configuration?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    try {
      await dispatch(deleteConfig({ configId })).unwrap();
      Swal.fire({ icon: 'success', title: 'Config deleted', timer: 1400, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Unable to delete', text: err.message || '' });
    }
  };

  const usersList = users.filter((user) => user.role === 'doctor' || user.role === 'patient');

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#00796b' }}>
        Admin Control Center
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { title: 'Users', value: stats.totalUsers, color: '#388e3c' },
          { title: 'Doctors', value: stats.totalDoctors, color: '#1976d2' },
          { title: 'Pending Approvals', value: stats.pendingDoctors, color: '#f57c00' },
          { title: 'Appointments', value: stats.totalAppointments, color: '#7b1fa2' },
        ].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.title}>
            <Card sx={{ borderLeft: `5px solid ${item.color}`, minHeight: 120 }}>
              <CardContent>
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

      <Paper elevation={3} sx={{ mb: 4, borderRadius: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(event, value) => setActiveTab(value)}
          indicatorColor="primary"
          textColor="primary"
          centered
          sx={{ '& .MuiTabs-indicator': { bgcolor: '#00796b', height: 4 } }}
        >
          <Tab label="Users" />
          <Tab label="Doctors" />
          <Tab label="Specialties" />
          <Tab label="Appointments" />
          <Tab label="Config" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
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
                  usersList.map((user) => (
                    <TableRow key={user.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                      <TableCell>{user.name || 'Unknown'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{statusLabel(user.role)}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabel(user.status)}
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
                              onClick={() => handleUserStatusChange(user.id, 'approved')}
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
                              onClick={() => handleUserStatusChange(user.id, 'blocked')}
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
        </Paper>
      )}

      {activeTab === 1 && (
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
                            onChange={(e) => handleDoctorDraftChange(doctor.id, 'specialty', e.target.value)}
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
                              onChange={(e) => handleDoctorDraftChange(doctor.id, 'status', e.target.value)}
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
                            onChange={(e) => handleDoctorDraftChange(doctor.id, 'bio', e.target.value)}
                            size="small"
                            placeholder="Bio or notes"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleUpdateDoctor(doctor)}
                            startIcon={<EditIcon />}
                          >
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
      )}

      {activeTab === 2 && (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Specialties Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <TextField
              label="Specialty"
              value={specialtyForm.name}
              onChange={(e) => setSpecialtyForm((prev) => ({ ...prev, name: e.target.value }))}
              sx={{ minWidth: 240 }}
            />
            <TextField
              label="Description"
              value={specialtyForm.description}
              onChange={(e) => setSpecialtyForm((prev) => ({ ...prev, description: e.target.value }))}
              sx={{ minWidth: 360 }}
            />
            <Button
              variant="contained"
              startIcon={<AddCircleIcon />}
              onClick={editingSpecialty ? handleSaveSpecialty : handleAddSpecialty}
            >
              {editingSpecialty ? 'Save Specialty' : 'Add Specialty'}
            </Button>
            {editingSpecialty && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setEditingSpecialty(null);
                  setSpecialtyForm({ name: '', description: '' });
                }}
              >
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
                        <IconButton onClick={() => handleEditSpecialty(specialty)} size="small" color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteSpecialty(specialty.id)} size="small" color="error">
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
      )}

      {activeTab === 3 && (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Appointments Overview
          </Typography>
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
                      <TableCell>{appointment.day ? `${appointment.day} ${appointment.time || ''}` : appointment.date || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabel(appointment.status)}
                          color={appointment.status === 'Approved' || appointment.status === 'approved' ? 'success' : appointment.status === 'Cancelled' || appointment.status === 'cancelled' ? 'error' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>{appointment.notes || appointment.reason || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {activeTab === 4 && (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            System Configuration
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <TextField
              label="Config Key"
              value={configForm.key}
              onChange={(e) => setConfigForm((prev) => ({ ...prev, key: e.target.value }))}
              sx={{ minWidth: 220 }}
            />
            <TextField
              label="Config Value"
              value={configForm.value}
              onChange={(e) => setConfigForm((prev) => ({ ...prev, value: e.target.value }))}
              sx={{ minWidth: 320 }}
            />
            <Button
              variant="contained"
              startIcon={<AddCircleIcon />}
              onClick={editingConfig ? handleSaveConfig : handleAddConfig}
            >
              {editingConfig ? 'Save Config' : 'Add Config'}
            </Button>
            {editingConfig && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setEditingConfig(null);
                  setConfigForm({ key: '', value: '' });
                }}
              >
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
                        <IconButton onClick={() => handleEditConfig(config)} size="small" color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteConfig(config.id)} size="small" color="error">
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
      )}

      {error && (
        <Box sx={{ mt: 4, p: 2, bgcolor: '#ffebee', borderRadius: 2 }}>
          <Typography color="error">Error: {error}</Typography>
        </Box>
      )}
    </Container>
  );
};
