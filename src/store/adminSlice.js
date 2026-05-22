import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';

const initialState = {
  users: [],
  doctors: [],
  specialties: [],
  appointments: [],
  configs: [],
  status: 'idle',
  error: null,
};

export const fetchAllUsers = createAsyncThunk('admin/fetchAllUsers', async () => {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
});

export const fetchDoctors = createAsyncThunk('admin/fetchDoctors', async () => {
  const usersQuery = query(collection(db, 'users'), where('role', '==', 'doctor'));
  const usersSnapshot = await getDocs(usersQuery);
  const profilesSnapshot = await getDocs(collection(db, 'doctors_profiles'));
  const profiles = new Map(profilesSnapshot.docs.map((docSnap) => [docSnap.id, docSnap.data()]));

  return usersSnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
    profile: profiles.get(docSnap.id) || {},
  }));
});

export const fetchSpecialties = createAsyncThunk('admin/fetchSpecialties', async () => {
  const snapshot = await getDocs(collection(db, 'specialties'));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
});

export const fetchAppointments = createAsyncThunk('admin/fetchAppointments', async () => {
  const snapshot = await getDocs(collection(db, 'appointments'));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
});

export const fetchConfigs = createAsyncThunk('admin/fetchConfigs', async () => {
  const snapshot = await getDocs(collection(db, 'system_configs'));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
});

export const updateUserStatus = createAsyncThunk(
  'admin/updateUserStatus',
  async ({ userId, status }) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { status });
    return { userId, status };
  }
);

export const addSpecialty = createAsyncThunk('admin/addSpecialty', async ({ name, description }) => {
  const docRef = await addDoc(collection(db, 'specialties'), {
    name,
    description,
    createdAt: new Date(),
  });
  return { id: docRef.id, name, description };
});

export const updateSpecialty = createAsyncThunk(
  'admin/updateSpecialty',
  async ({ specialtyId, name, description }) => {
    const specialtyRef = doc(db, 'specialties', specialtyId);
    await updateDoc(specialtyRef, { name, description });
    return { specialtyId, name, description };
  }
);

export const deleteSpecialty = createAsyncThunk('admin/deleteSpecialty', async ({ specialtyId }) => {
  const specialtyRef = doc(db, 'specialties', specialtyId);
  await deleteDoc(specialtyRef);
  return { specialtyId };
});

export const updateDoctorProfile = createAsyncThunk(
  'admin/updateDoctorProfile',
  async ({ doctorId, specialty, bio, status, consultationFee, location, phone }) => {
    const profileRef = doc(db, 'doctors_profiles', doctorId);
    await setDoc(
      profileRef,
      {
        doctor_id: doctorId,
        specialty,
        bio,
        consultationFee: Number(consultationFee) || 0,
        location,
        phone,
      },
      { merge: true }
    );
    if (status) {
      const userRef = doc(db, 'users', doctorId);
      await updateDoc(userRef, { status });
    }
    return { doctorId, specialty, bio, status, consultationFee: Number(consultationFee) || 0, location, phone };
  }
);

export const addConfig = createAsyncThunk('admin/addConfig', async ({ configKey, configValue }) => {
  const docRef = await addDoc(collection(db, 'system_configs'), {
    key: configKey,
    value: configValue,
    createdAt: new Date(),
  });
  return { id: docRef.id, key: configKey, value: configValue };
});

export const updateConfig = createAsyncThunk(
  'admin/updateConfig',
  async ({ configId, key, value }) => {
    const configRef = doc(db, 'system_configs', configId);
    await updateDoc(configRef, { key, value });
    return { configId, key, value };
  }
);

export const deleteConfig = createAsyncThunk('admin/deleteConfig', async ({ configId }) => {
  const configRef = doc(db, 'system_configs', configId);
  await deleteDoc(configRef);
  return { configId };
});

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
        state.users = state.users.map((user) => (user.id === userId ? { ...user, status } : user));
        state.doctors = state.doctors.map((doctor) =>
          doctor.id === userId ? { ...doctor, status } : doctor
        );
      })
      .addCase(addSpecialty.fulfilled, (state, action) => {
        state.specialties.unshift(action.payload);
      })
      .addCase(updateSpecialty.fulfilled, (state, action) => {
        const { specialtyId, name, description } = action.payload;
        state.specialties = state.specialties.map((item) =>
          item.id === specialtyId ? { ...item, name, description } : item
        );
      })
      .addCase(deleteSpecialty.fulfilled, (state, action) => {
        state.specialties = state.specialties.filter((item) => item.id !== action.payload.specialtyId);
      })
      .addCase(updateDoctorProfile.fulfilled, (state, action) => {
        const { doctorId, specialty, bio, status, consultationFee, location, phone } = action.payload;
        state.doctors = state.doctors.map((doctor) =>
          doctor.id === doctorId
            ? {
                ...doctor,
                profile: { ...doctor.profile, specialty, bio, consultationFee, location, phone },
                status: status || doctor.status,
              }
            : doctor
        );
        if (status) {
          state.users = state.users.map((user) =>
            user.id === doctorId ? { ...user, status } : user
          );
        }
      })
      .addCase(addConfig.fulfilled, (state, action) => {
        state.configs.unshift(action.payload);
      })
      .addCase(updateConfig.fulfilled, (state, action) => {
        const { configId, key, value } = action.payload;
        state.configs = state.configs.map((config) =>
          config.id === configId ? { ...config, key, value } : config
        );
      })
      .addCase(deleteConfig.fulfilled, (state, action) => {
        state.configs = state.configs.filter((config) => config.id !== action.payload.configId);
      });
  },
});

export default adminSlice.reducer;
