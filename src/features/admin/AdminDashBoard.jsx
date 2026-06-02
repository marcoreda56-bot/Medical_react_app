import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import {
  fetchAdminDashboardData,
  fetchAppointments,
  updateUserStatus,
  addSpecialty,
  updateSpecialty,
  deleteSpecialty,
  updateDoctorProfile,
} from '../../store/adminSlice';
import { Container, Typography, Paper, Tabs, Tab, Box } from '@mui/material';
import Swal from 'sweetalert2';
import { OverviewCards } from './components/OverviewCards';
import { UsersPanel } from './components/UsersPanel';
import { DoctorsPanel } from './components/DoctorsPanel';
import { SpecialtiesPanel } from './components/SpecialtiesPanel';
import { AppointmentsPanel } from './components/AppointmentsPanel';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { useLanguage } from '../../context/LanguageContext';

export const AdminDashBoard = () => {
  const { t } = useLanguage();
  const tabLabels = t('admin.tabs');
  const dispatch = useDispatch();
  const { currentUser } = useAuth();
  const { users, doctors, patients, specialties, appointments, slots, availabilities, error } = useSelector((state) => state.admin);

  const [activeTab, setActiveTab] = useState(0);
  const [specialtyForm, setSpecialtyForm] = useState({ name: '', description: '' });
  const [editingSpecialty, setEditingSpecialty] = useState(null);
  const [doctorDrafts, setDoctorDrafts] = useState({});
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState(null);

  const refreshAppointments = async () => {
    setAppointmentsLoading(true);
    setAppointmentsError(null);
    try {
      await dispatch(fetchAppointments()).unwrap();
    } catch (err) {
      setAppointmentsError(err.message || t('admin.noAppointments'));
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    dispatch(fetchAdminDashboardData());
  }, [currentUser, dispatch]);

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      totalDoctors: doctors.length,
      totalPatients: patients.length,
      pendingDoctors: doctors.filter((doctor) => doctor.status === 'pending').length,
      totalAppointments: appointments.length,
      totalSpecialties: specialties.length,
      totalSlots: slots.length,
      totalAvailabilities: availabilities.length,
    }),
    [users, doctors, patients, specialties, appointments, slots, availabilities]
  );

  const analyticsData = useMemo(() => {
    const normalize = (value, fallback) => {
      if (!value) return fallback;
      const trimmed = String(value).trim();
      return trimmed.length === 0 ? fallback : trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    };

    const userStatusCounts = users.reduce((acc, user) => {
      const status = normalize(user.status, 'Unknown');
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const appointmentStatusCounts = appointments.reduce((acc, appointment) => {
      const status = normalize(appointment.status, 'Pending');
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const specialtyCounts = doctors.reduce((acc, doctor) => {
      const specialty = doctor.profile?.specialty || 'Unassigned';
      acc[specialty] = (acc[specialty] || 0) + 1;
      return acc;
    }, {});

    return {
      userStatusCounts,
      appointmentStatusCounts,
      specialtyCounts,
    };
  }, [users, doctors, appointments]);

  const getDoctorDraft = (doctor) => ({
    specialty: doctorDrafts[doctor.id]?.specialty ?? doctor.profile?.specialty ?? '',
    bio: doctorDrafts[doctor.id]?.bio ?? doctor.profile?.bio ?? '',
    consultationFee: doctorDrafts[doctor.id]?.consultationFee ?? doctor.profile?.consultationFee ?? '',
    location: doctorDrafts[doctor.id]?.location ?? doctor.profile?.location ?? '',
    phone: doctorDrafts[doctor.id]?.phone ?? doctor.profile?.phone ?? '',
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
          consultationFee: draft.consultationFee,
          location: draft.location,
          phone: draft.phone,
          status: draft.status,
        })
      ).unwrap();
      showToast('success', t('admin.updated'));
    } catch (err) {
      showToast('error', t('admin.doctorUpdateFailed'), err.message || '');
    }
  };

  const handleUserStatusChange = async (userId, targetStatus) => {
    try {
      await dispatch(updateUserStatus({ userId, status: targetStatus })).unwrap();
      showToast('success', `${t('admin.updated')} ${t('statuses.' + targetStatus.toLowerCase())}`);
    } catch (err) {
      showToast('error', t('admin.userStatusChangeFailed'), err.message || '');
    }
  };

  const handleAddSpecialty = async () => {
    if (!specialtyForm.name.trim()) {
      showToast('warning', t('admin.specialtyNameRequired'));
      return;
    }

    try {
      await dispatch(addSpecialty({ name: specialtyForm.name, description: specialtyForm.description })).unwrap();
      setSpecialtyForm({ name: '', description: '' });
      showToast('success', t('admin.created'));
    } catch (err) {
      showToast('error', t('admin.specialtyAddFailed'), err.message || '');
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
      showToast('success', t('admin.updated'));
    } catch (err) {
      showToast('error', t('admin.specialtyUpdateFailed'), err.message || '');
    }
  };

  const handleDeleteSpecialty = async (specialtyId) => {
    const result = await Swal.fire({
      title: t('admin.deleteSpecialtyConfirm'),
      text: t('admin.deleteSpecialtyText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('common.yes'),
      cancelButtonText: t('common.cancel'),
    });
    if (!result.isConfirmed) return;

    try {
      await dispatch(deleteSpecialty({ specialtyId })).unwrap();
      showToast('success', t('admin.deleted'));
    } catch (err) {
      showToast('error', t('admin.specialtyDeleteFailed'), err.message || '');
    }
  };

  const usersList = users.length > 0
    ? users.filter((user) => user.role === 'doctor' || user.role === 'patient')
    : [...doctors, ...patients];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#00796b' }}>
        {t('admin.dashboard')}
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
        <AnalyticsPanel
          stats={stats}
          userStatusCounts={analyticsData.userStatusCounts}
          appointmentStatusCounts={analyticsData.appointmentStatusCounts}
          specialtyCounts={analyticsData.specialtyCounts}
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
