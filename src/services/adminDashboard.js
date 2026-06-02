import axiosInstance from '../api/axios';

export const fetchAdminDashboardData = async () => {
  const [
    users,
    doctors,
    patients,
    appointments,
    specialties,
    doctorProfiles,
    patientProfiles,
    slots,
    availabilities,
  ] = await Promise.all([
    axiosInstance.get('/users/'),
    axiosInstance.get('/users/?role=doctor'),
    axiosInstance.get('/users/?role=patient'),
    axiosInstance.get('/appointments/'),
    axiosInstance.get('/specialties/'),
    axiosInstance.get('/doctor-profiles/'),
    axiosInstance.get('/patient-profiles/'),
    axiosInstance.get('/slots/'),
    axiosInstance.get('/availabilities/'),
  ]);

  return {
    users: users.data,
    doctors: doctors.data,
    patients: patients.data,
    appointments: appointments.data,
    specialties: specialties.data,
    doctorProfiles: doctorProfiles.data,
    patientProfiles: patientProfiles.data,
    slots: slots.data,
    availabilities: availabilities.data,
  };
};
