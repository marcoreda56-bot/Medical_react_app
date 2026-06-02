import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../api/axios';

const initialState = {
    users: [],
    doctors: [],
    specialties: [],
    appointments: [],
    configs: [],
    status: 'idle',
    error: null,
};

export const fetchAllUsers = createAsyncThunk(
    'admin/fetchAllUsers',
    async () => {
        const res = await axiosInstance.get('/users/');
        return res.data;
    }
);

export const fetchDoctors = createAsyncThunk('admin/fetchDoctors', async () => {
    const res = await axiosInstance.get('/doctors/');
    return res.data;
});

export const fetchSpecialties = createAsyncThunk(
    'admin/fetchSpecialties',
    async () => {
        const res = await axiosInstance.get('/specialties/');
        return res.data;
    }
);

export const fetchAppointments = createAsyncThunk(
    'admin/fetchAppointments',
    async () => {
        const res = await axiosInstance.get('/appointments/');
        return res.data;
    }
);

export const fetchConfigs = createAsyncThunk('admin/fetchConfigs', async () => {
    return [];
});

export const updateUserStatus = createAsyncThunk(
    'admin/updateUserStatus',
    async ({ userId, status }) => {
        if (status === 'approved')
            await axiosInstance.post(`/users/${userId}/approve/`);
        else if (status === 'blocked')
            await axiosInstance.post(`/users/${userId}/block/`);
        return { userId, status };
    }
);

export const addSpecialty = createAsyncThunk(
    'admin/addSpecialty',
    async ({ name, description }) => {
        const res = await axiosInstance.post('/specialties/', { name, description });
        return res.data;
    }
);

export const updateSpecialty = createAsyncThunk(
    'admin/updateSpecialty',
    async ({ specialtyId, name, description }) => {
        const res = await axiosInstance.patch(`/specialties/${specialtyId}/`, { name, description });
        return { specialtyId, ...res.data };
    }
);

export const deleteSpecialty = createAsyncThunk(
    'admin/deleteSpecialty',
    async ({ specialtyId }) => {
        await axiosInstance.delete(`/specialties/${specialtyId}/`);
        return { specialtyId };
    }
);

// BUG FIX #4: كان بيبعت bio بس — دلوقتي بيبعت كل الحقول صح
export const updateDoctorProfile = createAsyncThunk(
    'admin/updateDoctorProfile',
    async ({ doctorId, specialty, bio, consultationFee, location, phone, status }) => {
        // 1. تحديث بيانات الـ profile
        await axiosInstance.patch(`/doctor-profiles/${doctorId}/`, {
            bio,
            consultation_fee: consultationFee,
            clinic_address: location,
            clinic_phone: phone,
        });

        // 2. تحديث الـ status لو اتغير
        if (status === 'approved')
            await axiosInstance.post(`/users/${doctorId}/approve/`);
        if (status === 'blocked')
            await axiosInstance.post(`/users/${doctorId}/block/`);

        return { doctorId, specialty, bio, consultationFee, location, phone, status };
    }
);

export const addConfig = createAsyncThunk(
    'admin/addConfig',
    async ({ configKey, configValue }) => {
        return { id: Date.now(), key: configKey, value: configValue };
    }
);

export const updateConfig = createAsyncThunk(
    'admin/updateConfig',
    async ({ configId, key, value }) => {
        return { configId, key, value };
    }
);

export const deleteConfig = createAsyncThunk(
    'admin/deleteConfig',
    async ({ configId }) => {
        return { configId };
    }
);

const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllUsers.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchAllUsers.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.users = action.payload;
            })
            .addCase(fetchAllUsers.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            .addCase(fetchDoctors.fulfilled, (state, action) => {
                state.doctors = action.payload;
            })
            .addCase(fetchSpecialties.fulfilled, (state, action) => {
                state.specialties = action.payload;
            })
            .addCase(fetchAppointments.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchAppointments.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.appointments = action.payload;
            })
            .addCase(fetchAppointments.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            .addCase(fetchConfigs.fulfilled, (state, action) => {
                state.configs = action.payload;
            })
            .addCase(updateUserStatus.fulfilled, (state, action) => {
                const { userId, status } = action.payload;
                state.users = state.users.map((u) =>
                    u.id === userId ? { ...u, status } : u
                );
                state.doctors = state.doctors.map((d) =>
                    d.id === userId
                        ? { ...d, status: 'approved', is_approved: true }
                        : d
                );
            })
            .addCase(addSpecialty.fulfilled, (state, action) => {
                state.specialties.unshift(action.payload);
            })
            .addCase(updateSpecialty.fulfilled, (state, action) => {
                const { specialtyId, name, description } = action.payload;
                state.specialties = state.specialties.map((s) =>
                    s.id === specialtyId ? { ...s, name, description } : s
                );
            })
            .addCase(deleteSpecialty.fulfilled, (state, action) => {
                state.specialties = state.specialties.filter(
                    (s) => s.id !== action.payload.specialtyId
                );
            })
            // BUG FIX #4: حفظ كل الحقول المحدثة صح
            .addCase(updateDoctorProfile.fulfilled, (state, action) => {
                const { doctorId, specialty, bio, consultationFee, location, phone, status } = action.payload;
                state.doctors = state.doctors.map((d) =>
                    d.id === doctorId
                        ? {
                              ...d,
                              bio,
                              specialty_name: specialty,
                              consultation_fee: consultationFee,
                              clinic_address: location,
                              clinic_phone: phone,
                              status: status || d.status,
                              is_approved: status === 'approved' ? true : d.is_approved,
                          }
                        : d
                );
            })
            .addCase(addConfig.fulfilled, (state, action) => {
                state.configs.unshift(action.payload);
            })
            .addCase(updateConfig.fulfilled, (state, action) => {
                const { configId, key, value } = action.payload;
                state.configs = state.configs.map((c) =>
                    c.id === configId ? { ...c, key, value } : c
                );
            })
            .addCase(deleteConfig.fulfilled, (state, action) => {
                state.configs = state.configs.filter(
                    (c) => c.id !== action.payload.configId
                );
            });
    },
});

export default adminSlice.reducer;