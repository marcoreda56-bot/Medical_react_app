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
import Swal from 'sweetalert2';
import { OverviewCards } from './components/OverviewCards';
import { UsersPanel } from './components/UsersPanel';
import { DoctorsPanel } from './components/DoctorsPanel';
import { SpecialtiesPanel } from './components/SpecialtiesPanel';
import { AppointmentsPanel } from './components/AppointmentsPanel';
import { ConfigPanel } from './components/ConfigPanel';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { useLanguage } from '../../context/LanguageContext';
import { Users, Stethoscope, Award, Calendar, Settings, BarChart3, Menu, X } from 'lucide-react';

export const AdminDashBoard = () => {
  const { t } = useLanguage();
  const tabLabels = t('admin.tabs');
  const dispatch = useDispatch();
  const { currentUser } = useAuth();
  const { users, doctors, specialties, appointments, configs, error } = useSelector((state) => state.admin);

  const [activeTab, setActiveTab] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [specialtyForm, setSpecialtyForm] = useState({ name: '', description: '' });
  const [editingSpecialty, setEditingSpecialty] = useState(null);
  const [configForm, setConfigForm] = useState({ key: '', value: '' });
  const [editingConfig, setEditingConfig] = useState(null);
  const [doctorDrafts, setDoctorDrafts] = useState({});
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState(null);

  const tabIcons = [Users, Stethoscope, Award, Calendar, Settings, BarChart3];

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
    dispatch(fetchAllUsers());
    dispatch(fetchDoctors());
    dispatch(fetchSpecialties());
    dispatch(fetchAppointments());
    dispatch(fetchConfigs());
  }, [currentUser, dispatch]);

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      totalDoctors: doctors.length,
      pendingDoctors: doctors.filter((d) => d.status === 'pending').length,
      totalAppointments: appointments.length,
      totalSpecialties: specialties.length,
    }),
    [users, doctors, specialties, appointments]
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

    // BUG FIX #2: كان acc[acc] بدل acc[specialty] — كل الـ counts كانت بتتحسب على undefined
    const specialtyCounts = doctors.reduce((acc, doctor) => {
      const specialty = doctor.specialty_name || 'Unassigned';
      acc[specialty] = (acc[specialty] || 0) + 1;
      return acc;
    }, {});

    return {
      userStatusCounts,
      appointmentStatusCounts,
      specialtyCounts,
      totalConfigs: configs.length,
    };
  }, [users, doctors, appointments, configs]);

  const getDoctorDraft = (doctor) => ({
    specialty: doctorDrafts[doctor.id]?.specialty ?? doctor.specialty_name ?? '',
    bio: doctorDrafts[doctor.id]?.bio ?? doctor.bio ?? '',
    consultationFee: doctorDrafts[doctor.id]?.consultationFee ?? doctor.consultation_fee ?? '',
    location: doctorDrafts[doctor.id]?.location ?? doctor.clinic_address ?? '',
    phone: doctorDrafts[doctor.id]?.phone ?? doctor.clinic_phone ?? doctor.phone ?? '',
    status: doctorDrafts[doctor.id]?.status ?? doctor.status ?? 'pending',
  });

  const handleDoctorDraftChange = (doctorId, field, value) => {
    setDoctorDrafts((prev) => ({
      ...prev,
      [doctorId]: { ...prev[doctorId], [field]: value },
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
      // re-fetch عشان يتحدث الـ status في الـ list
      dispatch(fetchAllUsers());
    } catch (err) {
      showToast('error', t('admin.userStatusChangeFailed'), err.message || '');
    }
  };

  // BUG FIX #3: كان مفيش unwrap() ولا re-fetch — دلوقتي بيعمل approve صح ويحدث الـ UI
  const handleApproveDoctor = async (doctorId) => {
    try {
      await dispatch(updateUserStatus({ userId: doctorId, status: 'approved' })).unwrap();
      showToast('success', t('admin.updated') || 'Doctor approved successfully!');
      // إعادة تحميل الـ doctors عشان الـ badge يتحدث فوراً
      dispatch(fetchDoctors());
      dispatch(fetchAllUsers());
    } catch (err) {
      showToast('error', t('admin.userStatusChangeFailed') || 'Approval failed', err.message || '');
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

  const handleAddConfig = async () => {
    if (!configForm.key.trim() || !configForm.value.trim()) {
      showToast('warning', t('admin.configKeyValueRequired'));
      return;
    }
    try {
      await dispatch(addConfig({ configKey: configForm.key, configValue: configForm.value })).unwrap();
      setConfigForm({ key: '', value: '' });
      showToast('success', t('admin.created'));
    } catch (err) {
      showToast('error', t('admin.configSaveFailed'), err.message || '');
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
      showToast('success', t('admin.updated'));
    } catch (err) {
      showToast('error', t('admin.configUpdateFailed'), err.message || '');
    }
  };

  const handleDeleteConfig = async (configId) => {
    const result = await Swal.fire({
      title: t('admin.deleteConfigConfirm'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('common.yes'),
      cancelButtonText: t('common.cancel'),
    });
    if (!result.isConfirmed) return;
    try {
      await dispatch(deleteConfig({ configId })).unwrap();
      showToast('success', t('admin.deleted'));
    } catch (err) {
      showToast('error', t('admin.configDeleteFailed'), err.message || '');
    }
  };

  const usersList = users.filter((user) => user.role === 'doctor' || user.role === 'patient');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-teal-700 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">{t('admin.dashboard')}</h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 rounded-md hover:bg-teal-600">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed md:sticky top-0 inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 transform md:transform-none transition-transform duration-300 flex flex-col justify-between ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div>
          <div className="p-6 border-b border-slate-100 hidden md:block">
            <h1 className="text-2xl font-bold text-teal-700">{t('admin.dashboard')}</h1>
          </div>
          <nav className="p-4 space-y-1">
            {tabLabels && tabLabels.map((label, idx) => {
              const Icon = tabIcons[idx] || Settings;
              return (
                <button
                  key={label}
                  onClick={() => { setActiveTab(idx); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTab === idx
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center">
          Medical System v2.0
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{tabLabels[activeTab]}</h2>
          <p className="text-sm text-slate-500">Manage your system configurations and overview analytics data.</p>
        </div>

        <OverviewCards stats={stats} />

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5 md:p-6">
          {activeTab === 0 && <UsersPanel usersList={usersList} onStatusChange={handleUserStatusChange} />}
          {activeTab === 1 && (
            <DoctorsPanel
              doctors={doctors}
              getDoctorDraft={getDoctorDraft}
              onDoctorDraftChange={handleDoctorDraftChange}
              onUpdateDoctor={handleUpdateDoctor}
              onApprove={handleApproveDoctor}
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
              onCancel={() => { setEditingSpecialty(null); setSpecialtyForm({ name: '', description: '' }); }}
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
              onCancel={() => { setEditingConfig(null); setConfigForm({ key: '', value: '' }); }}
              onDelete={handleDeleteConfig}
            />
          )}
          {activeTab === 5 && (
            <AnalyticsPanel
              userStatusCounts={analyticsData.userStatusCounts}
              appointmentStatusCounts={analyticsData.appointmentStatusCounts}
              specialtyCounts={analyticsData.specialtyCounts}
            />
          )}
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
            Error: {error}
          </div>
        )}
      </main>
    </div>
  );
};