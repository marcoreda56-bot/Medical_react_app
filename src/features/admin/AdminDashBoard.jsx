import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
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
} from '../../store/adminSlice';
import { Container, Typography, Paper, Tabs, Tab, Box } from '@mui/material';
import Swal from 'sweetalert2';
import { OverviewCards } from './components/OverviewCards';
import { UsersPanel } from './components/UsersPanel';
import { DoctorsPanel } from './components/DoctorsPanel';
import { SpecialtiesPanel } from './components/SpecialtiesPanel';
import { AppointmentsPanel } from './components/AppointmentsPanel';
import { ConfigPanel } from './components/ConfigPanel';

const statusLabel = (status) => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const tabLabels = ['Users', 'Doctors', 'Specialties', 'Appointments', 'Config'];

export const AdminDashBoard = () => {
  const dispatch = useDispatch();
  const { currentUser } = useAuth();
  const { users, doctors, specialties, appointments, configs, error } = useSelector((state) => state.admin);

  const [activeTab, setActiveTab] = useState(0);
  const [specialtyForm, setSpecialtyForm] = useState({ name: '', description: '' });
  const [editingSpecialty, setEditingSpecialty] = useState(null);
  const [configForm, setConfigForm] = useState({ key: '', value: '' });
  const [editingConfig, setEditingConfig] = useState(null);
  const [doctorDrafts, setDoctorDrafts] = useState({});
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState(null);

  const refreshAppointments = async () => {
    setAppointmentsLoading(true);
    setAppointmentsError(null);
    try {
      await dispatch(fetchAppointments()).unwrap();
    } catch (err) {
      setAppointmentsError(err.message || 'Failed to load appointments');
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    dispatch(fetchAllUsers());
    dispatch(fetchDoctors());
    dispatch(fetchSpecialties());
    refreshAppointments();
    dispatch(fetchConfigs());
  }, [currentUser, dispatch]);

  useEffect(() => {
    if (activeTab === 3) {
      refreshAppointments();
    }
  }, [activeTab]);

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      totalDoctors: doctors.length,
      pendingDoctors: users.filter((user) => user.role === 'doctor' && user.status === 'pending').length,
      totalAppointments: appointments.length,
    }),
    [users, doctors, appointments]
  );

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

  const showToast = (icon, title, text) => {
    Swal.fire({ icon, title, text, timer: 1500, showConfirmButton: false });
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
      showToast('success', 'Doctor updated');
    } catch (err) {
      showToast('error', 'Failed to update doctor', err.message || '');
    }
  };

  const handleUserStatusChange = async (userId, targetStatus) => {
    try {
      await dispatch(updateUserStatus({ userId, status: targetStatus })).unwrap();
      showToast('success', `User ${statusLabel(targetStatus)}`);
    } catch (err) {
      showToast('error', 'Unable to change status', err.message || '');
    }
  };

  const handleAddSpecialty = async () => {
    if (!specialtyForm.name.trim()) {
      showToast('warning', 'Specialty name is required');
      return;
    }

    try {
      await dispatch(addSpecialty({ name: specialtyForm.name, description: specialtyForm.description })).unwrap();
      setSpecialtyForm({ name: '', description: '' });
      showToast('success', 'Specialty added');
    } catch (err) {
      showToast('error', 'Unable to add specialty', err.message || '');
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
        updateSpecialty({ specialtyId: editingSpecialty.id, name: specialtyForm.name, description: specialtyForm.description })
      ).unwrap();
      setEditingSpecialty(null);
      setSpecialtyForm({ name: '', description: '' });
      showToast('success', 'Specialty updated');
    } catch (err) {
      showToast('error', 'Could not update specialty', err.message || '');
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
      showToast('success', 'Deleted');
    } catch (err) {
      showToast('error', 'Unable to delete', err.message || '');
    }
  };

  const handleAddConfig = async () => {
    if (!configForm.key.trim() || !configForm.value.trim()) {
      showToast('warning', 'Config key and value are required');
      return;
    }

    try {
      await dispatch(addConfig({ configKey: configForm.key, configValue: configForm.value })).unwrap();
      setConfigForm({ key: '', value: '' });
      showToast('success', 'Config saved');
    } catch (err) {
      showToast('error', 'Unable to save config', err.message || '');
    }
  };

  const handleEditConfig = (config) => {
    setEditingConfig(config);
    setConfigForm({ key: config.key, value: config.value });
  };

  const handleSaveConfig = async () => {
    if (!editingConfig || !configForm.key.trim()) return;
    try {
      await dispatch(updateConfig({ configId: editingConfig.id, key: configForm.key, value: configForm.value })).unwrap();
      setEditingConfig(null);
      setConfigForm({ key: '', value: '' });
      showToast('success', 'Config updated');
    } catch (err) {
      showToast('error', 'Unable to update config', err.message || '');
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
      showToast('success', 'Config deleted');
    } catch (err) {
      showToast('error', 'Unable to delete', err.message || '');
    }
  };

  const usersList = users.filter((user) => user.role === 'doctor' || user.role === 'patient');

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#00796b' }}>
        Admin Control Center
      </Typography>

      <OverviewCards stats={stats} />

      <Paper elevation={3} sx={{ mb: 4, borderRadius: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(event, value) => setActiveTab(value)}
          indicatorColor="primary"
          textColor="primary"
          centered
          sx={{ '& .MuiTabs-indicator': { bgcolor: '#00796b', height: 4 } }}
        >
          {tabLabels.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
      </Paper>

      {activeTab === 0 && <UsersPanel usersList={usersList} onStatusChange={handleUserStatusChange} />}
      {activeTab === 1 && (
        <DoctorsPanel
          doctors={doctors}
          getDoctorDraft={getDoctorDraft}
          onDoctorDraftChange={handleDoctorDraftChange}
          onUpdateDoctor={handleUpdateDoctor}
        />
      )}
      {activeTab === 2 && (
        <SpecialtiesPanel
          specialties={specialties}
          specialtyForm={specialtyForm}
          onSpecialtyChange={setSpecialtyForm}
          onSubmit={editingSpecialty ? handleSaveSpecialty : handleAddSpecialty}
          editingSpecialty={editingSpecialty}
          onEdit={handleEditSpecialty}
          onCancel={() => {
            setEditingSpecialty(null);
            setSpecialtyForm({ name: '', description: '' });
          }}
          onDelete={handleDeleteSpecialty}
        />
      )}
      {activeTab === 3 && (
        <AppointmentsPanel
          appointments={appointments}
          onRefresh={refreshAppointments}
          loading={appointmentsLoading}
          error={appointmentsError}
        />
      )}
      {activeTab === 4 && (
        <ConfigPanel
          configs={configs}
          configForm={configForm}
          onConfigChange={setConfigForm}
          onSubmit={editingConfig ? handleSaveConfig : handleAddConfig}
          editingConfig={editingConfig}
          onEdit={handleEditConfig}
          onCancel={() => {
            setEditingConfig(null);
            setConfigForm({ key: '', value: '' });
          }}
          onDelete={handleDeleteConfig}
        />
      )}

      {error && (
        <Box sx={{ mt: 4, p: 2, bgcolor: '#ffebee', borderRadius: 2 }}>
          <Typography color="error">Error: {error}</Typography>
        </Box>
      )}
    </Container>
  );
};
